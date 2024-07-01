import React, {useEffect, useState} from 'react';
import {Button, Image, StyleSheet, Text, View} from 'react-native';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import {scale} from '../types/common';
import RNFS from 'react-native-fs';

const ViewForm = ({route}: any) => {
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const {item} = route.params;

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const files = await RNFS.readDir(RNFS.PicturesDirectoryPath);

        const filteredImages = files.filter(file =>
          file.name.startsWith(`${item.id}_`),
        );

        const paths = filteredImages.map(image => image.path);
        setImagePaths(paths);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, [item.id]);

  const renderItem = ({item}: any) => (
    <View style={styles.imageContainer}>
      <Image
        style={styles.image}
        source={{uri: `file://${item}`}}
        onError={e => console.error(`Failed to load image: ${item}`, e)}
      />
    </View>
  );

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View>
          <Text style={styles.text}>Task ID: {item.id}</Text>
        </View>
        <FlatList
          data={imagePaths}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
          contentContainerStyle={styles.grid}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  grid: {
    justifyContent: 'center',
  },
  text: {
    fontSize: 25,
  },
  imageContainer: {
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
});
export default ViewForm;
