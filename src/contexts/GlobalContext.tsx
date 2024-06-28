import React, {createContext, useState} from 'react';

export const GlobalContext = createContext<any>({});

export const GlobalProvider = ({children}: any) => {
  const [capturedImages, setCapturedImages] = useState<any[]>([]);

  const props = {
    capturedImages,
    setCapturedImages,
  };

  return (
    <GlobalContext.Provider value={props}>{children}</GlobalContext.Provider>
  );
};
