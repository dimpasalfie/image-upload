import React, {Fragment, useContext, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Button,
  Alert,
  Text,
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
import {uploadFileService, uploadFileToService} from '../api';
import {GlobalContext} from '../contexts/GlobalContext';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import SelectDropdown from 'react-native-select-dropdown';

const TakePictureButton = () => {
  const netInfo = useNetInfo();
  const navigate = useNavigation();
  const globalContext = useContext(GlobalContext);
  const {
    capturedImages,
    setCapturedImages,
    tasks,
    setTasks,
    setLogger,
    formattedDate,
    IdToken,
  } = globalContext;
  const [opened, setOpened] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(
    undefined,
  );

  const storeImageToPending = async (fileName: string, imagePath: string) => {
    const pendingImages = await AsyncStorage.getItem('pendingImages');

    const pendingImagesJson = pendingImages ? JSON.parse(pendingImages) : [];
    pendingImagesJson.push({name: fileName, path: imagePath});

    await AsyncStorage.setItem(
      'pendingImages',
      JSON.stringify(pendingImagesJson),
    );

    setLogger(logger => [
      ...logger,
      {
        key: 'Stored Image To LocalStorage',
        value: `${JSON.stringify({name: fileName, path: imagePath})}`,
        time: formattedDate,
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
      const methodMap = {
        camera: launchCamera,
        gallery: launchImageLibrary,
      };

      await setLogger(logger => [
        ...logger,
        {key: 'Initialized', value: source, time: formattedDate},
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
          {key: 'Assets is null', value: response.assets, time: formattedDate},
        ]);
        return;
      }

      const name = response.assets[0].fileName;
      const base64 = response.assets[0].base64;
      const path = response.assets[0].uri;
      const type = response.assets[0].type;

      if (!base64 || !path) return;

      const destinationPath = `${RNFS.PicturesDirectoryPath}/${selectedTaskId}_${name}`;
      await RNFS.writeFile(destinationPath, base64, 'base64');
      await RNFS.scanFile(destinationPath);
      const exists = await RNFS.exists(destinationPath);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Image Saved Locally?',
          value: `${JSON.stringify(exists)}`,
          time: formattedDate,
        },
      ]);

      const checksum = await generateChecksum(base64);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Checksum',
          value: `${JSON.stringify(checksum)}`,
          time: formattedDate,
        },
      ]);

      if (!checksum) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'No Provided Checksum',
            value: '',
            time: formattedDate,
          },
        ]);
        return;
      }

      const fileData = {
        uri: destinationPath,
        type: type,
        name: name,
      };

      await setLogger(logger => [
        ...logger,
        {
          key: 'File Data',
          value: `${JSON.stringify(fileData)}`,
          time: formattedDate,
        },
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Internet Connection Reachable?',
          value: `${JSON.stringify(netInfo.isInternetReachable)}`,
          time: formattedDate,
        },
      ]);

      await setLogger(logger => [
        ...logger,
        {
          key: 'Is Internet Connection Connected?',
          value: `${JSON.stringify(netInfo.isConnected)}`,
          time: formattedDate,
        },
      ]);

      if (!netInfo.isInternetReachable || !netInfo.isConnected) {
        return await storeImageToPending(
          `task/${selectedTaskId}/${fileData.name}`,
          destinationPath,
        );
      }

      const timeoutValue = 'timeout';
      const timeout = new Promise((res, rej) => {
        const tensecs = 10 * 1000;
        setTimeout(() => res(timeoutValue), tensecs);
      });

      const result = await Promise.race([
        timeout,
        uploadFileToService(
          IdToken,
          `task/${selectedTaskId}/${fileData.name}`,
          fileData,
          checksum,
        ),
      ]);

      console.log('result', JSON.stringify(result));

      await setLogger(logger => [
        ...logger,
        {
          key: 'Image Upload Result',
          value: `${JSON.stringify(result)}`,
          time: formattedDate,
        },
      ]);

      if (result === timeoutValue || result.error) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Result is error or has reached timeout',
            value: `${JSON.stringify(result)}`,
            time: formattedDate,
          },
        ]);
        await storeImageToPending(
          `task/${selectedTaskId}/${fileData.name}`,
          destinationPath,
        );
      }

      setCapturedImages((capturedImages: any) => [...capturedImages, fileData]);
    } catch (err) {
      await setLogger(logger => [
        ...logger,
        {
          key: 'Error during image handling',
          value: `${JSON.stringify(err)}`,
          time: formattedDate,
        },
      ]);
      return {err};
    }
  };

  const handleSubmit = async () => {
    try {
      if (capturedImages.length === 0) return;
      let images = [];
      for (const image of capturedImages) {
        images.push(image.name);
      }

      const task = tasks.find((item: any) => item.id === selectedTaskId);
      const updatedTasks = tasks.map((task: any) =>
        task.id === selectedTaskId ? {...task, images: images} : task,
      );

      setTasks(updatedTasks);

      Alert.alert(
        `Success`,
        `Task ID ${task.id} has been added`,
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

  const handleTaskChange = (index: number) => {
    setSelectedTaskId(index);
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
            setOpened(!opened);
            handleImage('camera');
          }}>
          <Image
            style={[styles.ico]}
            source={require('../assets/tmp/camera-ico.png')}
          />
        </TouchableOpacity>
        <SelectDropdown
          data={tasks}
          onSelect={(selectedItem, index) => {
            handleTaskChange(selectedItem.id);
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <View style={styles.dropdownButtonStyle}>
                <Text style={styles.dropdownButtonTxtStyle}>
                  {(selectedItem && `Task ID: ${selectedItem.id}`) ||
                    'Select Task ID'}
                </Text>
                <Text style={styles.dropdownButtonArrowStyle}>
                  {isOpened ? '▲' : '▼'}
                </Text>
              </View>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <View
                style={{
                  ...styles.dropdownItemStyle,
                  ...(isSelected && {backgroundColor: '#D2D9DF'}),
                }}>
                <Text style={styles.dropdownItemTxtStyle}>
                  Task ID: {item.id}
                </Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
        />
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
          <View style={styles.buttonContainer}>
            <Button title="Submit" onPress={handleSubmit} />
          </View>
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
