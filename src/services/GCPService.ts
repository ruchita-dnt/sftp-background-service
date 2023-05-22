import { InternalServerError } from "../errors/InternalServerError";
import { IGCPService } from "../interfaces/IGCPService";
import { Storage } from "@google-cloud/storage";
import { PubSub } from "@google-cloud/pubsub";
import env from "../config/env";
import { injectable } from "inversify";
import { Database } from "db-sdk/dist";
import { Documents } from "db-sdk/dist/Documents";
import { DocumentAuditTrail } from "db-sdk/dist/DocumentAuditTrail";
import { DocumentTypes } from "db-sdk/dist/DocumentTypes";
import { FileStatusEnum } from "db-sdk/dist/Enum";
import { Operations } from "db-sdk/dist/Operations";
import { Projects } from "db-sdk/dist/Projects";

const storage = new Storage(env.GCP_CONFIG);
const bucketName = env.GCP_BUCKET_NAME;
const gcs = storage.bucket(bucketName!);
const pubsub = new PubSub(env.GCP_CONFIG);

@injectable()
export class GCPService implements IGCPService {
  constructor() {
    console.log(`Creating: ${this.constructor.name}`);
  }

  async uploadFileOnBucket(
    filePath: string,
    destinationDir: string,
    id: number
  ): Promise<any> {
    const database = new Database();
    let connection;
    if (typeof connection === "undefined") {
      // Connect to the MySQL database from layer
      connection = await database.createDBconnection();
    }
    const DocumentsRepo: any = await database.getEntity(Documents);
    const DocumentAuditTrailRepo: any = await database.getEntity(
      DocumentAuditTrail
    );
    try {
      const upload = await gcs.upload(filePath, {
        destination: destinationDir,
      });

      // const DocumentsRepository = getRepository(Documents);

      //primarykey mat dalna -
      //ToDo: Update Entry in Documents and create entry in DocumentAuditTrail with status - STORE_TO_BUCKET
      //Data Needed to be update in both table
      /**
       * Documents: id, status, stagingAreaPath
       *
       * DocumentAuditTrail: fileId, status, description, time, createdAt   */

      try {
        const Documents: any = await DocumentsRepo.findOne({
          where: {
            id: id,
          },
        });

        if (Documents) {
          // Update the necessary properties of the Documents entity
          Documents.status = "STORE_TO_BUCKET";
          console.log("Documents status changed - gcpservice");
          await DocumentsRepo.save(Documents);
        }
      } catch (error) {
        console.error("Failed to update Documents:", error);
      }
      const newDocumentAuditTrail = new DocumentAuditTrail();
      newDocumentAuditTrail.status = FileStatusEnum.STORE_TO_BUCKET;
      newDocumentAuditTrail.documentId = id;
      newDocumentAuditTrail.description = "trying to win a little everyday";
      newDocumentAuditTrail.time = new Date();
      newDocumentAuditTrail.createdAt = new Date();

      const fileprocesssave = await database.saveEntity(
        DocumentAuditTrailRepo,
        newDocumentAuditTrail
      );

      return upload;
    } catch (error) {
      //ToDo: Update Entry in Documents and create entry in DocumentAuditTrail with status - FAILED
      //Data Needed to be update in both table
      /*** Documents: id, status
       * DocumentAuditTrail: fileId, status, description, time, createdAt
       */

      try {
        const Documents = await DocumentsRepo.findOne({
          where: {
            id: 1,
          },
        });

        if (Documents) {
          // Update the necessary properties of the Documents entity
          Documents.status = "FAILED";
          console.log("Documents status changed to failed- gcpservice");
          await DocumentsRepo.save(Documents);
        }
      } catch (error) {
        console.error("Failed to update Documents:", error);
      } finally {
        // connection = await database.Disconnect();
        // console.log('Disconnected');
      }

      const newDocumentAuditTrail = new DocumentAuditTrail();
      newDocumentAuditTrail.status = FileStatusEnum.FAILED;
      newDocumentAuditTrail.documentId = id;
      newDocumentAuditTrail.description = "trying to win a little everyday";
      newDocumentAuditTrail.time = new Date();
      newDocumentAuditTrail.createdAt = new Date();

      const fileprocesssave = await database.saveEntity(
        DocumentAuditTrailRepo,
        newDocumentAuditTrail
      );

      throw new InternalServerError(
        "An error occurred while interacting with the uploadFileOnBucket service." +
          error
      );
    }
  }

