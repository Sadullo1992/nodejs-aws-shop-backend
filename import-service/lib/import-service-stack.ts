import * as cdk from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
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

    // Allow lambda function to bucket
    bucket.grantPut(importProductsLambda);
    bucket.grantReadWrite(importProductsLambda);

    // Define our API Gateway endpoints
    const importProductsResource = api.root.addResource("import");

    // Connect our Lambda functions to our API Gateway endpoints
    const importProductsIntegration = new LambdaIntegration(
      importProductsLambda
    );

    // Define our API Gateway methods
    importProductsResource.addMethod('GET', importProductsIntegration);
  }
}
