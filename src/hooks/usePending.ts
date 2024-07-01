import AsyncStorage from '@react-native-async-storage/async-storage';
import {useContext} from 'react';
import RNFS from 'react-native-fs';
import {GlobalContext} from '../contexts/GlobalContext';
import axios from 'axios';
import {mimeTypes} from '../lib';
import {getBlob, getImageFromAmazon, uploadFileToService} from '../api';

type PendingImage = {
  name: string;
  filePath: string;
};

const _getIdToken = async () => {
  return await AsyncStorage.getItem('IdToken');
};

const generateChecksum = async (base64: string) => {
  const buffer = Buffer.from(base64, 'base64');
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  const hash = CryptoJS.MD5(wordArray).toString();

  return hash;
};

const checkImageUploadStatus = async ({
  taskId,
  fileName,
  filePath,
}: {
  taskId: number;
  fileName: string;
  filePath: string;
}) => {
  try {
    const token = await _getIdToken();

    if (!token) return false;

    const result = await getImageFromAmazon(token, taskId, fileName);

    if (!result.presignedUrl) return false;

    const {headers} = await axios.get(result.presignedUrl);

    const originalImage = await getBlob(filePath);

    if (!originalImage?.size || !headers['content-length']) return false;

    return true;
  } catch (error) {
    return false;
  }
};

const usePending = () => {
  const {IdToken, setLogger, formattedDate} = useContext(GlobalContext);
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
        value: `${JSON.stringify(images)}`,
        time: formattedDate,
      },
    ]);
    const IdToken = await _getIdToken();
    await setLogger(logger => [
      ...logger,
      {
        key: 'IdToken is empty',
        value: '',
        time: formattedDate,
      },
    ]);
    if (!IdToken) {
      return;
    }

    const images = await getImagePending();

    await setLogger(logger => [
      ...logger,
      {
        key: 'Pending Images',
        value: `${JSON.stringify(images)}`,
        time: formattedDate,
      },
    ]);

    const successImages: PendingImage[] = [];

    for (const index in images) {
      const item = images[index];

      await setLogger(logger => [
        ...logger,
        {
          key: 'Pending Image (Singular)',
          value: `${JSON.stringify(item)}`,
          time: formattedDate,
        },
      ]);

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
            time: formattedDate,
          },
        ]);

        const ext = item.filePath.split('.').pop()?.toLowerCase();
        const mime = await mimeTypes(ext);

        const fileData = {
          uri: item.filePath,
          type: mime,
          name: item.name,
        };

        await setLogger(logger => [
          ...logger,
          {
            key: 'usePending File Data',
            value: `${JSON.stringify(fileData)}`,
            time: formattedDate,
          },
        ]);

        // const blob = await getBlob(item.filePath);
        const result = await uploadFileToService(
          IdToken,
          item.name,
          fileData,
          checksum,
        );

        await setLogger(logger => [
          ...logger,
          {
            key: 'usePending Upload Result',
            value: `${JSON.stringify(result)}`,
            time: formattedDate,
          },
        ]);

        if (result) {
          successImages.push(item);
        }
      } catch (err) {
        console.error(`ERROR UPLOADING IMAGE ${item.name}:`, err);
      }
    }

    const successUploads: PendingImage[] = [];

    for (const item of successImages) {
      await setLogger(logger => [
        ...logger,
        {
          key: 'Success Upload Image To s3',
          value: `${JSON.stringify(item)}`,
          time: formattedDate,
        },
      ]);

      const [_, taskId, name] = item.name.split('/');

      const uploadCheck = await checkImageUploadStatus({
        taskId: +taskId,
        filePath: item.filePath,
        fileName: name,
      });

      await setLogger(logger => [
        ...logger,
        {
          key: 'initialized checkImageUploadStatus',
          value: `${JSON.stringify(uploadCheck)}`,
          time: formattedDate,
        },
      ]);

      if (uploadCheck) successUploads.push(item);
    }

    const successUploadsPaths = successUploads.map(item => item.filePath);

    const remainingImages = images.filter(
      item => !successUploadsPaths.includes(item.filePath),
    );

    await setLogger(logger => [
      ...logger,
      {
        key: 'Remaining Images',
        value: `${JSON.stringify(remainingImages)}`,
        time: formattedDate,
      },
    ]);

    await AsyncStorage.setItem(
      `pendingImages-${tenant}`,
      JSON.stringify(remainingImages),
    );
  };

  return {
    getImagePending,
    addImageToPending,
    sendImagePending,
  };
};

export default usePending;