  async sendMessageTOPubSub(
    payload: any,
    topicName: string,
    id: number
  ): Promise<any> {
    const database = new Database();
    let connection;
    if (typeof connection === "undefined") {
      // Connect to the MySQL database from layer
      connection = await database.createDBconnection();
    }
    const DocumentsRepo: any = await database.getEntity(Documents);
    const DocumentAuditTrailRepo: any = await database.getEntity(
      DocumentAuditTrail
    );

    try {
      const payloadBuffer = Buffer.from(JSON.stringify(payload));
      const sendMessage = await pubsub
        .topic(topicName)
        .publishMessage({ data: payloadBuffer });
      //ToDo: Update Entry in Documents and create entry in DocumentAuditTrail with status - PUSH_TO_QUEUE
      //Data Needed to be update in both table
      /**
       * Documents: id, status
       *
       * DocumentAuditTrail: fileId, status, description, time, createdAt
       */

      try {
        const Documents = await DocumentsRepo.findOne({
          where: {
            id: id,
          },
        });

        if (Documents) {
          // Update the necessary properties of the Documents entity
          Documents.status = "PUSH_TO_QUEUE";
          console.log(FileStatusEnum.PUSH_TO_QUEUE, "stats")
          console.log(
            "Documents status changed to pushed to queue- gcpservice"
          );
          await DocumentsRepo.save(Documents);
          // await DocumentsRepo.save(Documents);
        //  await database.saveEntity(DocumentsRepo, Documents);
        }
      } catch (error) {
        console.error("Failed to update Documents++++++++++:", error);
      }

      const newDocumentAuditTrail = new DocumentAuditTrail();
      newDocumentAuditTrail.status = FileStatusEnum.PUSH_TO_QUEUE;
      newDocumentAuditTrail.documentId = id;
      newDocumentAuditTrail.description="trying to win a little everyday";
      newDocumentAuditTrail.time=new Date()
      newDocumentAuditTrail.createdAt=new Date()   
      const fileprocesssave = await database.saveEntity(
        DocumentAuditTrailRepo,
        newDocumentAuditTrail
      );
      console.log("THis is fileprocesssave ``````````````", fileprocesssave);

      return sendMessage;
    } catch (error) {
      //ToDo: Update Entry in Documents and create entry in DocumentAuditTrail with status - FAILED
      //Data Needed to be update in both table
      /**
       * Documents: id, status
       *
       * DocumentAuditTrail: fileId, status, description, time, createdAt
       */

      try {
        const Documents = await DocumentsRepo.findOne({
          where: {
            id: id,
          },
        });

        if (Documents) {
          // Update the necessary properties of the Documents entity
          Documents.status = "FAILED";
          console.log(
            "Documents status changed to pushed to queue- gcpservice"
          );
          await DocumentsRepo.save(Documents);
        }
      } catch (error) {
        console.error("Failed to update file_master:", error);
      }

      const newDocumentAuditTrail = new DocumentAuditTrail();
      newDocumentAuditTrail.status = FileStatusEnum.FAILED;
      newDocumentAuditTrail.documentId = id;
      newDocumentAuditTrail.description="trying to win a little everyday";
      newDocumentAuditTrail.time=new Date()
      newDocumentAuditTrail.createdAt=new Date()   
      const fileprocesssave = await database.saveEntity(
        DocumentAuditTrailRepo,
        newDocumentAuditTrail
      );
      throw new InternalServerError(
        "An error occurred while interacting with the sendMessageTOPubSub service." +
          error
      );
    }
  }
}
