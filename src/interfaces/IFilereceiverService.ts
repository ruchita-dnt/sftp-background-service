export interface IFilereceiverService {
  fileManager(files: string[]): Promise<any>;
}
