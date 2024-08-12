import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { ProductDto } from "./validateProductDto";

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "";

const snsClient = new SNSClient({});

export const publishSNS = async (product: ProductDto & { id: string }) => {
  const { title, price, description, count } = product;

  const messageBody = `New product created:\nProduct: ${title}\nPrice: ${price},\nDescription: ${description},\nCount: ${
    count || 0
  }`;

  const publishCommand = new PublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Message: messageBody,
    MessageAttributes: {
      price: {
        DataType: "Number",
        StringValue: price.toString(),
      },
    },
  });

  const response = await snsClient.send(publishCommand);
  console.log("Message has been sent MESSAGE_ID: ", response.MessageId);
};
