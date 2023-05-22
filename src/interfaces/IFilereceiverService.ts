export interface IFilereceiverService {
  fileManager(files: string[], id: number): Promise<any>;
}
