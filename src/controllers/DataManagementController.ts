import { IDataManagementService } from "../interfaces/IDataManagementService";
import BaseController from "./BaseController";
import * as express from "express";

export default class DataManagementController extends BaseController {
  private _datamanagementservice: IDataManagementService;

  constructor(datamanagementService: IDataManagementService) {
    super();
    this._datamanagementservice = datamanagementService;
  }

  async queueListen(req: express.Request, res: express.Response) {
    try {
      const message = req.body.message;

      const queueListen = await this._datamanagementservice.queueListen(message);

      // Return response
      return this.sendJSONResponse(
        res,
        "Queue success...",
        null,
        queueListen
      );
    } catch (error) {
      return this.sendErrorResponse(req, res, error);
    }
  }
}
