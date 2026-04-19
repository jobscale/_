#!/usr/bin/env bash
set -u

STACK_NAME=${1:-simple}
TEMPLATE_FILE="template.yaml"
PARAM_FILE="${STACK_NAME}.param.json"

echo "[Note] Deploying CloudFormation Stack Name: $STACK_NAME"
echo
IS_OK=true
if [[ -f  "$TEMPLATE_FILE" ]]; then
  echo -e "\e[32m[INFO] Template file $TEMPLATE_FILE found. OK\e[0m"
else
  echo -e "\e[31m[ERROR] Template file $TEMPLATE_FILE not found. NG\e[0m" >&2
  IS_OK=false
fi

if [[ -f  "$PARAM_FILE" ]]; then
  echo -e "\e[32m[INFO] Parameter file $PARAM_FILE found. OK\e[0m"
else
  echo -e "\e[31m[ERROR] Parameter file $PARAM_FILE not found. NG\e[0m" >&2
  IS_OK=false
fi
echo
if [[ "$IS_OK" == true ]]; then
  echo -e "[INFO] All required files are present. Proceeding with deployment."
  echo -e "[INFO]   \e[33mcheck-device\e[0m : To check a AMI."
  echo -e "[INFO]   \e[33mdeploy\e[0m      : To deploy the stack."
  echo -e "[INFO]   \e[33mdescribe\e[0m    : To describe the stack outputs."
  echo -e "[INFO]   \e[33mdelete\e[0m      : To delete the stack."
  echo -e "[INFO]   \e[33mssm-install\e[0m : To install SSM Session Manager Plugin."
  echo -e "[INFO]   \e[33mssm-start\e[0m   : To start an SSM session to the EC2 instance."
  echo -e "[INFO] Example: deploy"
  echo -e "[INFO] Ready to deploy the stack. Please run the deploy function to start the deployment process."
else
  echo -e "\e[33m[ERROR] Required files are missing. Please check the above messages.\e[0m" >&2
  echo -e "\e[33m[ERROR] Please ensure that the template file and parameter file exist before proceeding.\e[0m" >&2
  echo -e "\e[33m[ERROR] Deployment cannot proceed until the required files are in place.\e[0m" >&2
  echo -e "\e[33m[ERROR] Failed to deploy stack $STACK_NAME.\e[0m" >&2
fi
printf '\e]8;;https://github.com/jobscale/_/blob/main/infra/cfn/ec2-vpc/README.md\e\\For more details see the Documents\e]8;;\e\\\n'

timestamp() {
  echo -n "($STACK_NAME) "
  TZ=Asia/Tokyo date -Iseconds
}

check-device() {
  aws ec2 describe-images \
  --image-ids ami-0b6c6ebed2801a5cb \
  --query "Images[0].RootDeviceName" \
  --output text
}

describe() {
  echo "[INFO] $(timestamp) CloudFormation Stack Outputs:"
  aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "{
    StackName:Stacks[0].StackName,
    Status:Stacks[0].StackStatus,
    Outputs:Stacks[0].Outputs
  }"
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
  while aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "{
    StackName:Stacks[0].StackName,
    Status:Stacks[0].StackStatus
  }" 2>/dev/null; do
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
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='EC2InstanceId'].OutputValue" \
  --output text)
  if [ -z "$instance_id" ]; then
    echo "[ERROR] $(timestamp) EC2InstanceId not found in stack outputs" >&2
    return 1
  fi
  echo "[INFO] $(timestamp) Starting SSM session to instance $instance_id"
  aws ssm start-session --target "$instance_id"
}

echo
echo -e "Usage: . deploy.sh {Stack name}"
echo -e "  Stack name list: [ \e[33m$(ls *.json | awk -F'[/.]' '{print $1}' | xargs)\e[0m ]"
echo -e "  allow commands {deploy|describe|delete|ssm-install|ssm-start}"
