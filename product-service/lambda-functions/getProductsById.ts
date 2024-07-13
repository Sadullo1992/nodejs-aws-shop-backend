import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { sendResponse } from "./helpers/sendResponse";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || "";

const db = DynamoDBDocument.from(new DynamoDB());

exports.handler = async (event: APIGatewayProxyEvent) => {
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2));
  console.info("EVENT\n" + JSON.stringify(event, null, 2));

  const requestedItemId = event.pathParameters?.id;

  if (!requestedItemId)
    return sendResponse(400, {
      message: "Error: You are missing the path parameter id",
    });

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

    if (!product) return sendResponse(404, { message: "Product not found" });

    const count = !stock ? 0 : stock.count;

    const productWithCount = {
      ...product,
      count,
    };

    return sendResponse(200, productWithCount);
  } catch (dbError) {
    return sendResponse(500, { message: `DynamoDB Error: ${dbError}` });
  }
};
