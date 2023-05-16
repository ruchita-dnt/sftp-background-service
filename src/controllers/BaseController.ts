/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, Request } from "express";
import { validationResult } from "express-validator";
import * as JSONBig from "json-bigint";
import { BadRequest } from "../errors/BadRequest";

import { GeneralError } from "../errors/GeneralError";

export default class BaseController {
  /**
   * Sends a JSON response, using the response object
   * @param {response} res Response object
   * @param {object} metadata Metadata to send along with response
   * @param {object} data data to send
   */
  sendJSONResponse(
    res: Response,
    message: string | null,
    metadata: any | null,
    data: any | null
  ) {
    const response: any = {
      code: 200,
      status: "OK",
      message,
    };
    if (metadata) {
      response.metadata = metadata;
    }
    response.data = data;
    return res
      .status(200)
      .contentType("application/json;charset=utf-8")
      .send(JSONBig.stringify(response));
  }

  /**
   * Send a JSON formated error response
   * @param req Request object
   * @param res Response object
   * @param error error object
   */
  sendErrorResponse(req: Request, res: Response, err: Error) {
    if (err instanceof GeneralError) {
      return res.status(err.getCode()).json(err.toJSON());
    }

    return res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: err.message,
    });
  }

  /**
   * Validate Request
   */
  validateRequest(req: Request) {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      const valsArray: any = validationResult(req).array();
      const vals = {};
      for (let i = 0; i < valsArray.length; i += 1) {
        if (vals[valsArray[i].param] === undefined) {
          vals[valsArray[i].param] = [valsArray[i].msg];
        } else {
          vals[valsArray[i].param].push(valsArray[i].msg);
        }
      }
      throw new BadRequest("Invalid arguments passed.", vals);
    }
  }
}
