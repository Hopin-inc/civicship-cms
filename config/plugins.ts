import path from "path";
import slugify from "slugify";

export default ({ env }) => {
  const base64Encoded = env("GCS_SERVICE_ACCOUNT_BASE64");
  const serviceAccount = base64Encoded
    ? JSON.parse(Buffer.from(base64Encoded, "base64").toString("utf-8"))
    : undefined;
  return {
    upload: {
      config: {
        provider: "@strapi-community/strapi-provider-upload-google-cloud-storage",
        providerOptions: {
          serviceAccount,
          bucketName: env("GCS_BUCKET_NAME"),
          basePath: env("GCS_BASE_PATH"),
          publicFiles: true,
          uniform: true,
          skipCheckBucket: true,
          generateUploadFileName: (file) => {
            const dirs = file.filepath.split("/");
            const parentDirId = dirs[4];
            const dirId = dirs[6];
            const fileName = slugify(path.basename(file.hash));
            const extension = file.ext.toLowerCase();
            return `${parentDirId}/${dirId}/${fileName}${extension}`;
          },
        },
      },
    },
    i18n: {
      enabled: true,
    },
    "strapi-plugin-ja-pack": {
      enabled: true,
    },
    "google-maps": {
      enabled: true,
      config: {
        resolve: './src/plugins/strapi-google-maps',
      },
    },
  };
};
