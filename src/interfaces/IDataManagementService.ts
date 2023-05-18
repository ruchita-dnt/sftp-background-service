export interface IDataManagementService
{
  queueListen(payload: any): Promise<any>;
}
