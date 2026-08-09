#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CdkAppStack } from '../lib/cdk-app-stack.js';

const app = new cdk.App();
const envName = app.node.tryGetContext('env');

const environmentConfigs = {
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

const config = environmentConfigs[envName];
if (!config) {
  throw new Error(
    `Unknown environment '${envName}'. Valid environments are: ${Object.keys(environmentConfigs).join(', ')}`,
  );
}

new CdkAppStack(app, `${envName}-cdk-app`, {
  ...config,
  environmentName: envName,
});
