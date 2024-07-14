
export const compareCredentials = (authorizationHeader: string) => {
  const encodedCredentials = authorizationHeader.split(" ")[1];
  console.log("ENCODED_CREDENTIALS", encodedCredentials);

  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString(
    "utf-8"
  );
  console.log("DECODED_CREDENTIALS", decodedCredentials);

  const [username, password] = decodedCredentials.split("=");

  const USER_PASSWORD = process.env[username];
  console.log("USER_PASSWORD", USER_PASSWORD);

  const isMatchPassword = !!password && USER_PASSWORD === password;

  return { isMatchPassword, username };
};
