import {Dimensions, Platform, StatusBar} from 'react-native';
//import { isIphoneX } from 'react-native-iphone-x-helper';
//import Orientation from "react-native-orientation-locker";

//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 912;
const guidelineBaseHeight = 1368;

//const initial = Orientation.getInitialOrientation();
const {width} = Dimensions.get('window');
const {height} = Dimensions.get('window');

export const scale = size => Math.round((width / guidelineBaseWidth) * size);
export const verticalScale = size =>
  Math.round((height / guidelineBaseHeight) * size);
// const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor

export const indent = scale(15);
export const doubleIndent = indent * 2;

//export const bottomIndent = (!isIphoneX()) ? 0 : scale(11);
// ---------------
const windowDimensions = Dimensions.get('window');
export const isIos = Platform.OS === 'ios';
export const isOldDroid = !isIos && Platform.Version <= 20; /* 4.4.4 */
export const isAndroidLollipop =
  Platform.Version >= 21 && Platform.Version < 23;
export const isAndroidAndLollipopOrHigher =
  Platform.OS === 'android' && Platform.Version >= 21;
export const windowWidth = windowDimensions.width;
export const windowHeight =
  windowDimensions.height - (!isIos ? StatusBar.currentHeight || 0 : 0);
export const screenTabInitialLayout = {height: 0, width: windowWidth};
export const menuWidth = windowWidth - windowWidth * 0.2;
