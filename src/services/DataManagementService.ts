import { inject, injectable } from "inversify";
import { IDataManagementService } from "../interfaces/IDataManagementService";
import { InternalServerError } from "../errors/InternalServerError";
import { Database } from "db-sdk/dist";
import { Documents} from "db-sdk/dist/Documents";
import { DocumentAuditTrail } from "db-sdk/dist/DocumentAuditTrail";
import { FileStatusEnum } from "db-sdk/dist/Enum";
import { id } from "inversify";

@injectable()
export class DataManagementService implements IDataManagementService
{
  constructor()
  {
  }

 

  async queueListen(payload: any): Promise<any>
  {
    const database = new Database();
    let connection;
    if (typeof connection === "undefined") {
      // Connect to the MySQL database from layer
      connection = await database.createDBconnection();
    }
    const DocumentsRepo:any = await database.getEntity(Documents);
    const DocumentAuditTrailRepo = await database.getEntity(
      DocumentAuditTrail
    );
    try
    {
      const message = payload.body ? payload.body.message : null;
      console.log("message", message);
      if (message)
      {
        const buffer = Buffer.from(message.data, "base64").toString();
        const data = JSON.parse(buffer!);
        console.log("Ack Message", message.messageId);
        //ToDo: Update Entry in Documents and create entry in DocumentAuditTrail with status - QUEUE_SUCCESS
        //Data Needed to be update in both table
        /** 
        * Documents: id, status
        * 
        * DocumentAuditTrail: fileId, status, description, time, createdAt
        */

        try {
          const Documents = await DocumentsRepo.findOne(id);
  
          if (Documents) {
            // Update the necessary properties of the Documents entity
            Documents.status = "PUSHED_TO_QUEUE";
            console.log('Documents status changed to pushed to queue- gcpservice')
            await DocumentsRepo.save(Documents);
          }
        } catch (error) {
          console.error("Failed to update Documents:", error);
        }
        
        const newDocumentAuditTrail = new DocumentAuditTrail();
        newDocumentAuditTrail.status= FileStatusEnum.PUSH_TO_QUEUE;
        
        
        const fileprocesssave =await database.saveEntity(DocumentAuditTrailRepo, newDocumentAuditTrail);


        return true;
      } else
      {
        return false;
      }

    } catch (error)
    {
      //ToDo: Update Entry in Documents and create entry in DocumentAuditTrail with status - FAILED
      //Data Needed to be update in both table
      /** 
       * Documents: id, status
       * 
       * DocumentAuditTrail: fileId, status, description, time, createdAt
       */

      try {
        const Documents:any = await DocumentsRepo.findOne(id);

        if (Documents) {
          // Update the necessary properties of the Documents entity
          Documents.status = "FAILED";
          console.log('Documents status changed to pushed to queue- gcpservice')
          await DocumentsRepo.save(Documents);
        }
      } catch (error) {
        console.error("Failed to update Documents:", error);
      }
      
      const newDocumentAuditTrail = new DocumentAuditTrail();
      newDocumentAuditTrail.status= FileStatusEnum.FAILED;
      
      
      const fileprocesssave =await database.saveEntity(DocumentAuditTrailRepo, newDocumentAuditTrail);

      throw new InternalServerError(
        "An error occurred while interacting with Queue" +
        error
      );
    }
  }
}
