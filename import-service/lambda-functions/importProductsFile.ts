import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent } from "aws-lambda";
import { sendResponse } from "./sendResponse";

const s3Client = new S3Client({});

exports.handler = async (event: APIGatewayProxyEvent) => {
  const bucketName = process.env.BUCKET_NAME;

  const fileName = event.queryStringParameters?.name;

  if(!fileName)  return sendResponse(400, {
    message: "Error: You are missing the path parameter name",
  });

  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: `uploaded/${fileName}`,
    }),
    { expiresIn: 60 }
  );

  return sendResponse(200, uploadUrl);
};
