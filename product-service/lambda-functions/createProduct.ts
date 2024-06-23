import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || "";

const db = DynamoDBDocument.from(new DynamoDB());

exports.handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body)
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid request, you are missing the parameter body",
      }),
    };

  const item =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);

  const id = randomUUID();

  const productsParams = {
    TableName: PRODUCTS_TABLE_NAME,
    Item: {
      id,
      title: item.title,
      description: item.description,
      price: item.price,
    },
  };

  const stockParams = {
    TableName: STOCK_TABLE_NAME,
    Item: {
      productId: id,
      count: item.count,
    },
  };

  try {
    await db.put(productsParams);
    await db.put(stockParams);
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Product is created",
      }),
    };
  } catch (dbError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `DynamoDB Error: ${dbError}` }),
    };
  }
};
