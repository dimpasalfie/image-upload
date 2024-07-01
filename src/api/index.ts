import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const getUrl = async () => {
  // return 'https://saas-gw-dev.milgam.co.il:8012/';
  return 'http://192.168.1.5:5000/';
};

export const fileServiceUrl = async () => {
  // return 'https://saas-gw-dev.milgam.co.il:8014/';
  return 'http://192.168.1.5:8080/';
};

export const generateIdToken = async () => {
  const url = (await getUrl()) + 'auth/login';
  let response = await axios({
    method: 'post',
    url: url,
    data: {
      username: 'admin@agam.client',
      password: 'Aa12345678',
    },
  });

  return response;
};

export const uploadFileToS3 = async () => {
  // Provide requirements
};

export const uploadFileToService = async (
  IdToken: string,
  filePath: string,
  fileData: any,
  checksum: string,
) => {
  try {
    const tenant = 'agam';
    const url = (await fileServiceUrl()) + 'files/mobile-upload-image';

    const formData = new FormData();
    formData.append('destination', filePath);
    formData.append('image', fileData);
    formData.append('checksum', checksum);

    let response = await axios({
      method: 'post',
      url: url,
      data: formData,
      headers: {
        Authorization: `Bearer ${IdToken}`,
        'Content-Type': 'multipart/form-data',
        'x-tenant-name': tenant,
      },
    });

    return response;
  } catch (err) {
    return {err};
  }
};

export const getPhotoFromAmazon = async (
  token: string,
  presignedUrl: string,
) => {
  try {
    const url = (await getUrl()) + 'files/pre-signed-download';
    const tenant = 'agam';
    let response = await axios({
      method: 'post',
      url: url,
      data: {
        filePath: presignedUrl,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-tenant-name': tenant,
        'x-request-context': 'tasks',
      },
    });
    response = response.data.presignedUrl;
    return response;
  } catch (error) {
    console.log('The path ' + presignedUrl + " isn't exsist");
    return {};
  }
};

export const getSettings = async (token: string, tenant: string) => {
  try {
    const url = (await getUrl()) + 'settings'; // https://saas-gw-dev.milgam.co.il:8012/settings
    let response = await axios({
      method: 'get',
      url: url,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-name': tenant,
        'x-request-context': 'tasks',
      },
    });

    return response.data;
  } catch (error) {
    console.log(`getSettings error: `, error);
    return [];
  }
};

export const getImageFromAmazon = async (
  IdToken: string,
  taskId: any,
  filename: any,
  fromTakePicture?: any,
) => {
  try {
    const tenant = 'agam';
    const settings = await getSettings(IdToken, tenant);
    if (fromTakePicture && Object.keys(settings).length === 0) {
      return 'network error';
    }
    const getBucketName = settings.find((item: any) => {
      return item.key == 'bucketName';
    });
    const getRegion = settings.find((item: any) => {
      return item.key == 's3Region';
    });

    const presignedUrl =
      'https://' +
      getBucketName.value +
      '.s3.' +
      getRegion.value +
      '.amazonaws.com/50px_task/' +
      taskId +
      '/' +
      filename;

    const url = (await getUrl()) + 'files/pre-signed-download';

    let response = await axios({
      method: 'post',
      url: url,
      data: {
        filePath: presignedUrl,
      },
      headers: {
        Authorization: `Bearer ${IdToken}`,
        'Content-Type': 'application/json',
        'x-tenant-name': tenant,
        'x-request-context': 'tasks',
      },
    });

    return await response.data;
  } catch (error) {
    console.log('The path presigned doesnt exsist');
    return {};
  }
};

export const getBlob = async (fileUri: string) => {
  try {
    const resp = await fetch(fileUri);
    const imageBody = await resp.blob();
    return imageBody;
  } catch (error) {
    console.error('getBlob error ', error);
    return null;
  }
};
