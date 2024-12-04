const catalogBatchProcessLambda = require("../lambda-functions/catalogBatchProcess");

import { mockClient } from "aws-sdk-client-mock";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

import "aws-sdk-client-mock-jest";

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const mDynamoDBClient = { transactWrite: jest.fn() };
  return {
    DynamoDB: jest.fn(() => mDynamoDBClient),
    DynamoDBDocument: {
      from: jest.fn(() => mDynamoDBClient),
    },
  };
});

const snsClientMock = mockClient(SNSClient);

describe("Catalog Batch process", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Publish sns msg", async () => {
    jest.spyOn(global.console, "log").mockImplementation(() => {});

    const mockEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Product 1",
            description: "Description",
            price: 700,
            count: 10,
          }),
        },
      ],
    };
    await catalogBatchProcessLambda.handler(mockEvent);

    expect(snsClientMock).toHaveReceivedCommandTimes(PublishCommand, 1);
  });
});
