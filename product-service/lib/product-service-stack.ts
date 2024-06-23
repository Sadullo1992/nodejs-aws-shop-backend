import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
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
