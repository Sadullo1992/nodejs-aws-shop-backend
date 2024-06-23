import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  Cors,
  IResource,
  LambdaIntegration,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create our DynamoDB tables
    const productsTable = new Table(this, "products", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: "products",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new Table(this, "stock", {
      partitionKey: {
        name: "productId",
        type: AttributeType.STRING,
      },
      tableName: "stock",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create our API Gateway
    const api = new RestApi(this, "ProductsRestAPI", {
      restApiName: "ProductsRestAPI",
    });

    // Create our Lambda functions to handle requests
    const productsLambda = new NodejsFunction(this, "ProductsLambda", {
      runtime: Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda-functions"),
      handler: "getProductsList.handler",
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    const productLambda = new NodejsFunction(this, "ProductLambda", {
      runtime: Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda-functions"),
      handler: "getProductsById.handler",
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    const createProductLambda = new NodejsFunction(
      this,
      "CreateProductLambda",
      {
        runtime: Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "createProduct.handler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    // Grant our Lambda functions access to our DynamoDB table
    productsTable.grantReadWriteData(productsLambda);
    productsTable.grantReadWriteData(productLambda);
    productsTable.grantReadWriteData(createProductLambda);

    stockTable.grantReadWriteData(productsLambda);
    stockTable.grantReadWriteData(productLambda);
    stockTable.grantReadWriteData(createProductLambda);

    // Define our API Gateway endpoints
    const products = api.root.addResource("products");
    const product = products.addResource("{id}");

    // Add CORS
    addCorsOptions(products);
    addCorsOptions(product);

    // Connect our Lambda functions to our API Gateway endpoints
    const productsIntegration = new LambdaIntegration(productsLambda);
    const productIntegration = new LambdaIntegration(productLambda);
    const createProductIntegration = new LambdaIntegration(createProductLambda);

    // Define our API Gateway methods
    products.addMethod("GET", productsIntegration);
    products.addMethod("POST", createProductIntegration);
    product.addMethod("GET", productIntegration);
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new MockIntegration({
      // In case you want to use binary media types, uncomment the following line
      // contentHandling: ContentHandling.CONVERT_TO_TEXT,
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials":
              "'false'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      // In case you want to use binary media types, comment out the following line
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    }
  );
}
