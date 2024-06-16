import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

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
      runtime: Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda-functions"),
      handler: "getProductsList.handler",
    });

    const productLambda = new NodejsFunction(this, "ProductLambda", {
      runtime: Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda-functions"),
      handler: "getProductsById.handler",
    });

    // Define our API Gateway endpoints
    const products = api.root.addResource("products");
    const product = products.addResource("{id}");

    // Connect our Lambda functions to our API Gateway endpoints
    const productsIntegration = new LambdaIntegration(productsLambda);
    const productIntegration = new LambdaIntegration(productLambda);

    // Define our API Gateway methods
    products.addMethod("GET", productsIntegration);
    product.addMethod("GET", productIntegration);
  }
}
