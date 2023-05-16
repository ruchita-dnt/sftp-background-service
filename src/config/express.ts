import "reflect-metadata";
import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import { errorHandler } from "../middlewares/errorHandler";
import env from "./env";
import routers from "../routes/index";

const app = express();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use(
  `${env.API_ROOT}/${env.API_VERSION}/filereceiver`,
  routers.filereceiverRouter
);

// Use error handling middleware
app.use(errorHandler);

export default app;
