import React, {useContext} from 'react';
import {ScrollView, View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GlobalContext} from '../contexts/GlobalContext';
import {useNavigation} from '@react-navigation/native';
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from 'react-native-gesture-handler';

const SuccessUploads = () => {
  const {tasks} = useContext(GlobalContext);
  const navigation = useNavigation();

  const navigateToViewForm = (item: any) => {
    navigation.navigate('Form', {item});
  };

  const handleNavigation = (item: any) => {
    navigateToViewForm(item);
  };

  return (
    <GestureHandlerRootView>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}>
        {tasks.map((item: any, index: number) => {
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.box}
              onPress={() => handleNavigation(item)}>
              <View style={styles.boxHeader}>
                <Text style={styles.boxTitle}>Task ID: {item.id}</Text>
                <Text># of images - {item.images.length}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
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
});

export default SuccessUploads;
