import {ImagePickerResponse} from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import {Image as ImageCompressor} from 'react-native-compressor';

export const generateTaskId = () => {
  const date = new Date();
  const seed = date.getTime();
  const randomDigits = Math.floor(Math.random() * 10000);
  const taskId = (seed + randomDigits) % 10000;
  return taskId;
};

export const formatDate = (date: any) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
};

export const mimeTypes = (type: string) => {
  const mimeTypes = {
    jpg: 'image/jpg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    pdf: 'application/pdf',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };

  return mimeTypes[type.toLowerCase()];
};

export const resizeImage = async (path: ImagePickerResponse) => {
  try {
    if (path) {
      const resizedImage = await ImageResizer.createResizedImage(
        path,
        300,
        300,
        'JPEG',
        50,
      );

      const imageSize: any = await getImageSize(resizedImage.uri);

      if (imageSize > 50 * 1024) {
        const furtherCompressedImage = await ImageResizer.createResizedImage(
          resizedImage.uri,
          300,
          300,
          'JPEG',
          30,
        );
        return furtherCompressedImage;
      }

      return resizedImage;
    }
  } catch (error) {
    console.error(error);
    return {error};
  }
};

export const getImageSize = async (uri: string) => {
  return new Promise((resolve, reject) => {
    fetch(uri)
      .then(response => response.blob())
      .then(blob => {
        resolve(blob.size);
      })
      .catch(err => {
        reject(err);
      });
  });
};

export const compressImageToMaxSize = async (
  path: string,
  maxSize: number = 50 * 1024,
): Promise<string | null> => {
  let compressedImageUri = path;
  let imageSize: any = await getImageSize(compressedImageUri);

  while (imageSize > maxSize) {
    compressedImageUri = await ImageCompressor.compress(compressedImageUri, {
      compressionMethod: 'auto',
    });
    imageSize = await getImageSize(compressedImageUri);

    if (imageSize === (await getImageSize(path))) {
      break;
    }
  }

  return imageSize <= maxSize ? compressedImageUri : null;
};
