import axios from 'axios';

export const fileServiceUrl = async () => {
  return 'https://saas-gw-dev.milgam.co.il:8014/';
};

export const uploadFileService = async (
  IdToken: string,
  filePath: string,
  fileData: any,
  checksum: string,
) => {
  try {
    const tenant = 'agam';
    const url = await fileServiceUrl();

    const formData = new FormData();
    formData.append('destination', filePath);
    formData.append('image', fileData);
    formData.append('checksum', checksum);

    const response = await axios({
      method: 'post',
      url: url,
      data: {},
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
