import { SQSEvent } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "";
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME || "";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "";

const db = DynamoDBDocument.from(new DynamoDB());
const snsClient = new SNSClient({});

exports.handler = async (event: SQSEvent) => {
  

  for (const record of event.Records) {
    const snsProducts = [];
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

      snsProducts.push(item);
    } catch (dbError) {
      console.log(dbError);
    }

    const snsMessage = JSON.stringify({
      message: "Products added",
      products: snsProducts,
    });

    const publishCommand = new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: snsMessage,
      MessageAttributes: {
        price: {
          DataType: 'Number',
          StringValue: `${price}`
        }
      }
    });

    const response = await snsClient.send(publishCommand);
    console.log("SNS_Message: ", snsMessage);
    console.log("MESSAGE_ID: ", response.MessageId);
  }

  
};
