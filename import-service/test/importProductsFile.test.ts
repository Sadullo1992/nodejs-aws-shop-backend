const importProductsLambda = require("../lambda-functions/importProductsFile");
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

describe("Import products file handler", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("should return 200", async () => {
    const mockEvent = { queryStringParameters: { name: 'test.csv' } };
    const mockUrl = "/upload/test.csv"

    mockGetSignedUrl.mockReturnValueOnce(Promise.resolve(mockUrl));

    const actualValue = await importProductsLambda.handler(mockEvent);
    expect(actualValue.statusCode).toEqual(200);
  });

  test("should return 400", async () => {
    const mockEvent = { queryStringParameters: { id: 2 } };

    
    const actualValue = await importProductsLambda.handler(mockEvent);
    expect(actualValue.statusCode).toEqual(400);
  });
});
