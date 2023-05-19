import express from "express";
import * as bodyParser from "body-parser";
import axios from "axios";
const dotenv = require("dotenv").config();
const Client = require("ssh2-sftp-client");
const sftp = new Client();
import { Storage } from "@google-cloud/storage";
import { join } from "path";
import FormData from "form-data";

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

if (!dotenv) {
  throw new Error("Unable to use dot env lib");
}

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = "development";

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

//This function will get called via backgroung job service and will download the files from source SFTP
async function downloadFolder() {
  try {
    //Connection to the SFTP server (This will be in configurable - For now it is static as we have demo SFTP server)
    await sftp.connect({
      host: process.env.HOST,
      port: process.env.PORT,
      user: process.env.USER,
      password: process.env.PASSWORD,
      secure: process.env.SECURE,
      // debug: console.log,
    });
    console.log(new Date().toLocaleString(), "Connected to SFTP server");

    const fileArrays: String[] = [];
    const allPromise: any[] = [];
    const allextension = process.env.allFileExtension || "txt";
    //This will list all the files present in the SFTP server
    await downloadFiles(
      process.env.ftpServerPath!,
      fileArrays,
      allextension,
      allPromise
    );
    Promise.all(allPromise)
      .then(async (result: any) => {
        console.log(new Date().toLocaleString(), "All Promise Resolve");

        await sftp.end();
      })
      .catch(async (error: any) => {
        console.log("error", error);
        await sftp.end();
      });
    // console.log("allPromise", allPromise);
  } catch (err) {
    console.error(err);
  } finally {
    // await sftp.end();
    // console.log("Disconnected from SFTP server");
  }
}

// Function for download all files from sftp.
const downloadFiles = async (
  path: string,
  filesArray: any,
  allextension: string,
  allPromise: any[]
) => {
  try {
    const files = await sftp.list(path);

    // console.log("files", files);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split(".")[1];
      let filePath;
      if (path !== "/") {
        filePath = join(path, file.name);
      } else {
        filePath = file.name;
      }
      const stat = await sftp.stat(filePath);
      // console.log("stat of ", file.name);
      // console.log("stat", stat);
      if (stat.isDirectory) {
        console.log("Folder: ", filePath);
        await downloadFiles(filePath, filesArray, allextension, allPromise);
      } else {
        if (
          allextension.includes("*") ||
          allextension.includes(fileExtension)
        ) {
          console.log("File: ", file.name);
          const tailNumber = path.replace(/\\/g, "");
          filesArray.push(`${tailNumber}/${file.name}`);

          const downloadMultipleFiles = (filePath: any, fileName: any) => {
            return new Promise(async (resolve, reject) => {
              try {
                console.log(new Date().toLocaleString(), "File Read Started");
                const readSream = await sftp.createReadStream(`${filePath}`);
                console.log(new Date().toLocaleString(), "File Read End");

                const formData = new FormData();
                formData.append("tailNumber", tailNumber);
                formData.append("file", readSream);

                console.log(
                  new Date().toLocaleString(),
                  "File receiver API trigger"
                );
                const apiCall = await axios.post(
                  process.env.apiURL!,
                  formData,
                  {
                    headers: { "content-type": "multipart/form-data" },
                  }
                );
                console.log(new Date().toLocaleString(), "API call End");
                console.log("API Response", apiCall.data);
                if (apiCall.status === 200) {
                  const deleteFile = await sftp.delete(
                    `${tailNumber}/${file.name}`
                  );
                  console.log(
                    `File deleted from SFTP: ${tailNumber}/${file.name}`
                  );
                  resolve(`File deleted from SFTP: ${tailNumber}/${file.name}`);
                }
              } catch (error) {
                reject(`Error in promise: ${fileName}, error: ${error}`);
              }
            });
          };
          allPromise.push(downloadMultipleFiles(filePath, file.name));
        }
      }
    }

    return filesArray;
  } catch (error) {
    console.error("Error from getAllFiles", error);
  }
};

app.listen(3000, function() {
  console.log("server is running on port 3000");
  downloadFolder();
});
