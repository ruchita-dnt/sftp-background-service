import { inject, injectable } from "inversify";
import { IFilereceiverService } from "../interfaces/IFilereceiverService";
import { InternalServerError } from "../errors/InternalServerError";
import { IGCPService } from "../interfaces/IGCPService";
import { TYPES } from "../config/types";
import env from "../config/env";

const bucketName = env.GCP_BUCKET_NAME;
@injectable()
export class FilereceiverService implements IFilereceiverService {
  private _gcpService: IGCPService;
  constructor(@inject(TYPES.GCPService) gcpService: IGCPService) {
    this._gcpService = gcpService;
    console.log(`Creating: ${this.constructor.name}`);
  }

  async fileManager(files: string[], id: number): Promise<any> {
    try {
      for (let i = 0; i < files.length; i++) {
        const parentFolderName = files[i].split("/")[0];
        const fileName = files[i].split("/")[1];
        const fileNameWithoutExt = files[i].split("/")[1].split(".")[0];
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const date = currentDate.getDate();
        const destinationFolder = `QAR/${parentFolderName}/${year}/${month}/${date}/`;

        // const destinationFolder = fileNameWithoutExt.includes("QAR")
        //   ? `QAR/${parentFolderName}/${year}/${month}/${date}/`
        //   : "ODW_data_files/";

        //This function will upload the files to bucket
        await this._gcpService.uploadFileOnBucket(
          `${__dirname}/sftp-files/${fileName}`,
          `${destinationFolder}${fileName}`,
          id
        );
        // const upload = await gcs.upload(`${__dirname}/sftp-files/${fileName}`, {
        //   destination: `${destinationFolder}${fileName}`,
        // });
        console.log("file uploaded ", fileName, " on bucket ", bucketName);
        const payload = {
          fileType: "QAR",
          // fileType: fileName.includes("QAR") ? "QAR" : "ODW",
          fileName: fileName,
          bucketName,
          fileLocation: `https://storage.googleapis.com/${bucketName}/${destinationFolder}${fileName}`,
        };
        const sendMessage = await this._gcpService.sendMessageTOPubSub(
          payload,
          "ge-queue", id
        );
        console.log("Message Sent ", sendMessage);
      }

      return true;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the fileManager service." +
          error
      );
    }
  }
}
