import express from "express";
import { TYPES } from "../config/types";
import { iocContainer as Container } from "../config/container";
import { IFilereceiverService } from "../interfaces/IFilereceiverService";
import FilereceiverController from "../controllers/FilereceiverController";

const router = express.Router();

const filereceiverService = Container.get<IFilereceiverService>(
  TYPES.FilereceiverService
);

const filereceiverController = new FilereceiverController(filereceiverService);

router.post("/", (req, res) => filereceiverController.fileManager(req, res));

export default router;
