import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create our API Gateway
    const api = new RestApi(this, "ProductsRestAPI", {
      restApiName: "ProductsRestAPI",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    // Create our Lambda functions to handle requests
    const productsLambda = new NodejsFunction(this, "ProductsLambda", {
      entry: "lambda-functions/getProductsList.ts",
      handler: "handler",
    });

    const productLambda = new NodejsFunction(this, "ProductLambda", {
      entry: "resources/endpoints/getProductsById.ts",
      handler: "handler",
    });

    // Define our API Gateway endpoints
    const products = api.root.addResource("posts");
    const product = products.addResource("{id}");

    // Connect our Lambda functions to our API Gateway endpoints
    const productsIntegration = new LambdaIntegration(productsLambda);
    const productIntegration = new LambdaIntegration(productLambda);

    // Define our API Gateway methods
    products.addMethod("GET", productsIntegration);
    product.addMethod("GET", productIntegration);
  }
}
