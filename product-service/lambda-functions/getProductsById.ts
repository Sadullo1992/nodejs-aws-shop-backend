import { products } from "./products";

exports.handler = async (event: { pathParameters: { id: string } }) => {
  const id = event.pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
      },
      body: JSON.stringify({ message: "Missing path parameter: id" }),
    };
  }

  const product = products.find((item) => item.id === id);
  if (!product) {
    return {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
      },
      body: JSON.stringify({ message: "Product not found" }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
    },
    body: JSON.stringify(product),
  };
};
