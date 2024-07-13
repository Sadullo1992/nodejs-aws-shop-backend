import { APIGatewayProxyEvent } from "aws-lambda";
import { sendResponse } from "./helpers/sendResponse";
import { validateProductDto } from "./helpers/validateProductDto";
import { writeRecordToDB } from "./helpers/writeRecordToDB";

exports.handler = async (event: APIGatewayProxyEvent) => {
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2));
  console.info("EVENT\n" + JSON.stringify(event, null, 2));

  if (!event.body)
    return sendResponse(400, {
      message: "Invalid request, you are missing the parameter body",
    });

  const productDto = JSON.parse(event.body);

  const isValidDto = validateProductDto(event.body);

  if (!isValidDto)
    return sendResponse(400, {
      message: "Invalid request body",
    });

  try {
    const product = await writeRecordToDB(productDto);

    return sendResponse(201, product);
  } catch (dbError) {
    return sendResponse(500, { message: `DynamoDB Error: ${dbError}` });
  }
};
