import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || "";

const db = DynamoDBDocument.from(new DynamoDB());

exports.handler = async (event: APIGatewayProxyEvent) => {
  const requestedItemId = event.pathParameters?.id;

  if (!requestedItemId)
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Error: You are missing the path parameter id",
      }),
    };

  const productsParams = {
    TableName: PRODUCTS_TABLE_NAME,
    Key: {
      id: requestedItemId,
    },
  };

  const stockParams = {
    TableName: STOCK_TABLE_NAME,
    Key: {
      productId: requestedItemId,
    },
  };

  try {
    const productRes = await db.get(productsParams);
    const stockRes = await db.get(stockParams);
    const product = productRes.Item;
    const stock = stockRes.Item;

    if (!product)
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found" }),
      };

    const count = !stock ? 0 : stock.count;

    const productWithCount = {
      ...product,
      count,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(productWithCount),
    };
  } catch (dbError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `DynamoDB Error: ${dbError}` }),
    };
  }
};
