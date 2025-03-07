import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import SuccessUploads from './src/pages/SuccessUploads';
import PendingImages from './src/pages/PendingImages';
import Logger from './src/pages/Logger';
import TakePictureButton from './src/components/TakePictureButton';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {GlobalContext} from './src/contexts/GlobalContext';
import usePending from './src/hooks/usePending';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import {formatDate} from './src/lib';
const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  const {tasks, setLogger, formattedDate} = useContext(GlobalContext);
  const {getImagePending, sendImagePending} = usePending();

  const initSendPending = async () => {
    const fiveSecs = 1 * 60 * 1000;

    const log = async () => {
      await setLogger(logger => [
        ...logger,
        {
          key: 'initSendPending Start',
          value: '',
          time: formatDate(new Date()),
        },
      ]);
    };

    const sendPending = async () => {
      try {
        await sendImagePending();
      } catch (err) {
        console.log('err', err);
        await setLogger(logger => [
          ...logger,
          {
            key: 'Error initSendPending',
            value: `${JSON.stringify(err)}`,
            time: formattedDate,
          },
        ]);
      }
    };

    const sendPendingInterval = () => {
      setTimeout(async () => {
        await sendPending();
        sendPendingInterval();
      }, fiveSecs);
    };

    log();
    await sendPending();
    sendPendingInterval();
  };

  useEffect(() => {
    initSendPending();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}></View>
      <View style={styles.footer}>
        <NavigationContainer>
          <Tab.Navigator initialRouteName="Upload">
            <Tab.Screen name="Logger" component={Logger} />
            <Tab.Screen name="Pending" component={PendingImages} />
            <Tab.Screen name="Success" component={SuccessUploads} />
            <Tab.Screen name="Upload" component={TakePictureButton} />
            {/* <Tab.Screen
                name="Form"
                component={ViewForm}
                options={{
                  tabBarButton: () => null,
                }}
              /> */}
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </View>
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
  tabBar: {
    backgroundColor: '#ffffff',
  },
});

export default App;
