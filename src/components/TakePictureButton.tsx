import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Button,
  ActivityIndicator,
  Text,
} from 'react-native';
import {scale} from '../types/common';
import {
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import CryptoJS from 'crypto-js';
import {Buffer} from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GlobalContext} from '../contexts/GlobalContext';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import {formatDate} from '../lib';
import ImageResizer from 'react-native-image-resizer';
import {Video as VideoCompressor} from 'react-native-compressor';
import VideoPlayer from 'react-native-media-console';
import VideoModal from './VideoModal';

const TakePictureButton = () => {
  const globalContext = useContext(GlobalContext);
  const {
    capturedImages,
    setCapturedImages,
    setLogger,
    s3,
    setPendingUploads,
    isConnected,
  } = globalContext;
  const [opened, setOpened] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSelected, setIsSelected] = useState('');
  const [isReady, setIsReady] = useState(false);
  const tenant = 'agam';

  const storeImageToPending = async (fileName: string, imagePath: string) => {
    const pendingImages = await AsyncStorage.getItem(`pendingImages-${tenant}`);

    const pendingImagesJson = pendingImages ? JSON.parse(pendingImages) : [];
    pendingImagesJson.push({name: fileName, filePath: imagePath});

    await AsyncStorage.setItem(
      `pendingImages-${tenant}`,
      JSON.stringify(pendingImagesJson),
    );

    setLogger(logger => [
      ...logger,
      {
        key: 'Stored image to local storage',
        value: `${JSON.stringify({name: fileName, filePath: imagePath})}`,
        time: formatDate(new Date()),
      },
    ]);
  };

  const storeSuccessUploads = async (imagePath: string) => {
    const successImages = await AsyncStorage.getItem(`successImages-${tenant}`);

    const succcessImages = successImages ? JSON.parse(successImages) : [];
    succcessImages.push(imagePath);

    await AsyncStorage.setItem(
      `successImages-${tenant}`,
      JSON.stringify(succcessImages),
    );
  };

  const generateChecksum = async (base64: string) => {
    const buffer = Buffer.from(base64, 'base64');
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    const hash = CryptoJS.MD5(wordArray).toString();

    return hash;
  };

  const handleImage = async (source: 'camera' | 'gallery') => {
    let fileData: {uri: string; type: string; name: string};
    let localFilePath: string;

    try {
      setIsProcessing(true);
      const methodMap = {
        camera: launchCamera,
        gallery: launchImageLibrary,
      };

      await setLogger(logger => [
        ...logger,
        {key: 'Initialized', value: source, time: formatDate(new Date())},
      ]);

      const response: ImagePickerResponse = await methodMap[source]({
        title: 'Select Image',
        customButtons: [
          {
            name: 'customOptionKey',
            title: 'Choose file from Custom Option',
          },
        ],
        includeBase64: true,
        storageOptions: {
          skipBackup: true,
          path: 'images',
          didCancel: true,
        },
      });

      if (
        response.assets == null ||
        response.assets.length < 1 ||
        response.didCancel
      ) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Assets is null',
            value: response.assets,
            time: formatDate(new Date()),
          },
        ]);
        return;
      }

      const name = response.assets[0].fileName;
      const base64 = response.assets[0].base64;
      const path = response.assets[0].uri;
      const type = response.assets[0].type;

      if (!base64 || !path) return;

      setCapturedImages((capturedImages: any) => [...capturedImages, path]);

      setIsProcessing(false);

      const resizedImage = await ImageResizer.createResizedImage(
        path,
        2000,
        2000,
        'JPEG',
        100,
      );

      const destinationPath = `${RNFS.PicturesDirectoryPath}/${name}`;
      localFilePath = destinationPath;
      const resizedBase64 = await RNFS.readFile(resizedImage.uri, 'base64');
      await RNFS.writeFile(destinationPath, resizedBase64, 'base64');
      await RNFS.scanFile(destinationPath);
      const exists = await RNFS.exists(destinationPath);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Image Saved Locally?',
          value: `${JSON.stringify(exists)}`,
          time: formatDate(new Date()),
        },
      ]);

      const checksum = await generateChecksum(resizedBase64);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Checksum',
          value: `${JSON.stringify(checksum)}`,
          time: formatDate(new Date()),
        },
      ]);

      if (!checksum) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'No Provided Checksum',
            value: '',
            time: formatDate(new Date()),
          },
        ]);
        return;
      }

      fileData = {
        uri: `file://${destinationPath}`,
        type: type,
        name: name,
      };

      // setCapturedImages((capturedImages: any) => [...capturedImages, fileData]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'File Data',
          value: `${JSON.stringify(fileData)}`,
          time: formatDate(new Date()),
        },
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Internet Connection Reachable?',
          value: `${JSON.stringify(isConnected)}`,
          time: formatDate(new Date()),
        },
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Internet Connection Connected?',
          value: `${JSON.stringify(isConnected)}`,
          time: formatDate(new Date()),
        },
      ]);

      if (!isConnected) {
        await setPendingUploads((pendingUploads: string) => [
          ...pendingUploads,
          fileData.uri,
        ]);
        return await storeImageToPending(fileData.name, destinationPath);
      }

      const fileBuffer = Buffer.from(resizedBase64, 'base64');

      const uploadParams: any = {
        Bucket: 'ab1-upload-image',
        Key: name,
        Body: fileBuffer,
        ContentType: type,
      };

      const timeoutValue = 'timeout';
      const timeout = new Promise((res, rej) => {
        const tensecs = 10 * 1000;
        setTimeout(() => res(timeoutValue), tensecs);
      });

      const result = await Promise.race([
        timeout,
        s3.upload(uploadParams).promise(),
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Image upload result from promise race',
          value: `${JSON.stringify(result)}`,
          time: formatDate(new Date()),
        },
      ]);

      if (result === timeoutValue || result.error) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Result is error or has reached timeout',
            value: `${JSON.stringify(result)}`,
            time: formatDate(new Date()),
          },
        ]);
        await storeImageToPending(fileData.name, destinationPath);
        await setPendingUploads((pendingUploads: string) => [
          ...pendingUploads,
          fileData.uri,
        ]);
      } else {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Image Uploaded Successfully!',
            value: `${JSON.stringify(result.Location)}`,
            time: formatDate(new Date()),
          },
        ]);
        await storeSuccessUploads(result.Location);
      }
    } catch (err) {
      await setLogger(logger => [
        ...logger,
        {
          key: 'Error during image handling',
          value: '',
          time: formatDate(new Date()),
        },
      ]);
      if (fileData.name && localFilePath) {
        await storeImageToPending(fileData.name, localFilePath);
      }
      return {err};
    }
  };

  const handleVideo = async (source: 'camera' | 'gallery') => {
    let fileData: {uri: string; type: string; name: string};
    let localFilePath: string;

    try {
      setIsProcessing(true);
      const methodMap = {
        camera: launchCamera,
        gallery: launchImageLibrary,
      };

      await setLogger(logger => [
        ...logger,
        {key: 'Initialized', value: source, time: formatDate(new Date())},
      ]);

      const response: ImagePickerResponse = await methodMap[source]({
        mediaType: 'video',
        presentationStyle: 'fullScreen',
        formatAsMp4: true,
        storageOptions: {
          skipBackup: true,
          path: 'videos',
          didCancel: true,
        },
        videoQuality: 'low',
        durationLimit: 60,
        thumbnail: true,
      });

      if (
        response.assets == null ||
        response.assets.length < 1 ||
        response.didCancel
      ) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Assets is null',
            value: response.assets,
            time: formatDate(new Date()),
          },
        ]);
        return;
      }

      const name = response.assets[0].fileName;
      // const base64 = response.assets[0].base64;
      const path = response.assets[0].uri;
      const type = response.assets[0].type;
      const size = response.assets[0].fileSize;

      if (!path) return;

      const compressed = await compressedFileSize(path);

      setCapturedImages((capturedImages: any) => [
        ...capturedImages,
        compressed,
      ]);

      setIsProcessing(false);

      // const resizedImage = await ImageResizer.createResizedImage(
      //   path,
      //   2000,
      //   2000,
      //   'JPEG',
      //   100,
      // );

      const CHUNK_SIZE = 1024 * 1024;

      const destinationPath = `${RNFS.PicturesDirectoryPath}/${name}`;
      localFilePath = destinationPath;

      let offset = 0;

      while (offset < size) {
        const chunkSize = Math.min(size - offset, CHUNK_SIZE);
        const chunk = await readChunk(path, offset, chunkSize);
        await RNFS.appendFile(localFilePath, chunk, 'base64');
        offset += CHUNK_SIZE;
      }

      const resizedBase64 = await RNFS.readFile(compressed, 'base64');
      await RNFS.writeFile(destinationPath, resizedBase64, 'base64');
      await RNFS.scanFile(destinationPath);
      const exists = await RNFS.exists(destinationPath);

      console.log('exists', exists);
      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Video Saved Locally?',
          value: `${JSON.stringify(exists)}`,
          time: formatDate(new Date()),
        },
      ]);

      const checksum = await generateChecksum(resizedBase64);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Video Checksum',
          value: `${JSON.stringify(checksum)}`,
          time: formatDate(new Date()),
        },
      ]);

      if (!checksum) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'No Provided Video Checksum',
            value: '',
            time: formatDate(new Date()),
          },
        ]);
        return;
      }

      fileData = {
        uri: `file://${destinationPath}`,
        type: type,
        name: name,
      };

      // setCapturedImages((capturedImages: any) => [...capturedImages, fileData]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'File Video Data',
          value: `${JSON.stringify(fileData)}`,
          time: formatDate(new Date()),
        },
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Internet Connection Reachable?',
          value: `${JSON.stringify(isConnected)}`,
          time: formatDate(new Date()),
        },
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Internet Connection Connected?',
          value: `${JSON.stringify(isConnected)}`,
          time: formatDate(new Date()),
        },
      ]);

      if (!isConnected) {
        await setPendingUploads((pendingUploads: string) => [
          ...pendingUploads,
          fileData.uri,
        ]);
        return await storeImageToPending(fileData.name, destinationPath);
      }

      const fileBuffer = Buffer.from(resizedBase64, 'base64');

      const uploadParams: any = {
        Bucket: 'ab1-upload-image',
        Key: name,
        Body: fileBuffer,
        ContentType: type,
      };

      const timeoutValue = 'timeout';
      const timeout = new Promise((res, rej) => {
        const tensecs = 10 * 1000;
        setTimeout(() => res(timeoutValue), tensecs);
      });

      const result = await Promise.race([
        timeout,
        s3.upload(uploadParams).promise(),
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Video upload result from promise race',
          value: `${JSON.stringify(result)}`,
          time: formatDate(new Date()),
        },
      ]);

      if (result === timeoutValue || result.error) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Result is error or has reached timeout',
            value: `${JSON.stringify(result)}`,
            time: formatDate(new Date()),
          },
        ]);
        await storeImageToPending(fileData.name, destinationPath);
        await setPendingUploads((pendingUploads: string) => [
          ...pendingUploads,
          fileData.uri,
        ]);
      } else {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Video Uploaded Successfully!',
            value: `${JSON.stringify(result.Location)}`,
            time: formatDate(new Date()),
          },
        ]);
        await storeSuccessUploads(result.Location);
      }
    } catch (err) {
      await setLogger(logger => [
        ...logger,
        {
          key: 'Error during video handling',
          value: '',
          time: formatDate(new Date()),
        },
      ]);
      if (fileData.name && localFilePath) {
        await storeImageToPending(fileData.name, localFilePath);
      }
      return {err};
    }
  };

  const readChunk = async (fileUri: string, offset: number, length: number) => {
    try {
      const chunk = await RNFS.read(fileUri, length, offset, 'base64');
      return chunk;
    } catch (err) {
      console.error('Error reading file chunk:', err);
      throw err;
    }
  };

  const compressedFileSize = async file => {
    const compressedVideo = await VideoCompressor.compress(
      file,
      {
        compressionMethod: 'auto',
      },
      progress => {
        // console.log('Compression Progress: ', progress);
      },
    );
    console.log('compressedVideo', compressedVideo);
    return compressedVideo;
  };

  const renderItem = ({item}: any) => {
    console.log('item', item);
    const uriFileExtension = getUriFileExtension(item);

    console.log('sdfsd', uriFileExtension === 'mp4');

    return uriFileExtension === 'mp4' ? (
      <View style={styles.videoMinify}>
        <VideoPlayer
          doubleTapTime={0}
          paused={true}
          repeat={false}
          resizeMode="contain"
          isFullscreen={true}
          // onLoad={() => setIsReady(true)}
          source={{uri: item}}
          disablePlayPause
          disableSeekbar
          disableBack
          disableVolume
          disableFullscreen
          disableTimer
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 999999999,
          }}>
          <TouchableOpacity
            style={{
              alignItems: 'center',
              top: scale(100),
            }}
            onPress={() => setIsSelected(item)}>
            <Image
              style={{
                marginRight: scale(10),
                width: scale(65),
                height: scale(65),
              }}
              source={require('../assets/play.png')}
            />
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      <Image
        style={styles.image}
        source={{uri: `file://${item}`}}
        onError={e => console.error(`Failed to load image: ${item}`, e)}
      />
    );
  };

  const getUriFileExtension = url => {
    const fileExtension = url.split('.').pop().toLowerCase();
    return fileExtension.split('?')[0];
  };

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-evenly',
          }}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              if (!isProcessing) {
                setOpened(!opened);
                handleImage('camera');
              }
            }}
            disabled={isProcessing}>
            <Image
              style={[styles.ico]}
              source={require('../assets/tmp/camera-ico.png')}
            />
            <Text> Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              if (!isProcessing) {
                setOpened(!opened);
                handleVideo('camera');
              }
            }}
            disabled={isProcessing}>
            <Image
              style={[styles.ico]}
              source={require('../assets/tmp/camera-ico.png')}
            />
            <Text> Video</Text>
          </TouchableOpacity>
        </View>
        {isProcessing ? (
          <View style={styles.activityIndicator}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : !isSelected ? (
          <FlatList
            data={capturedImages}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            contentContainerStyle={styles.grid}
          />
        ) : (
          <VideoModal src={isSelected} setEmptySrc={setIsSelected} />
        )}
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button
              title="Clear images"
              onPress={() => setCapturedImages([])}
            />
          </View>
          {/* <View style={styles.buttonContainer}>
            <Button title="Submit" onPress={() => handleSubmit()} />
          </View> */}
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(20),
  },
  btn: {
    backgroundColor: '#3ABEE0',
    padding: scale(30),
    height: 'auto',
    alignItems: 'center',
    borderRadius: scale(15),
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scale(100),
    marginBottom: scale(40),
    resizeMode: 'contain',
  },
  ico: {
    width: scale(70),
    height: scale(70),
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    justifyContent: 'center',
  },
  image: {
    width: 120,
    height: 150,
    margin: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  dropdownButtonStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '80%',
  },
  dropdownButtonTxtStyle: {
    fontSize: 16,
  },
  dropdownButtonArrowStyle: {
    fontSize: 16,
  },
  dropdownItemStyle: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  dropdownItemTxtStyle: {
    fontSize: 16,
  },
  dropdownMenuStyle: {
    marginTop: 2,
    width: '80%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedText: {
    marginTop: 20,
    fontSize: 18,
  },
  activityIndicator: {
    flex: 1,
  },
  videoMinify: {
    marginTop: scale(5),
    height: scale(385),
    width: scale(260),
    marginRight: scale(30),
    borderWidth: 1,
    borderColor: '#aaa',
  },
});
export default TakePictureButton;
