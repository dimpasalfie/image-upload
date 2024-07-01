import React, {useContext, useEffect, useState} from 'react';
import {ScrollView, View, Text, StyleSheet, Image, Button} from 'react-native';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import {GlobalContext} from '../contexts/GlobalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PendingImages = () => {
  const {pendingUploads, setPendingUploads} = useContext(GlobalContext);

  const renderItem = ({item}: any) => (
    <Image
      style={styles.image}
      source={{uri: item}}
      onError={e => console.error(`Failed to load image: ${item.uri}`, e)}
    />
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.button}>
        <Button title="Clear Images" onPress={() => setPendingUploads([])} />
      </View>
      {pendingUploads.length === 0 ? (
        <View style={styles.isEmpty}>
          <Text style={styles.textEmpty}>No Data Available</Text>
        </View>
      ) : (
        <FlatList
          data={pendingUploads}
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
