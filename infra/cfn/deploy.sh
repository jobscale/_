#!/usr/bin/env bash
set -u

timestamp() {
  TZ=Asia/Tokyo date -Iseconds
}

deploy() {
  echo "[INFO] $(timestamp) Deploying CloudFormation Stack..."
  aws cloudformation deploy \
  --template-file cfn/ec2-simple.yaml \
  --stack-name ec2-simple \
  --capabilities CAPABILITY_NAMED_IAM
}

output() {
  echo "[INFO] $(timestamp) CloudFormation Stack Outputs:"
  aws cloudformation describe-stacks \
  --stack-name ec2-simple \
  --query "Stacks[0].Outputs"
}

delete() {
  echo "[INFO] $(timestamp) Deleting CloudFormation Stack..."
  aws cloudformation delete-stack \
  --stack-name ec2-simple
  while aws cloudformation describe-stacks --stack-name ec2-simple >/dev/null 2>&1; do
    echo "[INFO] $(timestamp) Waiting for stack deletion..."
    sleep 10
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

main() {
  time {
    deploy
    output
  }
}
