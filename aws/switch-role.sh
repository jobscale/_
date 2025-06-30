#!/usr/bin/env bash
set -eu

if [[ $# != 1 ]]; then
    echo "ERROR: Requires a 6-digit numeric token code as an argument"
    exit 1
fi

unset AWS_PROFILE
PROFILE=iam-user
TOKEN_CODE=$1
DURATION=$(( 1 * 60 * 60 ))
MFA_ACCOUNT_ID=$(aws --profile ${PROFILE} sts get-caller-identity --out text --query Account)
DEVICE_NAME=device
SERIAL_NUMBER=arn:aws:iam::${MFA_ACCOUNT_ID}:mfa/${DEVICE_NAME}

MFA_PROFILE_NAME=mfa
ACCOUNT_ID=$(aws --profile ${PROFILE} sts get-caller-identity --out text --query Account)
REGION=ap-northeast-1
ROLE_NAME=switch-role
ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}
READ_ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/read-only-role

PROFILE_NAME=default

SESSION_JSON=$(
  aws --profile ${PROFILE} sts assume-role \
  --role-arn $ROLE_ARN --duration-seconds $DURATION \
  --role-session-name ${ROLE_NAME}-${DEVICE_NAME}-session \
  --serial-number $SERIAL_NUMBER --token-code $TOKEN_CODE \
  --output json
)

MFA_ACCESS_KEY=$(echo $SESSION_JSON | jq -r '.Credentials.AccessKeyId')
MFA_SECRET_ACCESS_KEY=$(echo $SESSION_JSON | jq -r '.Credentials.SecretAccessKey')
MFA_SESSION_TOKEN=$(echo $SESSION_JSON | jq -r '.Credentials.SessionToken')
MFA_EXPIRATION=$(echo $SESSION_JSON | jq -r '.Credentials.Expiration')

aws --profile $MFA_PROFILE_NAME configure set aws_access_key_id $MFA_ACCESS_KEY
aws --profile $MFA_PROFILE_NAME configure set aws_secret_access_key $MFA_SECRET_ACCESS_KEY
aws --profile $MFA_PROFILE_NAME configure set aws_session_token $MFA_SESSION_TOKEN
echo
echo "export AWS_ACCESS_KEY_ID=$MFA_ACCESS_KEY"
echo "export AWS_SECRET_ACCESS_KEY=$MFA_SECRET_ACCESS_KEY"
echo "export AWS_SESSION_TOKEN=$MFA_SESSION_TOKEN"
echo "export AWS_DEFAULT_REGION=$REGION"
echo "export AWS_DEFAULT_OUTPUT=yaml"
echo
echo "profile: $MFA_PROFILE_NAME ... to $PROFILE_NAME"
echo "expiration: $(TZ=Asia/Tokyo date -d $MFA_EXPIRATION -Iseconds)"

aws --profile $PROFILE_NAME configure set output yaml
aws --profile $PROFILE_NAME configure set region $REGION
aws --profile $PROFILE_NAME configure set role_arn $READ_ROLE_ARN
aws --profile $PROFILE_NAME configure set source_profile $MFA_PROFILE_NAME

set +e
# echo "=== Check profile"
# aws --profile $PROFILE_NAME s3 ls | head -1
echo "=== Account session"
aws --profile $MFA_PROFILE_NAME sts get-caller-identity
echo "=== Account assume-role"
aws --profile $PROFILE_NAME sts get-caller-identity
