import { SQSEvent } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || "";

const db = DynamoDBDocument.from(new DynamoDB());

exports.handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    if (!record?.body)
      console.error("Invalid request, you are missing the parameter body");

    const item =
      typeof record.body == "object" ? record.body : JSON.parse(record.body);

    const { id, title, description, count, price } = item;

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
    } catch (dbError) {
      console.log(dbError);
    }
  }
};
