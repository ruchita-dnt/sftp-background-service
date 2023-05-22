export interface IGCPService {
  uploadFileOnBucket(filePath: string, destinationDir: string, id:number): Promise<any>;

  sendMessageTOPubSub(payload: any, topicName: string, id:number): Promise<any>;
}
