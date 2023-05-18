import { injectable } from "inversify";
import { ISFTPService } from "../interfaces/ISFTPService";
import { InternalServerError } from "../errors/InternalServerError";
import { SFTPCreateConnectionService } from "../types/SFTPService";
import { join } from "path";
const Client = require("ssh2-sftp-client");
const sftp = new Client();
import { Database } from "db-sdk";
import { filemaster } from "db-sdk/src/FileMaster";

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
          //ToDo: Need to implement Promise here
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
            //ToDo: Create Entry in file_master and file_process_details with status - PICKUP_BY_SFTP
            //Data Needed in both table
            /** 
             * file_master: operationId, projectId, fileTypeId, tailNo, flightNo, fileName, sourcePath, startTime, status, createdAt, updatedAt
             * 
             * file_process_details: fileId, status, description, time, createdAt
             */
            const database = new Database();
            let connection;
            if (typeof connection === "undefined") {
              // Connect to the MySQL database from layer
              connection = await database.createDBconnection();
            }
            const fileMasterRepo = await database.getEntity(filemaster);
            const fileProcessDetailsRepo = await database.getEntity("fileprocessdetails");
            const newFileMaster = new filemaster();
            newFileMaster.operationId = 1;
            database.saveEntity(fileMasterRepo, newFileMaster);
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
