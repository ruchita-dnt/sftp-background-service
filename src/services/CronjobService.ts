import { inject, injectable } from "inversify";
import { ICronjobService } from "../interfaces/ICronjobService";
import { InternalServerError } from "../errors/InternalServerError";
import { ISFTPService } from "../interfaces/ISFTPService";
import { TYPES } from "../config/types";
import { SFTPCreateConnectionService } from "../types/SFTPService";
import env from "../config/env";
import axios from "axios";

@injectable()
export class CronjobService implements ICronjobService {
  private _sftpService: ISFTPService;
  constructor(@inject(TYPES.SFTPService) sftpService: ISFTPService) {
    this._sftpService = sftpService;
    console.log(`Creating: ${this.constructor.name}`);
  }

  async cronJob(): Promise<any> {
    console.log("This is fron CronJob `````````````````````````````````````````")
    const connectionData: SFTPCreateConnectionService = {
      host: env.SFTP_HOST!,
      port: env.SFTP_PORT!,
      user: env.SFTP_USER!,
      password: env.SFTP_PASSWORD!,
      secure: env.SFTP_SECURE!,
    };
    const connectSftp = await this._sftpService.createSFTPConnection(
      connectionData
    )
    try {
      const fileArrays: string[] = [];
      const selectedFileType = env.SELECT_FILE_TYPE || "txt";
      const path = env.SFTP_PATH!;
      const files = await this._sftpService.downloadFiles(
        path,
        fileArrays,
        selectedFileType
      );

      console.log("files", files);

      if (files.length > 0) {
        const fileReceiverAPi = await axios.post(`${env.FR_API_URL}`, {
          downloadedFiles: files,
        });

        console.log("API Response ", fileReceiverAPi.data);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // await this._sftpService.deleteFiles(file);
        }
      }

      return connectSftp;
    } catch (error) {
      console.log("Error in CronJob Service: ", error);
    } finally {
      await connectSftp.end();
      console.log("Disconnect SFTP");
    }
  }
}
