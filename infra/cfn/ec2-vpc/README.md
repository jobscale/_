## Deploy VPC EIP EC2

## via AWS CloudFormation

### Examples

<pre>
<code>
$ . deploy.sh simple3
[Note] Deploying CloudFormation Stack Name: simple3

<code style="color: #3c3">[INFO] Template file template.yaml found. OK</code>
<code style="color: #3c3">[INFO] Parameter file simple3.param.json found. OK</code>

[INFO] All required files are present. Proceeding with deployment.
[INFO]   <code style="color: #dd3">check-device</code> : To check a AMI.
[INFO]   <code style="color: #dd3">deploy</code>      : To deploy the stack.
[INFO]   <code style="color: #dd3">describe</code>    : To describe the stack outputs.
[INFO]   <code style="color: #dd3">delete</code>      : To delete the stack.
[INFO]   <code style="color: #dd3">ssm-install</code> : To install SSM Session Manager Plugin.
[INFO]   <code style="color: #dd3">ssm-start</code>   : To start an SSM session to the EC2 instance.
[INFO] Example: deploy
[INFO] Ready to deploy the stack. Please run the deploy function to start the deployment process.

Usage: source /bin/bash {Stack name}
  Stack name list: [ <code style="color: #dd3">simple simple2 simple3 tanpo-2504</code> ]
  allow commands {deploy|describe|delete|ssm-install|ssm-start}

$ describe
[INFO] (simple3) 2026-04-12T15:44:55+09:00 CloudFormation Stack Outputs:
Outputs:
- OutputKey: PrivateIP
  OutputValue: 10.30.1.67
- OutputKey: PublicIP
  OutputValue: 34.199.47.60
- OutputKey: EC2InstanceId
  OutputValue: i-0ffe61a2d4bad2a77
- OutputKey: EIP
  OutputValue: 34.199.47.60
StackName: simple3
Status: CREATE_COMPLETE
</code>
</pre>
