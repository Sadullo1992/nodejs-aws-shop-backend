import { Readable } from "node:stream";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import * as csv from "csv-parser";

const s3Client = new S3Client({});

exports.handler = async (event: S3Event): Promise<any> => {
  event.Records.forEach((record) => console.log(record.s3.object.key));

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const key = record.s3.object.key;

    const destKey = key.replace("uploaded", "parsed");

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    const copyParams = {
      Bucket: bucketName,
      CopySource: `${bucketName}/${key}`,
      Key: destKey,
    };

    const getCommand = new GetObjectCommand(params);
    const copyCommand = new CopyObjectCommand(copyParams);
    const deleteCommand = new DeleteObjectCommand(params);

    try {
      const response = await s3Client.send(getCommand);

      const readableStream = response.Body as Readable;

      readableStream
        .pipe(csv())
        .on("data", function (data) {
          console.log(data);
        })
        .on("end", async () => {
          console.log("Parsing is ended!!");
        });

      const resCopy = await s3Client.send(copyCommand);
      console.log("COPY: ", resCopy);

      const resDelete = await s3Client.send(deleteCommand);
      console.log("DELETE: ", resDelete);
    } catch (e) {
      console.log("ERROR", e);
    }
  }
};
