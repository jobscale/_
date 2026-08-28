#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { logger } from '@jobscale/create-logger';
import { AppStack } from '../lib/app-stack.js';

const cdkApp = new cdk.App();
const envName = cdkApp.node.tryGetContext('env');

const envConfigs = {
  dev: {
    env: {
      account: '916921211348',
      region: 'us-east-1',
    },
    context: {
      instanceType: 't3.micro',
      eipAllocationId: '',
      vpcCidr: '10.0.0.0/16',
      publicSubnet1Cidr: '10.0.1.0/24',
      privateSubnet1Cidr: '10.0.2.0/24',
      publicSubnet2Cidr: '10.0.3.0/24',
      privateSubnet2Cidr: '10.0.4.0/24',
    },
  },
  stg: {
    env: {
      account: '393035998684',
      region: 'ap-northeast-1',
    },
    context: {
      instanceType: 't3.small',
      eipAllocationId: '',
      vpcCidr: '10.1.0.0/16',
      publicSubnet1Cidr: '10.1.1.0/24',
      privateSubnet1Cidr: '10.1.2.0/24',
      publicSubnet2Cidr: '10.1.3.0/24',
      privateSubnet2Cidr: '10.1.4.0/24',
    },
  },
  pink: {
    env: {
      account: '393035998684',
      region: 'ap-northeast-1',
    },
    context: {
      instanceType: 't3.small',
      eipAllocationId: '',
      vpcCidr: '10.1.0.0/16',
      publicSubnet1Cidr: '10.1.1.0/24',
      privateSubnet1Cidr: '10.1.2.0/24',
      publicSubnet2Cidr: '10.1.3.0/24',
      privateSubnet2Cidr: '10.1.4.0/24',
    },
  },
};

const config = envConfigs[envName];
if (!config) {
  const envList = Object.keys(envConfigs).join(', ');
  const message = `Unknown env '${envName}'. Valid env are: ${envList}`;
  logger.error({ message, envName, envList });
  throw new Error(message);
}

new AppStack(cdkApp, `${envName}-net`, {
  ...config.context,
  envName,
  env: config.env,
});
