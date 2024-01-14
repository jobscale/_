#!/usr/bin/env bash
set -eu

if [[ $# != 1 ]]; then
    echo "ERROR: Requires a 6-digit numeric token code as an argument"
    exit 1
fi

TOKEN_CODE=$1
DURARION=129600
MFA_ACCOUNT_ID=$(aws --profile sw sts get-caller-identity --out text --query Account)
USER_NAME=mfa
SERIAL_NUMBER=arn:aws:iam::${MFA_ACCOUNT_ID}:mfa/${USER_NAME}
MFA_PROFILE_NAME=mfa

ACCOUNT_ID=$(aws --profile sw sts get-caller-identity --out text --query Account)
REGION=ap-northeast-1
ROLE_NAME=role
ROLE_ARN=arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}
PROFILE_NAME=default

SESSION_JSON=$(
  aws --profile sw sts get-session-token --duration $DURARION \
  --serial-number $SERIAL_NUMBER --token-code $TOKEN_CODE \
  --output json
)

[[ $? == 0 ]] || (echo "ERROR: aws sts" && exit 0)

MFA_ACCESS_KEY=$(echo $SESSION_JSON | jq -r '.Credentials.AccessKeyId')
MFA_SECRET_ACCESS_KEY=$(echo $SESSION_JSON | jq -r '.Credentials.SecretAccessKey')
MFA_SESSION_TOKEN=$(echo $SESSION_JSON | jq -r '.Credentials.SessionToken')
MFA_EXPIRATION=$(echo $SESSION_JSON | jq -r '.Credentials.Expiration')

aws --profile $MFA_PROFILE_NAME configure set aws_access_key_id $MFA_ACCESS_KEY
aws --profile $MFA_PROFILE_NAME configure set aws_secret_access_key $MFA_SECRET_ACCESS_KEY
aws --profile $MFA_PROFILE_NAME configure set aws_session_token $MFA_SESSION_TOKEN

TZ=Asia/Tokyo date -Iseconds
echo "(profile: $MFA_PROFILE_NAME, expiration: $(TZ=Asia/Tokyo date -d $MFA_EXPIRATION -Iseconds))"

aws --profile $PROFILE_NAME configure set output yaml
aws --profile $PROFILE_NAME configure set region $REGION
aws --profile $PROFILE_NAME configure set role_arn $ROLE_ARN
aws --profile $PROFILE_NAME configure set source_profile $MFA_PROFILE_NAME

echo "=== Check profile"
aws --profile $PROFILE_NAME s3 ls
echo "=== Account"
aws --profile $PROFILE_NAME sts get-caller-identity --out text --query Account
