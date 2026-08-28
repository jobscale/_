import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export const ec2Bastion = stack => {
  const { context } = stack;

  const internalPrefixListResource = new cdk.CfnResource(stack, 'InternalPrefixList', {
    type: 'AWS::EC2::PrefixList',
    properties: {
      AddressFamily: 'IPv4',
      MaxEntries: 12,
      PrefixListName: `${stack.stackName}-internal-prefix-list`,
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

  const internalSG = new ec2.SecurityGroup(stack, 'InternalSG', {
    vpc: context.vpc,
    description: 'internal sg',
    allowAllOutbound: true,
  });

  internalSG.addIngressRule(ec2.Peer.prefixList(internalPrefixListId), ec2.Port.tcp(123), 'NTP TCP');
  internalSG.addIngressRule(ec2.Peer.prefixList(internalPrefixListId), ec2.Port.udp(123), 'NTP UDP');
  internalSG.addIngressRule(ec2.Peer.prefixList(internalPrefixListId), ec2.Port.tcp(3128), 'Proxy');
  internalSG.addIngressRule(internalSG, ec2.Port.allTraffic(), 'Self');

  const publicSG = new ec2.SecurityGroup(stack, 'PublicSG', {
    vpc: context.vpc,
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

  const ssmRole = new iam.Role(stack, 'SSMRole', {
    assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
    ],
  });

  // Create InstanceProfile (L1) so template matches the CFN template shape
  const instanceProfile = new iam.CfnInstanceProfile(stack, 'SSMInstanceProfile', {
    roles: [ssmRole.roleName],
  });

  // Create EC2 Instance as L1 to match template exactly
  const { imageId } = ec2.MachineImage.fromSsmParameter(
    '/aws/service/canonical/ubuntu/server/26.04/stable/current/amd64/hvm/ebs-gp3/ami-id',
  ).getImage(stack);
  const cfnInstance = new ec2.CfnInstance(stack, 'EC2Instance', {
    instanceType: context.instanceType,
    imageId,
    subnetId: context.publicSubnet1.ref,
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
    tags: [{ key: 'Name', value: stack.stackName }],
  });

  // Create EIP and association or use existing allocation
  let eipResource = undefined;
  if (!context.eipAllocationId) {
    eipResource = new ec2.CfnEIP(stack, 'EIP', { domain: 'vpc' });
    new ec2.CfnEIPAssociation(stack, 'EIPAssociation', {
      allocationId: eipResource.attrAllocationId,
      instanceId: cfnInstance.ref,
    });
  } else {
    const existingEipAssociation = new ec2.CfnEIPAssociation(stack, 'EIPAssociationExisting', {
      allocationId: context.eipAllocationId,
      instanceId: cfnInstance.ref,
    });
    existingEipAssociation.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
  }

  new cdk.CfnOutput(stack, 'EC2InstanceId', {
    value: cfnInstance.ref,
    description: 'EC2 Instance ID',
  });

  new cdk.CfnOutput(stack, 'PrivateIP', {
    value: cfnInstance.getAtt('PrivateIp').toString(),
    description: 'Private IP Address',
  });

  new cdk.CfnOutput(stack, 'PublicIP', {
    value: cfnInstance.getAtt('PublicIp').toString(),
    description: 'Public IP Address',
  });

  // EIP output: either created allocation or provided existing allocation
  if (!context.eipAllocationId && eipResource) {
    new cdk.CfnOutput(stack, 'EIPOutput', { value: eipResource.attrAllocationId });
  } else if (context.eipAllocationId) {
    new cdk.CfnOutput(stack, 'EIPOutput', { value: context.eipAllocationId });
  }
};
