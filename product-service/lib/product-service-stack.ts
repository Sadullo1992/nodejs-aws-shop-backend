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
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { ConfigProps } from "./config";

type AwsEnvStackProps = cdk.StackProps & {
  config: Readonly<ConfigProps>;
};

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsEnvStackProps) {
    super(scope, id, props);
    // ENV config
    const { config } = props;

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
    createProductTopic.addSubscription(
      new EmailSubscription("sadulloburiyev1992@gmail.com", {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            lessThan: 500,
          }),
        },
      })
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
          UNSPLASH_ACCESS_KEY: config.UNSPLASH_ACCESS_KEY,
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
          SNS_TOPIC_ARN: createProductTopic.topicArn,
          UNSPLASH_ACCESS_KEY: config.UNSPLASH_ACCESS_KEY,
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

    // Define our API Gateway methods
    products.addMethod("GET", productsIntegration);
    products.addMethod("POST", createProductIntegration);

    product.addMethod("GET", productIntegration);

    // Create an SQS event source
    const eventSource = new SqsEventSource(catalogItemsQueue, { batchSize: 5 });
    catalogBatchProcessLambda.addEventSource(eventSource);

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);

    // Allow to publish
    createProductTopic.grantPublish(catalogBatchProcessLambda);
  }
}
