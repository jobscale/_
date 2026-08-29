import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { logger } from '@jobscale/create-logger';
import { ec2Bastion } from '../lib/cdk/ec2-bastion.js';

export class AppStack extends cdk.Stack {
  constructor(scope, id, props = {}) {
    const { envName = 'dev', ...stackProps } = props;
    super(scope, id, stackProps);

    cdk.Tags.of(this).add('Env', envName);

    this.context = {
      envName,
      ...stackProps,
    };
    logger.info({
      stackName: this.stackName,
      env: this.env,
      context: this.context,
    });

    const { context } = this;

    context.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr(context.vpcCidr),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [],
    });

    const internetGateway = new ec2.CfnInternetGateway(this, 'InternetGateway');
    const attachGateway = new ec2.CfnVPCGatewayAttachment(this, 'AttachGateway', {
      vpcId: context.vpc.vpcId,
      internetGatewayId: internetGateway.ref,
    });

    const natGateway = new ec2.CfnNatGateway(this, 'RegionalNatGateway', {
      vpcId: context.vpc.vpcId,
      availabilityMode: 'regional',
      connectivityType: 'public',
    });
    natGateway.addResourceDependency(attachGateway);

    const publicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
      vpcId: context.vpc.vpcId,
      tags: [{ key: 'Name', value: `${this.stackName}-public-route-table` }],
    });
    const privateRouteTable = new ec2.CfnRouteTable(this, 'PrivateRouteTable', {
      vpcId: context.vpc.vpcId,
      tags: [{ key: 'Name', value: `${this.stackName}-private-route-table` }],
    });

    new ec2.CfnRoute(this, 'PublicRoute', {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.ref,
    }).addResourceDependency(attachGateway);
    new ec2.CfnRoute(this, 'PrivateRoute', {
      routeTableId: privateRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.ref,
    }).addResourceDependency(natGateway);

    context.vpcEndpoint.forEach(endpoint => {
      new ec2.CfnVPCEndpoint(this, `${endpoint}Endpoint`, {
        vpcId: context.vpc.vpcId,
        serviceName: `com.amazonaws.${this.region}.${endpoint}`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [
          publicRouteTable.ref,
          privateRouteTable.ref,
        ],
      });
    });

    context.publicSubnet1 = new ec2.CfnSubnet(this, 'PublicSubnet1', {
      vpcId: context.vpc.vpcId,
      cidrBlock: context.publicSubnet1Cidr,
      availabilityZone: cdk.Fn.select(0, cdk.Fn.getAzs()),
      mapPublicIpOnLaunch: true,
      tags: [{ key: 'Name', value: `${this.stackName}-public-subnet-1` }],
    });
    context.publicSubnet2 = new ec2.CfnSubnet(this, 'PublicSubnet2', {
      vpcId: context.vpc.vpcId,
      cidrBlock: context.publicSubnet2Cidr,
      availabilityZone: cdk.Fn.select(1, cdk.Fn.getAzs()),
      mapPublicIpOnLaunch: true,
      tags: [{ key: 'Name', value: `${this.stackName}-public-subnet-2` }],
    });

    context.privateSubnet1 = new ec2.CfnSubnet(this, 'PrivateSubnet1', {
      vpcId: context.vpc.vpcId,
      cidrBlock: context.privateSubnet1Cidr,
      availabilityZone: cdk.Fn.select(0, cdk.Fn.getAzs()),
      tags: [{ key: 'Name', value: `${this.stackName}-private-subnet-1` }],
    });
    context.privateSubnet2 = new ec2.CfnSubnet(this, 'PrivateSubnet2', {
      vpcId: context.vpc.vpcId,
      cidrBlock: context.privateSubnet2Cidr,
      availabilityZone: cdk.Fn.select(1, cdk.Fn.getAzs()),
      tags: [{ key: 'Name', value: `${this.stackName}-private-subnet-2` }],
    });

    // Associate public subnets with the public route table (match template)
    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnet1RouteTableAssoc', {
      subnetId: context.publicSubnet1.ref,
      routeTableId: publicRouteTable.ref,
    });
    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnet2RouteTableAssoc', {
      subnetId: context.publicSubnet2.ref,
      routeTableId: publicRouteTable.ref,
    });
    new ec2.CfnSubnetRouteTableAssociation(this, 'PrivateSubnet1RouteTableAssoc', {
      subnetId: context.privateSubnet1.ref,
      routeTableId: privateRouteTable.ref,
    });
    new ec2.CfnSubnetRouteTableAssociation(this, 'PrivateSubnet2RouteTableAssoc', {
      subnetId: context.privateSubnet2.ref,
      routeTableId: privateRouteTable.ref,
    });

    ec2Bastion(this);

    new cdk.CfnOutput(this, 'VpcId', {
      value: context.vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
