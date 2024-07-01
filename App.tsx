import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import SuccessUploads from './src/pages/SuccessUploads';
import PendingImages from './src/pages/PendingImages';
import Logger from './src/pages/Logger';
import TakePictureButton from './src/components/TakePictureButton';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {GlobalContext, GlobalProvider} from './src/contexts/GlobalContext';
import ViewForm from './src/pages/ViewForm';
import usePending from './src/hooks/usePending';
const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  const {tasks, setLogger, formattedDate} = useContext(GlobalContext);
  const {getImagePending, sendImagePending} = usePending();

  const initSendPending = async () => {
    const threeMins = 3 * 60 * 1000;

    const sendPending = async () => {
      try {
        const images = await getImagePending();
        if (images.length === 0) {
          await setLogger(logger => [
            ...logger,
            {
              key: 'Image Pending is empty',
              value: `${JSON.stringify(images)}`,
              time: formattedDate,
            },
          ]);
          return;
        }

        await sendImagePending();
      } catch (err) {
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
      }, threeMins);
    };

    await sendPending();
    sendPendingInterval();
  };

  useEffect(() => {
    const log = async () => {
      await setLogger(logger => [
        ...logger,
        {
          key: 'initSendPending Start',
          value: '',
          time: formattedDate,
        },
      ]);
    };

    log();
    initSendPending();
  }, []);

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
              <Tab.Screen name="Tasks" component={SuccessUploads} />
              <Tab.Screen name="Upload" component={TakePictureButton} />
              <Tab.Screen
                name="Form"
                component={ViewForm}
                options={{
                  tabBarButton: () => null,
                }}
              />
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
  tabBar: {
    backgroundColor: '#ffffff',
  },
});

export default App;
