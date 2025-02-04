import * as cdk from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import {
  AuthorizationType,
  Cors,
  LambdaIntegration,
  RestApi,
  TokenAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName = "aws-shop-task-5-bucket-csv";

    // Bucket from AWS Console
    const bucket = s3.Bucket.fromBucketName(
      this,
      "ImportServiceBucket",
      bucketName
    );

    // Create our API Gateway
    const api = new RestApi(this, "ImportProductsRestAPI", {
      restApiName: "ImportProductsRestAPI",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    // Import sqs
    const queueArn = cdk.Fn.importValue("catalog-items-queue-arn");
    const queue = sqs.Queue.fromQueueArn(
      this,
      "CatalogItemsQueueInstance",
      queueArn
    );

    // Create lambda function
    const importProductsLambda = new NodejsFunction(
      this,
      "ImportProductsLambda",
      {
        runtime: Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "importProductsFile.handler",
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    const parseProductsLambda = new NodejsFunction(
      this,
      "ParseProductsLambda",
      {
        runtime: Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "importFileParser.handler",
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    // Instantiated lambda function
    const basicAuthorizerLambda = lambda.Function.fromFunctionName(
      this,
      "ImportBasicAuthorizerLambda",
      "BasicAuthorizerLambda"
    );

    // Create authorizer
    const authorizer = new TokenAuthorizer(this, "BasicAuthorizer", {
      handler: basicAuthorizerLambda,
      identitySource: "method.request.header.Authorization",
    });

    // Allow lambda function to bucket
    bucket.grantPut(importProductsLambda);
    bucket.grantReadWrite(importProductsLambda);

    bucket.grantPut(parseProductsLambda);
    bucket.grantReadWrite(parseProductsLambda);
    bucket.grantDelete(parseProductsLambda);

    // Define our API Gateway endpoints
    const importProductsResource = api.root.addResource("import");

    // Connect our Lambda functions to our API Gateway endpoints
    const importProductsIntegration = new LambdaIntegration(
      importProductsLambda,
      {
        integrationResponses: [
          {
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
            statusCode: "200",
          },
        ],
      }
    );

    // Define our API Gateway methods
    importProductsResource.addMethod("GET", importProductsIntegration, {
      authorizationType: AuthorizationType.CUSTOM,
      authorizer,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Notifying lambda When new file appeared in s3 bucket
    const notification = new LambdaDestination(parseProductsLambda);
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, notification, {
      prefix: "uploaded/",
    });

    // Allow send message to queue
    queue.grantSendMessages(parseProductsLambda);
  }
}
