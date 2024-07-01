declare module 'react-native-aws3' {
  export interface S3Options {
    keyPrefix?: string;
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
    successActionStatus: number;
  }

  export interface S3File {
    uri: string;
    name: string;
    type: string;
  }

  export interface S3Response {
    status: number;
    body: any;
  }

  export class RNS3 {
    static put(file: S3File, options: S3Options): Promise<S3Response>;
  }
}
