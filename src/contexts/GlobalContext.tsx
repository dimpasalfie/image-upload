import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useEffect, useState} from 'react';
import {formatDate} from '../lib';
import {S3} from 'aws-sdk';

export const GlobalContext = createContext<any>({});

export const GlobalProvider = ({children}: any) => {
  const [logger, setLogger] = useState<any[]>([]);
  const [capturedImages, setCapturedImages] = useState<any[]>([]);
  const [pendingUploads, setPendingUploads] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);

  const s3 = {};
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
        images,
        setImages,
        s3,
        setPendingUploads,
        pendingUploads,
      }}>
      {children}
    </GlobalContext.Provider>
  );
};
