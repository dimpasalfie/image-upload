import React, {Fragment, useContext, useState} from 'react';
import {View, TouchableOpacity, StyleSheet, Image} from 'react-native';
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
import {uploadFileService} from '../api';
import {GlobalContext} from '../contexts/GlobalContext';
import {GestureHandlerRootView, ScrollView} from 'react-native-gesture-handler';

const TakePictureButton = () => {
  const globalContext = useContext(GlobalContext);
  const [opened, setOpened] = useState(false);
  const netInfo = useNetInfo();

  const {capturedImages, setCapturedImages} = globalContext;

  console.log('capturedImages', capturedImages);

  const storeImageToPending = async (fileName: string, imagePath: string) => {
    const pendingImages = await AsyncStorage.getItem('pendingImages');

    const pendingImagesJson = pendingImages ? JSON.parse(pendingImages) : [];
    pendingImagesJson.push({name: fileName, path: imagePath});

    await AsyncStorage.setItem(
      'pendingImages',
      JSON.stringify(pendingImagesJson),
    );
  };

  const generateTaskId = () => {
    const date = new Date();
    const seed = date.getTime();
    const randomDigits = Math.floor(Math.random() * 10000);
    const taskId = (seed + randomDigits) % 10000;
    return taskId;
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
      )
        return;

      const name = response.assets[0].fileName;
      const base64 = response.assets[0].base64;
      const path = response.assets[0].uri;
      const type = response.assets[0].type;

      if (!base64 || !path) return;

      const taskId = generateTaskId();
      console.log('taskId', taskId);

      const destinationPath = `${RNFS.PicturesDirectoryPath}/${taskId}_${name}`;
      await RNFS.writeFile(destinationPath, base64, 'base64');
      await RNFS.scanFile(destinationPath);

      const checksum = await generateChecksum(base64);
      if (!checksum) return;

      const fileData = {
        uri: destinationPath,
        type: type,
        name: name,
      };
      // const exists = await RNFS.exists(destinationPath);
      if (!netInfo.isInternetReachable || !netInfo.isConnected) {
        return await storeImageToPending(
          `task/${taskId}/${fileData.name}`,
          destinationPath,
        );
      }

      //   const timeoutValue = 'timeout';
      //   const timeout = new Promise((res, rej) => {
      //     const tensecs = 10 * 1000;
      //     setTimeout(() => res(timeoutValue), tensecs);
      //   });

      //   const result = await Promise.race([
      //     timeout,
      //     uploadFileService(
      //       'idToken',
      //       `task/${taskId}/${fileData.name}`,
      //       fileData,
      //       checksum,
      //     ),
      //   ]);

      //   if (result === timeoutValue || result.error) {
      //     await storeImageToPending(
      //       `task/${taskId}/${fileData.name}`,
      //       destinationPath,
      //     );
      //   }

      setCapturedImages([...capturedImages, fileData]);
    } catch (err) {
      return {err};
    }
  };

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

        <ScrollView horizontal>
          {capturedImages.map((image: any, index: number) => (
            <Image
              key={index}
              style={{width: 100, height: 100, margin: 10}}
              source={{uri: image.uri}}
            />
          ))}
        </ScrollView>
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
});
export default TakePictureButton;
