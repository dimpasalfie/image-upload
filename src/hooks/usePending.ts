import AsyncStorage from '@react-native-async-storage/async-storage';
import {useContext} from 'react';
import RNFS from 'react-native-fs';
import {GlobalContext} from '../contexts/GlobalContext';
import {formatDate, mimeTypes} from '../lib';
import {uploadFileToService} from '../api';
import {Buffer} from 'buffer';
import CryptoJS from 'crypto-js';
import {S3} from 'aws-sdk';

type PendingImage = {
  name: string;
  filePath: string;
};

const date = new Date();
const generateChecksum = async (base64: string) => {
  const buffer = Buffer.from(base64, 'base64');
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  const hash = CryptoJS.MD5(wordArray).toString();

  return hash;
};

const usePending = () => {
  const {
    setLogger,
    successUploads,
    setSuccessUploads,
    formattedDate,
    setPendingUploads,
  } = useContext(GlobalContext);
  const tenant = 'agam';

  const getImagePending = async () => {
    if (!tenant) return [];

    const images =
      (await AsyncStorage.getItem(`pendingImages-${tenant}`)) ?? '[]';

    const imageJson: PendingImage[] = JSON.parse(images);

    return imageJson;
  };

  const addImageToPending = async ({
    image: imageObj,
  }: {
    image: PendingImage;
  }) => {
    if (!tenant) return [];

    const images =
      (await AsyncStorage.getItem(`pendingImages-${tenant}`)) ?? '[]';

    const imageJson: PendingImage[] = JSON.parse(images);

    imageJson.push(imageObj);

    const string = JSON.stringify(imageJson);

    await AsyncStorage.setItem(`pendingImages-${tenant}`, string);

    return imageJson;
  };

  const sendImagePending = async () => {
    await setLogger(logger => [
      ...logger,
      {
        key: 'Accessing sendImagePending',
        value: '',
        time: formatDate(new Date()),
      },
    ]);

    const images = await getImagePending();
    await setLogger(logger => [
      ...logger,
      {
        key: 'Getting images from local storage',
        value: `${JSON.stringify(images)}`,
        time: formatDate(new Date()),
      },
    ]);

    const successImages: PendingImage[] = [];

    for (const index in images) {
      const item = images[index];
      if (item) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Pending Image Object',
            value: `${JSON.stringify(item ?? '')}`,
            time: formatDate(new Date()),
          },
        ]);
      }

      try {
        const base64 = await RNFS.readFile(item.filePath, 'base64').then(
          content => content,
        );

        const checksum = await generateChecksum(base64);

        await setLogger(logger => [
          ...logger,
          {
            key: 'usePending Checksum',
            value: `${JSON.stringify(checksum)}`,
            time: formatDate(new Date()),
          },
        ]);

        const fileBuffer = Buffer.from(base64, 'base64');

        const s3 = {};

        const uploadParams: any = {
          Bucket: 'ab1-upload-image',
          Key: item.name,
          Body: fileBuffer,
          ContentType: 'application/octet-stream',
        };

        const result = await s3.upload(uploadParams).promise();

        await setLogger(logger => [
          ...logger,
          {
            key: 'usePending Upload Result',
            value: `${JSON.stringify(result)}`,
            time: formatDate(new Date()),
          },
        ]);

        if (result.Location) {
          await setSuccessUploads((successUploads: string) => [
            ...successUploads,
            result.Location,
          ]);

          successImages.push(item);
        }
      } catch (err) {
        console.error(`ERROR UPLOADING IMAGE ${item.name}:`, err);
      }
    }

    const successUploadsImgs: PendingImage[] = [];

    for (const item of successImages) {
      if (item) {
        await setLogger(logger => [
          ...logger,
          {
            key: 'Success Uploads',
            value: `${JSON.stringify(item)}`,
            time: formatDate(new Date()),
          },
        ]);
      }

      //   const [_, taskId, name] = item.name.split('/');

      //   const uploadCheck = await checkImageUploadStatus({
      //     taskId: +taskId,
      //     filePath: item.filePath,
      //     fileName: name,
      //   });

      //   await setLogger(logger => [
      //     ...logger,
      //     {
      //       key: 'initialized checkImageUploadStatus',
      //       value: `${JSON.stringify(uploadCheck)}`,
      //       time: formattedDate,
      //     },
      //   ]);

      successUploadsImgs.push(item);
    }
    const successUploadsPaths = successUploadsImgs.map(item => item.filePath);
    const remainingImages = images.filter(
      item => !successUploadsPaths.includes(item.filePath),
    );

    await setLogger(logger => [
      ...logger,
      {
        key: 'Remaining Images',
        value: `${JSON.stringify(remainingImages)}`,
        time: formatDate(new Date()),
      },
    ]);

    await AsyncStorage.setItem(
      `pendingImages-${tenant}`,
      JSON.stringify(remainingImages),
    );

    setPendingUploads(remainingImages);
  };

  return {
    getImagePending,
    addImageToPending,
    sendImagePending,
  };
};

export default usePending;
