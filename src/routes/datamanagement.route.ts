import express from "express";
import { TYPES } from "../config/types";
import { iocContainer as Container } from "../config/container";
import { IDataManagementService } from "../interfaces/IDataManagementService";
import DataManagementController from "../controllers/DataManagementController";

const router = express.Router();

const filereceiverService = Container.get<IDataManagementService>(
  TYPES.FilereceiverService
);

const dataManagementController = new DataManagementController(filereceiverService);

router.post("/listen", (req, res) => dataManagementController.queueListen(req, res));

export default router;
