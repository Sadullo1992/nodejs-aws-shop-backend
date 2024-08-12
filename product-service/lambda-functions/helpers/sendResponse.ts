export const sendResponse = (statusCode: number, data: unknown) => {
  if (typeof data === "string")
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods:": "POST, GET, OPTIONS",
      },
      body: data,
    };
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
    },
    body: JSON.stringify(data),
  };
};
