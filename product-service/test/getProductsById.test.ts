const productByIdLambda = require("../lambda-functions/getProductsById");

const mockProduct = {
  id: "1",
  title: "Mac Pro 14",
  description: "Very good laptop",
  price: 800,
};

describe("Get product by id handler", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  test("should return data", async () => {
    const mResponse = { code: 200, body: JSON.stringify(mockProduct) };
    const mockEvent = { pathParameters: { id: '1' } };
    const productByIdLambdaSpy = jest
      .spyOn(productByIdLambda, "handler")
      .mockResolvedValueOnce(mResponse);

    const actualValue = await productByIdLambda.handler(mockEvent);
    expect(actualValue).toEqual(mResponse);
    expect(productByIdLambdaSpy).toHaveBeenCalledWith(mockEvent);
  });

  test("should return 404 error message", async () => {
    const mockEvent = { pathParameters: { id: '1453547583485843' } };
    const actualValue = await productByIdLambda.handler(mockEvent);
    expect(actualValue.statusCode).toEqual(404);
    expect(actualValue.body).toEqual(
      JSON.stringify({ message: "Product not found" })
    );
  });

  test("should return 200 code", async () => {
    const mockEvent = { pathParameters: { id: '1' } };
    const actualValue = await productByIdLambda.handler(mockEvent);
    expect(actualValue.statusCode).toEqual(200);
  });
});
