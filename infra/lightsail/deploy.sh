#!/usr/bin/env bash
set -u

REGION="us-east-1"
INSTANCE_NAME="$1"

timestamp() {
  echo -n "($INSTANCE_NAME) "
  TZ=Asia/Tokyo date -Iseconds
}

describe() {
  echo "[INFO] $(timestamp) Describing Lightsail Instance..."
  aws lightsail get-instances \
  --region $REGION \
  --instance-names $INSTANCE_NAME
}

deploy() {
  echo "[INFO] $(timestamp) Create Lightsail Instance..."
  aws lightsail create-instances \
  --region $REGION \
  --instance-names $INSTANCE_NAME \
  --availability-zone ${REGION}b \
  --blueprint-id ubuntu_24_04 \
  --bundle-id nano_1_0 \
  --user-data "#!/usr/bin/env bash\ncurl -sL jsx.jp/s/user-data | bash"
  echo "[INFO] $(timestamp) Waiting for instance to be running..."
  while true; do
    STATE=$(aws lightsail get-instances \
      --region $REGION \
      --instance-names $INSTANCE_NAME \
      --query "Instances[0].State.Name" \
      --output text 2>/dev/null)
    if [[ "$STATE" == "running" ]]; then
      break
    fi
    echo "[INFO] $(timestamp) Instance state: $STATE"
    sleep 10
  done
  echo "[INFO] $(timestamp) Allocate static IP..."
  aws lightsail allocate-static-ip \
  --region $REGION \
  --static-ip-name $INSTANCE_NAME-ip
  echo "[INFO] $(timestamp) Waiting for static IP to be available..."
  while true; do
    IP_STATE=$(aws lightsail get-static-ip \
      --region $REGION \
      --static-ip-name $INSTANCE_NAME-ip \
      --query "staticIp.state" \
      --output text 2>/dev/null)
    if [[ "$IP_STATE" == "available" ]]; then
      break
    fi
    echo "[INFO] $(timestamp) Static IP state: $IP_STATE"
    sleep 10
  done
  echo "[INFO] $(timestamp) Attaching static IP to instance..."
  aws lightsail attach-static-ip \
  --region $REGION \
  --static-ip-name $INSTANCE_NAME-ip \
  --instance-name $INSTANCE_NAME
  echo "[INFO] $(timestamp) Instance deployed and static IP attached."
  fw set
  echo "[INFO] $(timestamp) Updated firewall rules:"
  fw show
  describe
}

delete() {
  echo "[INFO] $(timestamp) Deleting Lightsail Instance..."
  aws lightsail delete-instances \
  --region $REGION \
  --instance-names $INSTANCE_NAME
  echo "[INFO] $(timestamp) Instance deleted."
  echo "[INFO] $(timestamp) Releasing static IP..."
  aws lightsail release-static-ip \
  --region $REGION \
  --static-ip-name $INSTANCE_NAME-ip
  echo "[INFO] $(timestamp) Static IP released."
}

show_fw() {
  echo "=== Current Lightsail Firewall Rules ==="
  aws lightsail get-instance-port-states \
    --instance-name "$INSTANCE_NAME" \
    --query 'portStates[*].[fromPort,toPort,protocol,cidrs]' \
    --output table
}

set_fw() {
  echo "=== Resetting all firewall rules ==="
  aws lightsail close-instance-public-ports \
    --instance-name "$INSTANCE_NAME"

  echo "=== Setting public TCP ports ==="
  for port in "${PUBLIC_PORTS_TCP[@]}"; do
    aws lightsail put-instance-public-ports \
      --instance-name "$INSTANCE_NAME" \
      --port-infos fromPort=$port,toPort=$port,protocol=TCP
  done

  echo "=== Setting public UDP ports ==="
  for port in "${PUBLIC_PORTS_UDP[@]}"; do
    aws lightsail put-instance-public-ports \
      --instance-name "$INSTANCE_NAME" \
      --port-infos fromPort=$port,toPort=$port,protocol=UDP
  done

  echo "=== Setting CIDR-restricted port ($INTERNAL_PORT) ==="
  for cidr in "${INTERNAL_CIDRS[@]}"; do
    aws lightsail put-instance-public-ports \
      --instance-name "$INSTANCE_NAME" \
      --port-infos fromPort=$INTERNAL_PORT,toPort=$INTERNAL_PORT,protocol=TCP,cidrs=$cidr
  done

  echo "Firewall rules updated."
}

fw() {
  INTERNAL_CIDRS=(
    "59.132.128.0/19"
    "106.146.192.0/19"
    "111.238.250.129/32"
    "124.209.64.0/19"
    "182.249.16.0/20"
  )

  INTERNAL_PORT=3128

  PUBLIC_PORTS_TCP=(
    22
    25
    53
    80
    443
    2022
  )

  PUBLIC_PORTS_UDP=(
    53
    500
    4500
  )

  case "$1" in
    show)
      show_fw
      ;;
    set)
      set_fw
      ;;
    *)
      echo "Usage: $0 {show|set}"
      exit 1
      ;;
  esac
}

echo
echo "Usage: source $0 {Instance name}"
echo "  allow commands {deploy|describe|delete}"
echo "  allow commands {fw show|fw set}"
