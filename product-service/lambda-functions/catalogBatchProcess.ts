import { SQSEvent } from "aws-lambda";
import { validateProductDto } from "./helpers/validateProductDto";
import { writeRecordToDB } from "./helpers/writeRecordToDB";
import { publishSNS } from "./helpers/publishSNS";

exports.handler = async (event: SQSEvent) => {
  console.info("EVENT\n" + JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const productDto = JSON.parse(record.body);

    const price = Number(productDto.price);
    const count = Number(productDto.count) || 0;

    const convertedDto = {
      ...productDto,
      price,
      count,
    };

    const isValidDto = validateProductDto(convertedDto);
    if (!isValidDto) throw new Error("Bad request: Invalid request body");

    try {
      const product = await writeRecordToDB(convertedDto);
      await publishSNS(product);
    } catch (err) {
      console.error(err);
    }
  }
};
