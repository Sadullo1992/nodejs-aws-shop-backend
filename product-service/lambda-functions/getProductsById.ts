import { products } from "./products";

exports.handler = async (event: { pathParameters: { id: string } }) => {
  const id = event.pathParameters?.id;

  const product = products.find((item) => item.id === id);
  if (!product) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(product),
  };
};
