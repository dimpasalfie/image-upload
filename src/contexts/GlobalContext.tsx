import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useEffect, useState} from 'react';
import {formatDate} from '../lib';

export const GlobalContext = createContext<any>({});

export const GlobalProvider = ({children}: any) => {
  const [logger, setLogger] = useState<any[]>([]);
  const [capturedImages, setCapturedImages] = useState<any[]>([]);
  const [IdToken, setIdToken] = useState(null);
  const [tasks, setTasks] = useState<any[]>([
    {
      id: 1,
      images: [],
    },
    {
      id: 2,
      images: [],
    },
    {
      id: 3,
      images: [],
    },
    {
      id: 4,
      images: [],
    },
    {
      id: 5,
      images: [],
    },
  ]);

  const date = new Date();
  const formattedDate = formatDate(date);

  useEffect(() => {
    const storeToken = async () => {
      try {
        await AsyncStorage.setItem(
          'IdToken',
          'eyJraWQiOiJaR1pWS21KOVdON3FTOG43OGpET3Ewbkp6ZFFab3JcL2c0QkxhXC9TSlV4MDg9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIxNjdhZWIwYS0xYjA0LTQ1MjAtOGRkMi04NTYzNzI4ZTNhNGYiLCJjb2duaXRvOmdyb3VwcyI6WyJhZ2FtOjoyZGI3YzYzZC0xZjg5LTRhMDItYTVlYi1kNTY5MmYyYjFmNzIiLCJhZ2FtOjo0MDM4ZTlmZC01Y2RkLTQzNDAtOTgxZi1kZjdlY2RiNjA3MDMiLCJhZ2FtOjo5NGViMzU4MC1kYTIzLTQ1ZjktYjdmNC1jYmRlNjhiNWMzODEiLCJhZ2FtOjo3YmJhYzlmYS0zNDdkLTQ0ZWEtODk5NC1hYmRmNjEyODM1MzYiXSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tXC9ldS1jZW50cmFsLTFfeGxFY2p6eTdNIiwiY3VzdG9tOmVuYWJsZU90cCI6ImZhbHNlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW5AYWdhbS5jbGllbnQiLCJsb2NhbGUiOiJlbiIsImF1dGhfdGltZSI6MTcxOTY0NDMyMiwiY3VzdG9tOnRlbmFudCI6ImFnYW0iLCJleHAiOjE3MTk2NDc5MjIsImN1c3RvbTpyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTk2NDQzMjIsImp0aSI6IjZiOGU0MGRjLTU3YWEtNGQ5NC05Mjc2LTViZGYyNDYwM2E1YSIsImVtYWlsIjoiYWRtaW5AYWdhbS5jbGllbnQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjp0cnVlLCJjb2duaXRvOnVzZXJuYW1lIjoiMTY3YWViMGEtMWIwNC00NTIwLThkZDItODU2MzcyOGUzYTRmIiwiY3VzdG9tOnVzZXJJZCI6IjEyMzQ1Iiwib3JpZ2luX2p0aSI6IjdmNjcyOWJlLWM4NWQtNGI5YS1hZjU0LWI3ZTA4OTFjN2JhNiIsImF1ZCI6IjNzMGFxY29xcmdsZ3V0NGU2cGpuOTBjbjlrIiwiZXZlbnRfaWQiOiIyMzFjYTBmNy02ZTkzLTRmMGMtOWY5My05YmRhMTVhNjRiNjYiLCJ0b2tlbl91c2UiOiJpZCIsIm5hbWUiOiJBZG1pbiIsInBob25lX251bWJlciI6Iis5NzI1MzM0MDQ3ODUiLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.jVGIJN2tsWJ_3duhtSz7WU7pUPyUAT_5XwB-4qGnpbdyxlaM3ysOR7NeMePBSt_QwJU7poEbqWLoW0n-AMVzGCpr17Tydor31w3FI6TiyRDKKWnL4szdeLU2Ck_7ab-NJdkQLVmubvoUUOq1OFXb8mTvb1AfSWfwiM9tOGKjX8NwPoKnxmVqRgzCdnEgLJiMYa9Zai9YNkL1IA0ALVmqEKrwkf1xdSGRUBedxxI0hJZQoNc0vWEhsYDzkAWGttMGp17TLCFZAqGyiC8JdkUUpDRgA8hZqi6xGY3ol0C-FzyK8uvwXEFGKQYTB2TfnJKHUdw5IuGHMtkSdtLkBSTxQQ',
        );
      } catch (err) {
        console.error(err);
      }
    };

    const retrieveToken = async () => {
      try {
        const token = await AsyncStorage.getItem('IdToken');
        setIdToken(token);
      } catch (err) {
        console.error(err);
      }
    };

    storeToken();
    retrieveToken();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        IdToken,
        capturedImages,
        setCapturedImages,
        tasks,
        setTasks,
        logger,
        setLogger,
        formattedDate,
      }}>
      {children}
    </GlobalContext.Provider>
  );
};
