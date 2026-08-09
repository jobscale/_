#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CdkAppStack } from '../lib/cdk-app-stack.js';
import { CdkServerlessStack } from '../lib/cdk-serverless-stack.js';

const logger = new Proxy(console, {
  get(target, prop) {
    return target[prop];
  },
});

const app = new cdk.App();
const envName = app.node.tryGetContext('env');

const envConfigs = {
  dev: {
    imageId: 'ami-0b6d9d3d33ba97d99',
    instanceType: 't3.micro',
    vpcCidr: '10.0.0.0/16',
    publicSubnet1Cidr: '10.0.1.0/24',
    privateSubnet1Cidr: '10.0.2.0/24',
    publicSubnet2Cidr: '10.0.3.0/24',
    privateSubnet2Cidr: '10.0.4.0/24',
  },
  stg: {
    imageId: 'ami-0b6d9d3d33ba97d99',
    instanceType: 't3.small',
    vpcCidr: '10.1.0.0/16',
    publicSubnet1Cidr: '10.1.1.0/24',
    privateSubnet1Cidr: '10.1.2.0/24',
    publicSubnet2Cidr: '10.1.3.0/24',
    privateSubnet2Cidr: '10.1.4.0/24',
  },
};

const config = envConfigs[envName];
if (!config) {
  throw new Error(
    `Unknown env '${envName}'. Valid env are: ${Object.keys(envConfigs).join(', ')}`,
  );
}

logger.debug(typeof CdkAppStack);
// new CdkAppStack(app, `${envName}-cdk-app`, {
//   ...config,
//   envName,
// });

new CdkServerlessStack(app, `${envName}-cdk-serverless`, {
  envName,
});
