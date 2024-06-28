import React, {useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {createStackNavigator} from '@react-navigation/stack';
import SuccessUploads from './src/pages/SuccessUploads';
import PendingImages from './src/pages/PendingImages';
import Logger from './src/pages/Logger';
// import {NavigationContainer} from '@react-navigation/native';
import TakePictureButton from './src/components/TakePictureButton';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {GlobalProvider} from './src/contexts/GlobalContext';

const Tab = createBottomTabNavigator();

// const {Navigator, Screen} = createStackNavigator();

function App(): React.JSX.Element {
  // const [images, setImages] = useState<any[]>([]);

  return (
    <GlobalProvider>
      <View style={styles.container}>
        <View style={styles.mainContent}>
          {/* Your main content goes here */}
        </View>
        <View style={styles.footer}>
          <NavigationContainer>
            <Tab.Navigator initialRouteName="Upload">
              <Tab.Screen name="Logger" component={Logger} />
              <Tab.Screen name="Pending" component={PendingImages} />
              <Tab.Screen name="Success" component={SuccessUploads} />
              <Tab.Screen name="Upload" component={TakePictureButton} />
            </Tab.Navigator>
          </NavigationContainer>
        </View>
      </View>
    </GlobalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
  },
  footer: {
    flex: 70,
  },
});

export default App;
