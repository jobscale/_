import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import path from 'path';

export class CdkServerlessStack extends cdk.Stack {
  constructor(scope, id, props = {}) {
    const { envName = 'dev', ...stackProps } = props;
    super(scope, id, stackProps);

    cdk.Tags.of(this).add('Env', envName, {
      excludeResourceTypes: ['AWS::ApiGatewayV2::Api'],
    });

    const helloFunction = new lambda.Function(this, 'HelloFunction', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(process.cwd(), 'lib', 'functions', 'hello')),
      environment: {
        ENV: envName,
      },
    });

    const httpApi = new apigwv2.CfnApi(this, 'HttpApi', {
      body: {
        openapi: '3.0.1',
        info: {
          title: `${this.stackName} API`,
          version: '1.0',
        },
        servers: [{
          url: 'https://serverless.jsx.jp',
          'x-amazon-apigateway-endpoint-configuration': {
            disableExecuteApiEndpoint: true,
          },
        }],
        paths: {
          '/hello': {
            get: {
              operationId: 'hello',
              responses: {
                200: {
                  description: '200 OK',
                },
              },
              'x-amazon-apigateway-integration': {
                type: 'AWS_PROXY',
                payloadFormatVersion: '2.0',
                uri: cdk.Fn.sub(
                  'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations', {
                    LambdaArn: helloFunction.functionArn,
                  },
                ),
              },
            },
          },
        },
      },
    });

    new apigwv2.CfnStage(this, 'HttpApiStage', {
      apiId: httpApi.ref,
      stageName: '$default',
      autoDeploy: true,
    });

    helloFunction.addPermission('HttpApiInvokePermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: cdk.Fn.join('', [
        'arn:',
        cdk.Fn.ref('AWS::Partition'),
        ':execute-api:',
        cdk.Fn.ref('AWS::Region'),
        ':',
        cdk.Fn.ref('AWS::AccountId'),
        ':',
        httpApi.ref,
        '/*/*/hello',
      ]),
    });

    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: cdk.Fn.join('', ['https://', httpApi.attrApiEndpoint, '/hello']),
      description: 'HTTP API endpoint for /hello',
    });
  }
}
