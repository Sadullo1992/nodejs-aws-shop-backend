import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { sendResponse } from "./helpers/sendResponse";
import { TProductDto, validateProductDto } from "./helpers/validateProductDto";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || "";

const db = DynamoDBDocument.from(new DynamoDB());

exports.handler = async (event: APIGatewayProxyEvent) => {
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2));
  console.info("EVENT\n" + JSON.stringify(event, null, 2));

  if (!event.body)
    return sendResponse(400, {
      message: "Invalid request, you are missing the parameter body",
    });

  const productDto =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);

  const isValidDto = validateProductDto(productDto);
  if (!isValidDto)
    return sendResponse(400, {
      message: "Invalid request body",
    });

  const id = randomUUID();

  const { title, description, price, count } = productDto as TProductDto;

  const productsParams = {
    TableName: PRODUCTS_TABLE_NAME,
    Item: {
      id,
      title,
      description,
      price,
    },
  };

  const stockParams = {
    TableName: STOCK_TABLE_NAME,
    Item: {
      productId: id,
      count,
    },
  };

  const transactParams = {
    TransactItems: [{ Put: productsParams }, { Put: stockParams }],
  };

  try {
    await db.transactWrite(transactParams);
    return sendResponse(201, {
      ...productDto,
      id,
    });
  } catch (dbError) {
    return sendResponse(500, { message: `DynamoDB Error: ${dbError}` });
  }
};
