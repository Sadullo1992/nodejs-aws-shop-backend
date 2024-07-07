import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
  Cors,
  LambdaIntegration,
  RestApi,
  Model,
  JsonSchemaType,
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
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    // Create SQS queue
    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "CatalogItemsQueue",
    });
    new cdk.CfnOutput(this, "catalog-items-queue-arn", {
      value: catalogItemsQueue.queueArn,
      exportName: "catalog-items-queue-arn",
    });

    // Create SNS Topic
    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      topicName: "CreateProductTopic",
    });
    createProductTopic.addSubscription(
      new EmailSubscription("sadulloburiyev@gmail.com")
    );

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

    const catalogBatchProcessLambda = new NodejsFunction(
      this,
      "CatalogBatchProcessLambda",
      {
        runtime: Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        functionName: "CatalogBatchProcessLambda",
        handler: "catalogBatchProcess.handler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
          SNS_TOPIC_ARN: createProductTopic.topicArn
        },
      }
    );

    // Grant our Lambda functions access to our DynamoDB table
    productsTable.grantReadWriteData(productsLambda);
    productsTable.grantReadWriteData(productLambda);
    productsTable.grantReadWriteData(createProductLambda);
    productsTable.grantReadWriteData(catalogBatchProcessLambda);

    stockTable.grantReadWriteData(productsLambda);
    stockTable.grantReadWriteData(productLambda);
    stockTable.grantReadWriteData(createProductLambda);
    stockTable.grantReadWriteData(catalogBatchProcessLambda);

    // Define our API Gateway endpoints
    const products = api.root.addResource("products");
    const product = products.addResource("{id}");

    // Connect our Lambda functions to our API Gateway endpoints
    const productsIntegration = new LambdaIntegration(productsLambda);
    const productIntegration = new LambdaIntegration(productLambda);
    const createProductIntegration = new LambdaIntegration(createProductLambda);

    // Validate creation product body
    const createProductSchema = new Model(this, "CreateProductSchema", {
      restApi: api,
      contentType: "application/json",
      schema: {
        type: JsonSchemaType.OBJECT,
        properties: {
          title: { type: JsonSchemaType.STRING },
          description: { type: JsonSchemaType.STRING },
          price: { type: JsonSchemaType.NUMBER },
          count: { type: JsonSchemaType.NUMBER },
        },
        required: ["title", "description", "price", "count"],
      },
    });

    // Define our API Gateway methods
    products.addMethod("GET", productsIntegration);
    products.addMethod("POST", createProductIntegration, {
      requestModels: {
        "application/json": createProductSchema,
      },
      requestValidatorOptions: {
        validateRequestBody: true,
      },
    });

    product.addMethod("GET", productIntegration);

    // Create an SQS event source
    const eventSource = new SqsEventSource(catalogItemsQueue, { batchSize: 5 });
    catalogBatchProcessLambda.addEventSource(eventSource);

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);

    // Allow to publish
    createProductTopic.grantPublish(catalogBatchProcessLambda);
  }
}
