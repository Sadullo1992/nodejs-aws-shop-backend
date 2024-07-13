const importFileParserLambda = require("../lambda-functions/importFileParser");
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { sdkStreamMixin } from "@smithy/util-stream";
import { mockClient } from "aws-sdk-client-mock";
import { createReadStream } from "fs";
import "aws-sdk-client-mock-jest";

const s3Mock = mockClient(S3Client);

describe("Import file parser", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("test for get delete copy object", async () => {
    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: { name: "mock-bucket" },
            object: { key: "uploaded/products.csv" },
          },
        },
      ],
    };

    const stream = createReadStream("./test/mocks/products.csv");

    const sdkStream = sdkStreamMixin(stream);

    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });

    const s3 = new S3Client({});

    const getObjectResult = await s3.send(
      new GetObjectCommand({ Bucket: "", Key: "" })
    );

    const str = await getObjectResult.Body?.transformToString();
    await importFileParserLambda.handler(mockEvent);

    expect(str).toContain("id,description");
    expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 2);
    expect(s3Mock).toHaveReceivedCommandTimes(CopyObjectCommand, 1);
    expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectCommand, 1);
  });
});
