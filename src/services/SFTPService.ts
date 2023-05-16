import { injectable } from "inversify";
import { ISFTPService } from "../interfaces/ISFTPService";
import { InternalServerError } from "../errors/InternalServerError";
import { SFTPCreateConnectionService } from "../types/SFTPService";
import { join } from "path";
const Client = require("ssh2-sftp-client");
const sftp = new Client();

@injectable()
export class SFTPService implements ISFTPService {
  constructor() {
    console.log(`Creating: ${this.constructor.name}`);
  }

  async createSFTPConnection(
    connectionData: SFTPCreateConnectionService
  ): Promise<any> {
    try {
      await sftp.connect(connectionData);
      return sftp;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the SFTP Server." + error
      );
    }
  }

  async downloadFiles(
    path: string,
    filesArray: string[],
    selectedFileType: string
  ): Promise<string[]> {
    try {
      const files = await sftp.list(path);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split(".")[1];
        let filePath;
        if (path !== "/") {
          filePath = join(path, file.name);
        } else {
          filePath = file.name;
        }
        const stat = await sftp.stat(filePath);
        if (stat.isDirectory) {
          await this.downloadFiles(filePath, filesArray, selectedFileType);
        } else {
          if (
            selectedFileType.includes("*") ||
            selectedFileType.includes(fileExtension)
          ) {
            await sftp.get(
              `${filePath}`,
              `${__dirname}/sftp-files/${file.name}`
            );
            const removePath = path.replace(/\\/g, "");
            filesArray.push(`${removePath}/${file.name}`);
          }
        }
      }

      return filesArray;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the downloadFiles service." +
          error
      );
    }
  }

  async deleteFiles(path: string): Promise<any> {
    try {
      const deleteFile = await sftp.delete(path);
      console.log(path, "File deleted", deleteFile);

      return deleteFile;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the deleteFiles service." +
          error
      );
    }
  }
}
