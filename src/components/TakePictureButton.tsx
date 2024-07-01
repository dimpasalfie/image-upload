import React, {Fragment, useContext, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Button,
  Alert,
} from 'react-native';
import {scale} from '../types/common';
import {
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import {useNetInfo} from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import CryptoJS from 'crypto-js';
import {Buffer} from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GlobalContext} from '../contexts/GlobalContext';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import {formatDate} from '../lib';
import {useNavigation} from '@react-navigation/native';

const TakePictureButton = () => {
  const netInfo = useNetInfo();
  const globalContext = useContext(GlobalContext);
  const {
    capturedImages,
    setCapturedImages,
    setLogger,
    formattedDate,
    s3,
    setSuccessUploads,
    setPendingUploads,
  } = globalContext;
  const [opened, setOpened] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigation();
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

  const generateChecksum = async (base64: string) => {
    const buffer = Buffer.from(base64, 'base64');
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    const hash = CryptoJS.MD5(wordArray).toString();

    return hash;
  };

  const handleImage = async (source: 'camera' | 'gallery') => {
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

      const destinationPath = `${RNFS.PicturesDirectoryPath}/${name}`;
      await RNFS.writeFile(destinationPath, base64, 'base64');
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

      const checksum = await generateChecksum(base64);

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

      const fileData = {
        uri: `file://${destinationPath}`,
        type: type,
        name: name,
      };

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
          value: `${JSON.stringify(netInfo.isInternetReachable)}`,
          time: formatDate(new Date()),
        },
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Internet Connection Connected?',
          value: `${JSON.stringify(netInfo.isConnected)}`,
          time: formatDate(new Date()),
        },
      ]);

      if (!netInfo.isInternetReachable || !netInfo.isConnected) {
        await setPendingUploads((pendingUploads: string) => [
          ...pendingUploads,
          fileData.uri,
        ]);
        return await storeImageToPending(fileData.name, destinationPath);
      }

      const fileBuffer = Buffer.from(base64, 'base64');

      const uploadParams: any = {
        Bucket: 'ab1-upload-image',
        Key: name,
        Body: fileBuffer,
        ContentType: type,
      };

      setCapturedImages((capturedImages: any) => [...capturedImages, fileData]);

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
          key: 'Image Upload Result',
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
        setSuccessUploads((successUploads: any) => [
          ...successUploads,
          result.Location,
        ]);
      }
    } catch (err) {
      await setLogger(logger => [
        ...logger,
        {
          key: 'Error during image handling',
          value: `${JSON.stringify(err)}`,
          time: formatDate(new Date()),
        },
      ]);
      return {err};
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (capturedImages.length === 0) return;

      Alert.alert(
        `Success`,
        `Images has been added`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigate.navigate('Tasks');
            },
          },
        ],
        {cancelable: false},
      );

      setCapturedImages([]);
    } catch (err) {
      console.log('err', err);
    }
  };

  const renderItem = ({item}: any) => (
    <Image
      style={styles.image}
      source={{uri: `file://${item.uri}`}}
      onError={e => console.error(`Failed to load image: ${item.uri}`, e)}
    />
  );

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
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
        </TouchableOpacity>
        <FlatList
          data={capturedImages}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
          contentContainerStyle={styles.grid}
        />
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button title="Refresh" onPress={() => setCapturedImages([])} />
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
});
export default TakePictureButton;
