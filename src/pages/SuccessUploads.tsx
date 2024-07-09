import React, {useEffect, useMemo, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Button,
  TouchableOpacity,
} from 'react-native';
import {GlobalContext} from '../contexts/GlobalContext';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoPlayer from 'react-native-media-console';
import {scale} from '../types/common';
import VideoModal from '../components/VideoModal';

const SuccessUploads = () => {
  const [images, setImages] = useState<any[]>([]);
  const [isSelected, setIsSelected] = useState('');
  const tenant = 'agam';

  const getSuccessUploads = async () => {
    try {
      const imagesJSON = await AsyncStorage.getItem(`successImages-${tenant}`);
      const imageList = imagesJSON ? JSON.parse(imagesJSON) : [];
      setImages(imageList);
    } catch (error) {
      console.error('Error retrieving images:', error);
    }
  };

  useEffect(() => {
    getSuccessUploads();
  }, []);

  const renderItem = ({item}: any) => {
    const uriFileExtension = getUriFileExtension(item);

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
        source={{uri: item}}
        onError={e => console.error(`Failed to load image: ${item}`, e)}
      />
    );

    // <Image
    //   style={styles.image}
    //   source={{uri: item}}
    //   onError={e => console.error(`Failed to load image: ${item.uri}`, e)}
    // />
  };

  const getUriFileExtension = url => {
    const fileExtension = url.split('.').pop().toLowerCase();
    return fileExtension.split('?')[0];
  };

  const handleRemoveItems = async () => {
    try {
      await AsyncStorage.removeItem(`successImages-${tenant}`);
      setImages([]);
    } catch (error) {
      console.error('Error clearing images:', error);
    }
  };

  const reloadPage = () => {
    getSuccessUploads();
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {images.length === 0 ? (
        <View style={styles.isEmpty}>
          <Text style={styles.textEmpty}>No Data Available</Text>
        </View>
      ) : !isSelected ? (
        <FlatList
          data={images}
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
          <View>
            <Button title="Reload Page" onPress={reloadPage} />
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <View>
            <Button title="Clear Images" onPress={handleRemoveItems} />
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 10,
  },
  box: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  imageCount: {
    fontSize: 14,
    color: '#555',
  },
  boxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  grid: {
    justifyContent: 'center',
  },
  image: {
    width: 120,
    height: 150,
    margin: 3,
  },
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 9999,
  },
  isEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textEmpty: {
    fontSize: 30,
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
  videoMinify: {
    marginTop: scale(5),
    height: scale(385),
    width: scale(260),
    marginRight: scale(30),
    borderWidth: 1,
    borderColor: '#aaa',
  },
});

export default SuccessUploads;
