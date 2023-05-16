import dotenv from "dotenv";
import appRoot from "app-root-path";

dotenv.config({ path: `${appRoot}/.env` });

export default {
  API_PORT: process.env.API_PORT,
  API_ROOT: process.env.API_ROOT,
  API_VERSION: process.env.API_VERSION,
  API_HOST: process.env.API_HOST,

  SFTP_HOST: process.env.HOST,
  SFTP_PORT: process.env.PORT,
  SFTP_USER: process.env.USER,
  SFTP_PASSWORD: process.env.PASSWORD,
  SFTP_SECURE: process.env.SECURE,
  SFTP_PATH: process.env.ftpServerPath,

  SELECT_FILE_TYPE: process.env.allFileExtension,

  GCP_BUCKET_NAME: process.env.bucketName,
  GCP_CONFIG: {
    projectId: process.env.PROJECT_ID,
    credentials: {
      token_url: process.env.TOKEN_URL,
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      private_key: process.env.PRIVATE_KEY!.split(String.raw`\n`).join("\n"),
    },
  },

  FR_API_URL: process.env.apiURL,
};
