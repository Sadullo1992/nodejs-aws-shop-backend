import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function resource
    const productsListFunction = new lambda.Function(
      this,
      "ProductsListFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "getProductsList.handler",
      }
    );

    // Define the API Gateway resource
    const api = new apigateway.LambdaRestApi(this, "ProductsListApi", {
      handler: productsListFunction,
      proxy: false,
    });

    // Define the '/hello' resource with a GET method
    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET");
  }
}
