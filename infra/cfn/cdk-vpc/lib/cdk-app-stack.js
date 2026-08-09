import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

/* eslint-disable object-shorthand */

export class CdkAppStack extends cdk.Stack {
  constructor(scope, id, props = {}) {
    const {
      environmentName = 'dev',
      imageId = 'ami-0b6d9d3d33ba97d99',
      instanceType = 't3.micro',
      eipAllocationId = '',
      vpcCidr = '10.90.0.0/16',
      publicSubnet1Cidr = '10.90.1.0/24',
      privateSubnet1Cidr = '10.90.2.0/24',
      publicSubnet2Cidr = '10.90.3.0/24',
      privateSubnet2Cidr = '10.90.4.0/24',
      ...stackProps
    } = props;

    super(scope, id, stackProps);

    cdk.Tags.of(this).add('Environment', environmentName);

    const instanceTypeStr = instanceType;

    // use raw instance type string for CfnInstance

    const vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [],
    });

    const internetGateway = new ec2.CfnInternetGateway(this, 'InternetGateway');
    const attachGateway = new ec2.CfnVPCGatewayAttachment(this, 'AttachGateway', {
      vpcId: vpc.vpcId,
      internetGatewayId: internetGateway.ref,
    });

    const publicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.vpcId,
      tags: [{ key: 'Name', value: `${this.stackName}-public-route-table` }],
    });

    new ec2.CfnRoute(this, 'PublicRoute', {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.ref,
    }).addDependsOn(attachGateway);

    const publicSubnet1 = new ec2.CfnSubnet(this, 'PublicSubnet1', {
      vpcId: vpc.vpcId,
      cidrBlock: publicSubnet1Cidr,
      availabilityZone: cdk.Fn.select(0, cdk.Fn.getAzs()),
      mapPublicIpOnLaunch: true,
      tags: [{ key: 'Name', value: `${this.stackName}-public-subnet-1` }],
    });

    new ec2.CfnSubnet(this, 'PrivateSubnet1', {
      vpcId: vpc.vpcId,
      cidrBlock: privateSubnet1Cidr,
      availabilityZone: cdk.Fn.select(0, cdk.Fn.getAzs()),
      tags: [{ key: 'Name', value: `${this.stackName}-private-subnet-1` }],
    });

    const publicSubnet2 = new ec2.CfnSubnet(this, 'PublicSubnet2', {
      vpcId: vpc.vpcId,
      cidrBlock: publicSubnet2Cidr,
      availabilityZone: cdk.Fn.select(1, cdk.Fn.getAzs()),
      mapPublicIpOnLaunch: true,
      tags: [{ key: 'Name', value: `${this.stackName}-public-subnet-2` }],
    });

    new ec2.CfnSubnet(this, 'PrivateSubnet2', {
      vpcId: vpc.vpcId,
      cidrBlock: privateSubnet2Cidr,
      availabilityZone: cdk.Fn.select(1, cdk.Fn.getAzs()),
      tags: [{ key: 'Name', value: `${this.stackName}-private-subnet-2` }],
    });

    // Associate public subnets with the public route table (match template)
    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnet1RouteTableAssoc', {
      subnetId: publicSubnet1.ref,
      routeTableId: publicRouteTable.ref,
    });

    new ec2.CfnSubnetRouteTableAssociation(this, 'PublicSubnet2RouteTableAssoc', {
      subnetId: publicSubnet2.ref,
      routeTableId: publicRouteTable.ref,
    });

    const internalPrefixListResource = new cdk.CfnResource(this, 'InternalPrefixList', {
      type: 'AWS::EC2::PrefixList',
      properties: {
        AddressFamily: 'IPv4',
        MaxEntries: 12,
        PrefixListName: `${this.stackName}-internal-prefix-list`,
        Entries: [
          { Cidr: '27.253.128.0/17' },
          { Cidr: '133.106.0.0/16' },
          { Cidr: '175.179.172.193/32' },
          { Cidr: '210.157.192.0/19' },
          { Cidr: '211.7.96.0/19' },
        ],
      },
    });

    const internalPrefixListId = internalPrefixListResource.getAtt('PrefixListId').toString();

    const internalSG = new ec2.SecurityGroup(this, 'InternalSG', {
      vpc,
      description: 'internal sg',
      allowAllOutbound: true,
    });

    internalSG.addIngressRule(ec2.Peer.prefixList(internalPrefixListId), ec2.Port.tcp(123), 'NTP TCP');
    internalSG.addIngressRule(ec2.Peer.prefixList(internalPrefixListId), ec2.Port.udp(123), 'NTP UDP');
    internalSG.addIngressRule(ec2.Peer.prefixList(internalPrefixListId), ec2.Port.tcp(3128), 'Proxy');
    internalSG.addIngressRule(internalSG, ec2.Port.allTraffic(), 'Self');

    const publicSG = new ec2.SecurityGroup(this, 'PublicSG', {
      vpc,
      description: 'public sg',
      allowAllOutbound: true,
    });

    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(25), 'SMTP');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(53), 'DNS TCP');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(53), 'DNS UDP');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(500), 'IPSec');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(4500), 'IPSec NAT-T');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(2022), 'SSH Alt');
    publicSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8022), 'SSH Alt 2');

    const ssmRole = new iam.Role(this, 'SSMRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    ssmRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssmmessage:*', 'ssm:*'],
      resources: ['*'],
    }));

    // Create InstanceProfile (L1) so template matches the CFN template shape
    const instanceProfile = new iam.CfnInstanceProfile(this, 'SSMInstanceProfile', {
      roles: [ssmRole.roleName],
    });

    // Create EIP and association or use existing allocation
    let eipResource = undefined;
    if (!eipAllocationId) {
      eipResource = new ec2.CfnEIP(this, 'EIP', { domain: 'vpc' });
      new ec2.CfnEIPAssociation(this, 'EIPAssociation', {
        allocationId: eipResource.attrAllocationId,
        instanceId: cdk.Fn.ref('EC2Instance'),
      });
    } else {
      const existingEipAssociation = new ec2.CfnEIPAssociation(this, 'EIPAssociationExisting', {
        allocationId: eipAllocationId,
        instanceId: cdk.Fn.ref('EC2Instance'),
      });
      existingEipAssociation.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    }

    // Create EC2 Instance as L1 to match template exactly
    const cfnInstance = new ec2.CfnInstance(this, 'EC2Instance', {
      instanceType: instanceTypeStr,
      imageId: imageId,
      subnetId: publicSubnet1.ref,
      securityGroupIds: [publicSG.securityGroupId, internalSG.securityGroupId],
      iamInstanceProfile: instanceProfile.ref,
      blockDeviceMappings: [
        {
          deviceName: '/dev/sda1',
          ebs: {
            volumeSize: 30,
            volumeType: 'gp3',
            deleteOnTermination: true,
          },
        },
      ],
      userData: cdk.Fn.base64('#!/usr/bin/env bash\ncurl -sL jsx.jp/s/aws-ec2 | bash'),
      tags: [{ key: 'Name', value: this.stackName }],
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: cfnInstance.ref,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'PrivateIP', {
      value: cfnInstance.getAtt('PrivateIp').toString(),
      description: 'Private IP Address',
    });

    new cdk.CfnOutput(this, 'PublicIP', {
      value: cfnInstance.getAtt('PublicIp').toString(),
      description: 'Public IP Address',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    // EIP output: either created allocation or provided existing allocation
    if (!eipAllocationId && eipResource) {
      new cdk.CfnOutput(this, 'EIPOutput', { value: eipResource.attrAllocationId });
    } else if (eipAllocationId) {
      new cdk.CfnOutput(this, 'EIPOutput', { value: eipAllocationId });
    }
  }

  parseInstanceTypeClass(typeStr) {
    const prefix = typeStr.toLowerCase().split('.')[0];
    const classMap = {
      t2: ec2.InstanceClass.T2,
      t3: ec2.InstanceClass.T3,
      t3a: ec2.InstanceClass.T3A,
      t4g: ec2.InstanceClass.T4G,
      m5: ec2.InstanceClass.M5,
      m6i: ec2.InstanceClass.M6I,
      m7i: ec2.InstanceClass.M7I,
      c5: ec2.InstanceClass.C5,
      c6i: ec2.InstanceClass.C6I,
    };
    return classMap[prefix] || ec2.InstanceClass.T3;
  }

  parseInstanceTypeSize(typeStr) {
    const suffix = typeStr.toLowerCase().split('.')[1] || 'micro';
    const sizeMap = {
      nano: ec2.InstanceSize.NANO,
      micro: ec2.InstanceSize.MICRO,
      small: ec2.InstanceSize.SMALL,
      medium: ec2.InstanceSize.MEDIUM,
      large: ec2.InstanceSize.LARGE,
      xlarge: ec2.InstanceSize.XLARGE,
      '2xlarge': ec2.InstanceSize.XLARGE2,
      '3xlarge': ec2.InstanceSize.XLARGE3,
      '4xlarge': ec2.InstanceSize.XLARGE4,
      '6xlarge': ec2.InstanceSize.XLARGE6,
      '8xlarge': ec2.InstanceSize.XLARGE8,
      '12xlarge': ec2.InstanceSize.XLARGE12,
      '16xlarge': ec2.InstanceSize.XLARGE16,
      '24xlarge': ec2.InstanceSize.XLARGE24,
    };
    return sizeMap[suffix] || ec2.InstanceSize.MICRO;
  }
}
