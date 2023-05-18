import { inject, injectable } from "inversify";
import { IDataManagementService } from "../interfaces/IDataManagementService";
import { InternalServerError } from "../errors/InternalServerError";

@injectable()
export class DataManagementService implements IDataManagementService
{
  constructor()
  {
  }

  async queueListen(payload: any): Promise<any>
  {
    try
    {
      const message = payload.body ? payload.body.message : null;
      console.log("message", message);
      if (message)
      {
        const buffer = Buffer.from(message.data, "base64").toString();
        const data = JSON.parse(buffer!);
        console.log("Ack Message", message.messageId);
        //ToDo: Update Entry in file_master and create entry in file_process_details with status - QUEUE_SUCCESS
        //Data Needed to be update in both table
        /** 
        * file_master: id, status
        * 
        * file_process_details: fileId, status, description, time, createdAt
        */
        return true;
      } else
      {
        return false;
      }

    } catch (error)
    {
      //ToDo: Update Entry in file_master and create entry in file_process_details with status - FAILED
      //Data Needed to be update in both table
      /** 
       * file_master: id, status
       * 
       * file_process_details: fileId, status, description, time, createdAt
       */
      throw new InternalServerError(
        "An error occurred while interacting with Queue" +
        error
      );
    }
  }
}
