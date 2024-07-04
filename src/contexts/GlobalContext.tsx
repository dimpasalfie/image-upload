import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useEffect, useState} from 'react';
import {formatDate} from '../lib';
import {S3} from 'aws-sdk';
import NetInfo from '@react-native-community/netinfo';

export const GlobalContext = createContext<any>({});

export const GlobalProvider = ({children}: any) => {
  const [logger, setLogger] = useState<any[]>([]);
  const [capturedImages, setCapturedImages] = useState<any[]>([]);
  const [pendingUploads, setPendingUploads] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const s3 = {};

  useEffect(() => {
    NetInfo.addEventListener((state: any) => {
      if (state.isConnected === false || state.isInternetReachable === false) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
      }
    });
  }, []);

  useEffect(() => {
    setLogger(logger => [
      ...logger,
      {
        key: 'Checks internet connection',
        value: `${JSON.stringify(isConnected)}`,
        time: formatDate(new Date()),
      },
    ]);
  }, [isConnected]);

  const date = new Date();
  const formattedDate = formatDate(date);

  return (
    <GlobalContext.Provider
      value={{
        capturedImages,
        setCapturedImages,
        logger,
        setLogger,
        formattedDate,
        s3,
        setPendingUploads,
        pendingUploads,
        setIsConnected,
        isConnected,
      }}>
      {children}
    </GlobalContext.Provider>
  );
};
