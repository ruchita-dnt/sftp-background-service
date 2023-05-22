import { IFilereceiverService } from "../interfaces/IFilereceiverService";
import BaseController from "./BaseController";
import * as express from "express";

export default class FilereceiverController extends BaseController {
  private _filereceiverService: IFilereceiverService;

  constructor(filereceiverService: IFilereceiverService) {
    super();
    this._filereceiverService = filereceiverService;
  }

  async fileManager(req: express.Request, res: express.Response) {
    try {
      const files = req.body.downloadedFiles;

      const fileManager = await this._filereceiverService.fileManager(files, 1);

      // Return response
      return this.sendJSONResponse(
        res,
        "File Uploaded Successfully",
        null,
        fileManager
      );
    } catch (error) {
      return this.sendErrorResponse(req, res, error);
    }
  }
}
