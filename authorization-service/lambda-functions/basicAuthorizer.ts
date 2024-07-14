import { compareCredentials } from "./helpers/compareCredentials";
import { generatePolicy } from "./helpers/generatePolicy";

exports.handler = async (
  event: any = {},
  ctx: any,
  callback: any
): Promise<any> => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const authorizationHeader = event["authorizationToken"];

  if (!authorizationHeader) callback("Unauthorized");

  const { isMatchPassword, username } = compareCredentials(authorizationHeader);

  if (isMatchPassword)
    callback(null, generatePolicy(username, "Allow", event.methodArn));
  else callback(null, generatePolicy(username, "Deny", event.methodArn));
};
