import React, {useContext} from 'react';
import {Button, ScrollView, StyleSheet, Text, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {GlobalContext} from '../contexts/GlobalContext';

const Logger = () => {
  const {logger, setLogger} = useContext(GlobalContext);
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.button}>
        <Button title="Clear logs" onPress={() => setLogger([])} />
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}>
        {logger &&
          logger.length > 0 &&
          logger.map((item: any, index: number) => {
            return (
              <View key={index} style={styles.logItem}>
                <View style={styles.keyValueContainer}>
                  <Text style={styles.key}>{item.key}</Text>
                  <Text style={styles.value}>{item.value}</Text>
                </View>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            );
          })}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  logItem: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  keyValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  key: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  time: {
    marginTop: 10,
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
  },
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 9999,
  },
});
export default Logger;
