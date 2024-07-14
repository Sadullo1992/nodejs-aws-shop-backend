import * as cdk from 'aws-cdk-lib';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { ConfigProps } from './config';

type AwsEnvStackProps = cdk.StackProps & {
  config: Readonly<ConfigProps>;
};

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsEnvStackProps) {
    super(scope, id, props);

    // ENV config
    const { config } = props;

    // Create auth Lambda
    new NodejsFunction(this, "BasicAuthorizerLambda", {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset("lambda-functions"),
      handler: "basicAuthorizer.handler",
      functionName: "BasicAuthorizerLambda",
      environment: {
        [config.LOGIN]: config.PASSWORD,
      },
    });
  }
}
