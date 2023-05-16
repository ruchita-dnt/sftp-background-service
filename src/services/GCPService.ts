import { InternalServerError } from "../errors/InternalServerError";
import { IGCPService } from "../interfaces/IGCPService";
import { Storage } from "@google-cloud/storage";
import { PubSub } from "@google-cloud/pubsub";
import env from "../config/env";
import { injectable } from "inversify";

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
    destinationDir: string
  ): Promise<any> {
    try {
      const upload = await gcs.upload(filePath, {
        destination: destinationDir,
      });

      return upload;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the uploadFileOnBucket service." +
          error
      );
    }
  }

  async sendMessageTOPubSub(payload: any, topicName: string): Promise<any> {
    try {
      const payloadBuffer = Buffer.from(JSON.stringify(payload));
      const sendMessage = await pubsub
        .topic(topicName)
        .publishMessage({ data: payloadBuffer });

      return sendMessage;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the sendMessageTOPubSub service." +
          error
      );
    }
  }
}
