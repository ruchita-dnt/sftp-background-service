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

    const database = new Database();
    let connection;
    if (typeof connection === "undefined") {
      // Connect to the MySQL database from layer
      connection = await database.createDBconnection();
    }

    try {
      const files = await sftp.list(path);
      console.log('file list -- to check if the connection was successfull ~~~~~~~~~~~~~~~~~~~~~~~', files)

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
            const OperationsRepo:any = await database.getEntity(Operations); 
            let OperationId = await OperationsRepo.findOne({
              where: {
                operationName: "Belgium",
            },
              // operationName: "Belgium",
          });

          const ProjectsRepo:any = await database.getEntity(Projects); 
            let ProjectId = await ProjectsRepo.findOne({
              where: {
                name: "GE",
            },
              // name: "GE",
          });

          const DocumentTypeRepo:any = await database.getEntity(DocumentTypes); 
          let FileTypeId = await DocumentTypeRepo.findOne({
            where: {
              documentType: "QAR",
          },
            
            
        })



            
            const DocumentsRepo = await database.getEntity(Documents);           

            const newDocument = new Documents();
            newDocument.operationId = OperationId.id;
            newDocument.projectId = ProjectId.id;
            newDocument.documentTypeId = FileTypeId.id;
            newDocument.tailNo = removePath;  //
            newDocument.flightNo="100ASL";  // where can i get it
            newDocument.documentName=file.name; //filename
            newDocument.sourcePath=`${removePath}/${file.name}`;
            newDocument.stagingAreaPath=`${__dirname}/sftp-files/${file.name}`; //bucket location
            newDocument.processStartTime=new Date();
            newDocument.processEndTime=new Date()
            // newDocument.createdAt=new Date()
            // newDocument.updatedAt=new Date()
            newDocument.status = FileStatusEnum.PICKUP_BY_SFTP;

            const DocumentScave =await database.saveEntity(DocumentsRepo, newDocument);

            console.log(DocumentScave,"this is saved DocumentScave`````");

            const DocumentAuditTrailRepo = await database.getEntity(DocumentAuditTrail);
            const newDocumentAuditTrail = await new DocumentAuditTrail;

            newDocumentAuditTrail.documentId = DocumentScave.id;
            newDocumentAuditTrail.description="trying to win a little everyday";
            newDocumentAuditTrail.time=new Date()
            newDocumentAuditTrail.createdAt=new Date()
            newDocumentAuditTrail.status = FileStatusEnum.PICKUP_BY_SFTP;
            
            const fileProcessDetails =await database.saveEntity(DocumentAuditTrailRepo, newDocumentAuditTrail);
          }
        }
      }

      return filesArray;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the downloadFiles service." +
          error
      );
    } finally{
      // connection = await database.Disconnect();
      console.log('Disconnected');
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
