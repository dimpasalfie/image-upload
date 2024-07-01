declare module 'react-native-modal-dropdown' {
  import {Component} from 'react';
  import {ViewStyle, TextStyle} from 'react-native';

  interface ModalDropdownProps {
    options: string[];
    onSelect?: (index: number, value: string) => void;
    defaultValue?: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
  }

  export default class ModalDropdown extends Component<ModalDropdownProps> {}
}
