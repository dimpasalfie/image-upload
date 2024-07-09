import {BackHandler, Modal, StyleSheet, Text, View} from 'react-native';
import React, {Dispatch, FC, SetStateAction, useEffect, useState} from 'react';
import VideoPlayer from 'react-native-media-console';
export type VideoModalProps = {
  src: string;
  setEmptySrc: Dispatch<SetStateAction<string>>;
};
import {
  OrientationLocker,
  PORTRAIT,
  LANDSCAPE,
  LANDSCAPE_LEFT,
  LANDSCAPE_RIGHT,
} from 'react-native-orientation-locker';

type OrientationType =
  | 'PORTRAIT'
  | 'UNLOCK'
  | 'LANDSCAPE'
  | 'LANDSCAPE_LEFT'
  | 'LANDSCAPE_RIGHT'
  | 'PORTRAIT_UPSIDE_DOWN'
  | 'ALL_ORIENTATIONS_BUT_UPSIDE_DOWN';
const VideoModal: FC<VideoModalProps> = ({src, setEmptySrc}) => {
  const [orientation, setOrientation] = useState<OrientationType>(PORTRAIT);
  const [paused, setPaused] = useState(false);
  return (
    <Modal
      visible={src ? true : false}
      onRequestClose={() => {
        setEmptySrc('');
      }}>
      <View style={{flex: 1}}>
        <OrientationLocker
          orientation={orientation}
          onDeviceChange={orient => {
            console.log('ORIENTATION', orient);
            if (orient === 'PORTRAIT') {
              setOrientation(PORTRAIT);
              return;
            }
            if (orient === 'LANDSCAPE-LEFT') {
              setOrientation(LANDSCAPE_LEFT);
              return;
            }
            if (orient === 'LANDSCAPE-RIGHT') {
              setOrientation(LANDSCAPE_RIGHT);
              return;
            }

            setOrientation(PORTRAIT);
            return;
          }}
        />
        <VideoPlayer
          repeat={false}
          resizeMode="contain"
          isFullscreen={true}
          fullscreenOrientation="landscape"
          // useAnimations={useAnimations}
          onExitFullscreen={() => setEmptySrc('')}
          paused={paused}
          onEnd={() => setPaused(true)}
          source={{uri: src ?? ''}}
          disableBack
          rewindTime={2}
          disableVolume
          minLoadRetryCount={2}
          // poster="https://baconmockup.com/300/200/"
          bufferConfig={{
            minBufferMs: 15000, //number
            maxBufferMs: 50000, //number
            bufferForPlaybackMs: 2500, //number
            bufferForPlaybackAfterRebufferMs: 5000, //number
          }}
        />
      </View>
    </Modal>
  );
};

export default VideoModal;
