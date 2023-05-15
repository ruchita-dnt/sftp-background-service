import dotenv from "dotenv";
import appRoot from "app-root-path";

dotenv.config({ path: `${appRoot}/.env` });

export default {
  APP_PORT: process.env.APP_PORT,
  API_ROOT: process.env.API_ROOT,
  API_VERSION: process.env.API_VERSION,

  SFTP_HOST: process.env.SFTP_HOST,
  SFTP_PORT: process.env.SFTP_PORT,
  SFTP_USER: process.env.SFTP_USER,
  SFTP_PASSWORD: process.env.SFTP_PASSWORD,
  SFTP_SECURE: process.env.SFTP_SECURE,
  SFTP_PATH: process.env.ftpServerPath,

  SELECT_FILE_TYPE: process.env.allFileExtension,
};
