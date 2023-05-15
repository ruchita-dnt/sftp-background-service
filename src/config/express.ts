import "reflect-metadata";
import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import { errorHandler } from "../middlewares/errorHandler";

const app = express();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use error handling middleware
app.use(errorHandler);

export default app;
