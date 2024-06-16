const productsLambda = require("../lambda-functions/getProductsList");

describe("Get products list handler", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  test("should return data", async () => {
    const mResponse = { code: 200, data: "mocked data" };

    const productsLambdaSpy = jest.spyOn(productsLambda, "handler").mockResolvedValueOnce(mResponse);
    
    const actualValue = await productsLambda.handler();
    expect(actualValue).toEqual(mResponse);
    expect(productsLambdaSpy).toHaveBeenCalled();
  });
});
