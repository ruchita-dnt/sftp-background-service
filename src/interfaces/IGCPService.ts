export interface IGCPService {
  uploadFileOnBucket(filePath: string, destinationDir: string): Promise<any>;

  sendMessageTOPubSub(payload: any, topicName: string): Promise<any>;
}
