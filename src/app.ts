import express from "express";
import * as bodyParser from "body-parser";
const dotenv = require("dotenv").config();
import { Storage } from "@google-cloud/storage";
import { PubSub } from "@google-cloud/pubsub";
import multer from "multer";
import MulterGoogleCloudStorage from "multer-cloud-storage";

const gcpConfig = {
  projectId: process.env.PROJECT_ID,
  credentials: {
    token_url: process.env.TOKEN_URL,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    private_key: process.env.PRIVATE_KEY!.split(String.raw`\n`).join("\n"),
  },
};

//GCS - Cloud storage details
const storage = new Storage(gcpConfig);
const pubsub = new PubSub(gcpConfig);

if (!dotenv) {
  throw new Error("Unable to use dot env lib");
}

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = "development";

//Bucket name should read from the environment variables
const bucketName = process.env.bucketName;
const Bucket = storage.bucket(bucketName!);

const upload = multer({
  storage: new MulterGoogleCloudStorage({
    bucket: bucketName,
    projectId: gcpConfig.projectId,
    credentials: gcpConfig.credentials,
    destination: (req: any, file: any, cb: any) => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const date = currentDate.getDate();
      cb(null, `QAR/${req.body.tailNumber}/${year}/${month}/${date}/`);
    },
    filename: (req: any, file: any, cb: any) => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const date = currentDate.getDate();
      cb(null, `${file.originalname.replace(" ", "")}`);
    },
  }),
});

// express server
const app = express();

// middlware for parse data in urlencoded
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// middlware for parse data in json
app.use(bodyParser.json());

//This POST API will upload the downloaded files to Google storage area in the bucket
app.post("/", upload.single("file"), async (req: any, res: any) => {
  console.log(`File ${req.file.originalname} Uploaded on ${bucketName}`);

  const payload = JSON.stringify({
    fileType: "QAR",
    // fileType: fileName.includes("QAR") ? "QAR" : "ODW",
    fileName: req.file.originalname,
    bucketName,
    fileLocation: req.file.linkUrl,
  });
  console.log("Queue Message: ", JSON.parse(payload));
  const payloadBuffer = Buffer.from(payload);
  const sendMessage = await pubsub
    .topic("ge-queue")
    .publishMessage({ data: payloadBuffer });
  console.log("sendMessage", sendMessage);

  return res.status(200).json({
    status: 200,
    message: "Files uploaded successfully",
    data: req.file.originalname,
  });
});

// This endpoint is for Document Management API. Listen all messages from Google Pub/Sub.
app.post("/listen", (req: any, res: any) => {
  try {
    const message = req.body ? req.body.message : null;
    console.log("message", message);
    if (message) {
      const buffer = Buffer.from(message.data, "base64").toString();
      const data = JSON.parse(buffer!);
      console.log("Ack Message", message.messageId);
      return res.status(200).json({ messageId: message.messageId, data: data });
    } else {
      return res.status(200).json({ data: "No message data found" });
    }
  } catch (error) {
    console.log("Error in listen message", error);
    return res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: error,
    });
  }
});

app.listen(3000, function() {
  console.log("server is running on port 3000");
});
