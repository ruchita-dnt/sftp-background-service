import { inject, injectable } from "inversify";
import { ICronjobService } from "../interfaces/ICronjobService";
import { InternalServerError } from "../errors/InternalServerError";
import { ISFTPService } from "../interfaces/ISFTPService";
import { TYPES } from "../config/types";
import { SFTPCreateConnectionService } from "../types/SFTPService";
import env from "../config/env";

@injectable()
export class CronjobService implements ICronjobService {
  private _sftpService: ISFTPService;
  constructor(@inject(TYPES.SFTPService) sftpService: ISFTPService) {
    this._sftpService = sftpService;
    console.log(`Creating: ${this.constructor.name}`);
  }

  async cronJob(): Promise<any> {
    try {
      const connectionData: SFTPCreateConnectionService = {
        host: env.SFTP_HOST!,
        port: env.SFTP_PORT!,
        user: env.SFTP_USER!,
        password: env.SFTP_PASSWORD!,
        secure: env.SFTP_SECURE!,
      };
      const connectSftp = await this._sftpService.createSFTPConnection(
        connectionData
      );

      const fileArrays: string[] = [];
      const selectedFileType = env.SELECT_FILE_TYPE || "txt";
      const path = env.SFTP_PATH!;
      const files = await this._sftpService.downloadFiles(
        path,
        fileArrays,
        selectedFileType
      );

      console.log("files", files);

      return connectSftp;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the cronJob service." + error
      );
    }
  }
}
