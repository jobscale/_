#!/usr/bin/env bash
set -u

STACK_NAME=${1:-simple}
TEMPLATE_FILE="cfn/ec2-vpc-subnet.yaml"
PARAM_FILE="cfn/${STACK_NAME}.param.json"

echo "[Note] Deploying CloudFormation Stack Name: $STACK_NAME"
echo "[Note] Template File: $TEMPLATE_FILE"
echo "[Note] Parameter File: $PARAM_FILE"

IS_OK=true
if [[ -f  "$TEMPLATE_FILE" ]]; then
  echo "[INFO] Template file $TEMPLATE_FILE found. OK"
else
  echo "[ERROR] Template file $TEMPLATE_FILE not found. NG" >&2
  IS_OK=false
fi

if [[ -f  "$PARAM_FILE" ]]; then
  echo "[INFO] Parameter file $PARAM_FILE found. OK"
else
  echo "[ERROR] Parameter file $PARAM_FILE not found. NG" >&2
  IS_OK=false
fi

if [[ "$IS_OK" == true ]]; then
  echo "[INFO] All required files are present. Proceeding with deployment."
  echo "[INFO] To deploy the stack, run: deploy"
  echo "[INFO] To describe the stack outputs, run: describe"
  echo "[INFO] To delete the stack, run: delete"
  echo "[INFO] To install SSM Session Manager Plugin, run: ssm-install"
  echo "[INFO] To start an SSM session to the EC2 instance, run: ssm-start"
  echo "[INFO] Example: deploy"
  echo "[INFO] Ready to deploy the stack. Please run the deploy function to start the deployment process."
else
  echo "[ERROR] Required files are missing. Please check the above messages." >&2
  echo "[ERROR] Please ensure that the template file and parameter file exist before proceeding." >&2
  echo "[ERROR] Deployment cannot proceed until the required files are in place." >&2
  echo "[ERROR] Failed to deploy stack $STACK_NAME." >&2
fi

timestamp() {
  echo -n "($STACK_NAME) "
  TZ=Asia/Tokyo date -Iseconds
}

describe() {
  echo "[INFO] $(timestamp) CloudFormation Stack Outputs:"
  aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs"
}

deploy() {
  echo "[INFO] $(timestamp) Deploying CloudFormation Stack..."
  aws cloudformation deploy \
  --template-file $TEMPLATE_FILE \
  --stack-name $STACK_NAME \
  --parameter-overrides file://$PARAM_FILE \
  --capabilities CAPABILITY_IAM
  describe
}

delete() {
  echo "[INFO] $(timestamp) Deleting CloudFormation Stack..."
  aws cloudformation delete-stack \
  --stack-name $STACK_NAME
  while aws cloudformation describe-stacks --stack-name $STACK_NAME >/dev/null 2>&1; do
    echo "[INFO] $(timestamp) Waiting for stack deletion..."
    sleep 15
  done
  echo "[INFO] $(timestamp) Stack deleted."
}

ssm-install() {
  curl -LO "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb"
  sudo dpkg -i session-manager-plugin.deb
  rm session-manager-plugin.deb
}

ssm-start() {
  echo "[INFO] $(timestamp) Starting SSM Session..."
  local instance_id=$(aws cloudformation describe-stacks \
  --stack-name ec2-simple \
  --query "Stacks[0].Outputs[?OutputKey=='EC2InstanceId'].OutputValue" \
  --output text)
  if [ -z "$instance_id" ]; then
    echo "[ERROR] $(timestamp) EC2InstanceId not found in stack outputs" >&2
    return 1
  fi
  echo "[INFO] $(timestamp) Starting SSM session to instance $instance_id"
  aws ssm start-session --target "$instance_id"
}

echo "Usage: source $0 {Stack name}"
echo "allow commands {deploy|describe|delete|ssm-install|ssm-start}"
