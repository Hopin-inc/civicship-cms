import { Storage } from '@google-cloud/storage';

const base64Encoded = process.env.GCS_SERVICE_ACCOUNT_BASE64;
const credentials = base64Encoded
  ? JSON.parse(Buffer.from(base64Encoded, "base64").toString("utf-8"))
  : undefined;

const bucket = process.env.GCS_BUCKET_NAME;
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials,
});

export async function generateSignedUrl(fileName: string, folderPath?: string, bucketName?: string): Promise<string> {
  try {
    bucketName = bucketName ?? bucket;
    const filePath = folderPath ? `${ folderPath }/${ fileName }` : fileName;
    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + 15 * 60 * 1000, // 15分間有効
    };

    const [url] = await storage
      .bucket(bucketName)
      .file(filePath)
      .getSignedUrl(options);
    return url;
  } catch (e) {
    console.warn(e);
    return "";
  }
}

export function getPublicUrl(fileName: string, folderPath?: string, bucketName?: string): string {
  bucketName = bucketName ?? bucket;
  const filePath = folderPath ? `${ folderPath }/${ fileName }` : fileName;
  return `https://storage.googleapis.com/${ bucketName }/${ filePath }`;
}

export function getFileInfoFromUrl(url?: string) {
  if (!url) {
    return {
      bucket: undefined,
      folderPath: undefined,
      filename: undefined,
    };
  }
  const [_http, _domain, bucket, ...filePathArray] = url.split("/");
  const filename = filePathArray.pop();
  return {
    bucket,
    folderPath: filePathArray.join("/"),
    filename,
  };
}
