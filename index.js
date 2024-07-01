/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {GlobalProvider} from './src/contexts/GlobalContext';

// Apply the GlobalContext Provider here
const RootComponent = () => (
  <GlobalProvider>
    <App />
  </GlobalProvider>
);

AppRegistry.registerComponent(appName, () => RootComponent);
