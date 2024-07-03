import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Image, Button} from 'react-native';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PendingImages = () => {
  const [images, setImages] = useState<any[]>([]);
  const tenant = 'agam';

  const getPendingImages = async () => {
    try {
      const imagesJSON = await AsyncStorage.getItem(`pendingImages-${tenant}`);
      const imageList = imagesJSON ? JSON.parse(imagesJSON) : [];
      setImages(imageList);
    } catch (error) {
      console.log('Error retrieving images:', error);
    }
  };

  useEffect(() => {
    getPendingImages();
  }, [tenant]);

  const renderItem = ({item}: {item: string}) => (
    <Image
      style={styles.image}
      source={{uri: `file://${item.filePath}`}}
      onError={e => console.log(`Failed to load image: ${item}`, e)}
    />
  );

  const reloadPage = () => {
    getPendingImages();
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.button}>
        <Button title="Reload Page" onPress={reloadPage} />
      </View>
      {images.length === 0 ? (
        <View style={styles.isEmpty}>
          <Text style={styles.textEmpty}>No Data Available</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
          contentContainerStyle={styles.grid}
        />
      )}
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
});

export default PendingImages;
