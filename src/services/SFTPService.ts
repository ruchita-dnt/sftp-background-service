import { injectable } from "inversify";
import { ISFTPService } from "../interfaces/ISFTPService";
import { InternalServerError } from "../errors/InternalServerError";
import { SFTPCreateConnectionService } from "../types/SFTPService";
import { join } from "path";
const Client = require("ssh2-sftp-client");
const sftp = new Client();
import { Database } from "db-sdk/dist";
import { Documents } from "db-sdk/dist/Documents";
import { DocumentAuditTrail } from "db-sdk/dist/DocumentAuditTrail";
import { DocumentTypes } from "db-sdk/dist/DocumentTypes";
import { FileStatusEnum } from "db-sdk/dist/Enum";
import { Operations } from "db-sdk/dist/Operations";
import { Projects } from "db-sdk/dist/Projects";
import axios from "axios";
import FormData from "form-data";

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
    selectedFileType: string,
    allPromise: any[]
  ): Promise<string[]> {
    const database = new Database();
    let connection;
    if (typeof connection === "undefined") {
      // Connect to the MySQL database from layer
      connection = await database.createDBconnection();
    }

    try {
      const OperationsRepo: any = await database.getEntity(Operations);
      let OperationId = await OperationsRepo.findOne({
        where: {
          operationName: "Belgium",
        },
      });

      const ProjectsRepo: any = await database.getEntity(Projects);
      let ProjectId = await ProjectsRepo.findOne({
        where: {
          name: "GE",
        },
      });

      const DocumentTypeRepo: any = await database.getEntity(DocumentTypes);
      let FileTypeId = await DocumentTypeRepo.findOne({
        where: {
          documentType: "QAR",
        },
      });

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
          await this.downloadFiles(
            filePath,
            filesArray,
            selectedFileType,
            allPromise
          );
        } else {
          if (
            selectedFileType.includes("*") ||
            selectedFileType.includes(fileExtension)
          ) {
            // await sftp.get(
            //   `${filePath}`,
            //   `${__dirname}/sftp-files/${file.name}`
            // );
            const tailNumber = path.replace(/\\/g, "");
            filesArray.push(`${tailNumber}/${file.name}`);

            const downloadMultipleFiles = (filePath: any, fileName: any) => {
              return new Promise(async (resolve, reject) => {
                try {
                  console.log(new Date().toLocaleString(), "File Read Started");
                  const readSream = await sftp.createReadStream(`${filePath}`);

                  const DocumentsRepo = await database.getEntity(Documents);
                  const newDocument = new Documents();
                  newDocument.operationId = OperationId.id;
                  newDocument.projectId = ProjectId.id;
                  newDocument.documentTypeId = FileTypeId.id;
                  newDocument.tailNo = tailNumber; //
                  newDocument.flightNo = "100ASL"; // where can i get it
                  newDocument.documentName = file.name; //filename
                  newDocument.sourcePath = `${tailNumber}/${file.name}`;
                  newDocument.stagingAreaPath = `${__dirname}/sftp-files/${file.name}`; //bucket location
                  newDocument.processStartTime = new Date();
                  newDocument.processEndTime = new Date();
                  newDocument.status = FileStatusEnum.PICKUP_BY_SFTP;
                  const DocumentScave = await database.saveEntity(
                    DocumentsRepo,
                    newDocument
                  );
                  const DocumentAuditTrailRepo = await database.getEntity(
                    DocumentAuditTrail
                  );

                  const newDocumentAuditTrail = await new DocumentAuditTrail();
                  newDocumentAuditTrail.documentId = DocumentScave.id;
                  newDocumentAuditTrail.description =
                    "trying to win a little everyday";
                  newDocumentAuditTrail.time = new Date();
                  newDocumentAuditTrail.createdAt = new Date();
                  newDocumentAuditTrail.status = FileStatusEnum.PICKUP_BY_SFTP;
                  const fileProcessDetails = await database.saveEntity(
                    DocumentAuditTrailRepo,
                    newDocumentAuditTrail
                  );

                  console.log(new Date().toLocaleString(), "File Read End");

                  const formData = new FormData();
                  formData.append("id", DocumentScave.id);
                  formData.append("tailNumber", tailNumber);
                  formData.append("file", readSream);

                  console.log(
                    new Date().toLocaleString(),
                    "File receiver API trigger"
                  );
                  const apiCall = await axios.post(
                    process.env.apiURL!,
                    formData,
                    {
                      headers: { "content-type": "multipart/form-data" },
                    }
                  );
                  console.log(new Date().toLocaleString(), "API call End");
                  console.log("API Response", apiCall.data);
                  if (apiCall.status === 200) {
                    const deleteFile = await sftp.delete(
                      `${tailNumber}/${file.name}`
                    );
                    console.log(
                      `File deleted from SFTP: ${tailNumber}/${file.name}`
                    );
                    resolve(
                      `File deleted from SFTP: ${tailNumber}/${file.name}`
                    );
                  }
                } catch (error) {
                  reject(`Error in promise: ${fileName}, error: ${error}`);
                }
              });
            };
            allPromise.push(downloadMultipleFiles(filePath, file.name));
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
