#!/bin/bash

# Usage: sudo ./create_lxc.sh <CTID> <os_type> <memory> <cores> <network_type>

# Example: sudo ./create_lxc.sh 101 ubuntu 2048 2 bridge

set -e

# Parameters
CTID=$1
OS_TYPE=$2
MEMORY=$3
CORES=$4
NETWORK_TYPE=$5

# Validate input
if [[ -z "$CTID" || -z "$OS_TYPE" || -z "$MEMORY" || -z "$CORES" || -z "$NETWORK_TYPE" ]]; then
  echo "Usage: $0 <CTID> <ubuntu|fedora> <memory_MB> <cores> <host|bridge>"
  exit 1
fi

# Set default bridge
BRIDGE_NAME="vmbr0"

# Define image templates
case "$OS_TYPE" in
  ubuntu)
    TEMPLATE="local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
    ;;
  fedora)
    TEMPLATE="local:vztmpl/fedora-38-default_20231004_amd64.tar.xz"
    ;;
  *)
    echo "Unsupported OS type: $OS_TYPE. Choose 'ubuntu' or 'fedora'."
    exit 1
    ;;
esac

# Check if template exists
if ! pveam list local | grep -q "$(basename $TEMPLATE)"; then
  echo "Template $TEMPLATE not found locally."
  echo "Please download it first using:"
  echo "  pveam update"
  echo "  pveam available | grep $OS_TYPE"
  echo "  pveam download local $(basename $TEMPLATE)"
  exit 1
fi

# Create container
echo "[+] Creating container $CTID with $OS_TYPE"

pct create $CTID $TEMPLATE \
  -memory $MEMORY \
  -cores $CORES \
  -hostname "${OS_TYPE}-${CTID}" \
  -features nesting=1 \
  -rootfs local-lvm:8 \
  -password "root123" \
  -unprivileged 1 \
  -net0 name=eth0,bridge=$BRIDGE_NAME,firewall=1

# Set up network
if [[ "$NETWORK_TYPE" == "host" ]]; then
  echo "[+] Configuring container for host networking (requires manual config)"
  pct set $CTID -net0 name=eth0,bridge=$BRIDGE_NAME,hwaddr=$(openssl rand -hex 6 | sed 's/\(..\)/\1:/g; s/:$//'),firewall=1
elif [[ "$NETWORK_TYPE" == "bridge" ]]; then
  echo "[+] Using bridged networking"
  # Already set above in create
else
  echo "Invalid network type. Use 'host' or 'bridge'."
  exit 1
fi

# Start container
pct start $CTID

echo "[+] Container $CTID created and started."

# END OF SCRIPT

# -----------------------------------------------------------------------
# Documentation
# -----------------------------------------------------------------------
# Script Name: create_lxc.sh
# Description: Automates the creation of LXC containers in Proxmox using 'pct'.
#
# Parameters:
#   $1 - CTID: Container ID (e.g., 101, 102, etc.)
#   $2 - OS Type: "ubuntu" or "fedora"
#   $3 - Memory in MB (e.g., 2048)
#   $4 - CPU Cores (e.g., 2)
#   $5 - Network Type: "bridge" or "host"
#
# Templates Used:
#   - Ubuntu: ubuntu-22.04-standard_22.04-1_amd64.tar.zst
#   - Fedora: fedora-38-default_20231004_amd64.tar.xz
#
# Notes:
#   - Ensure the OS template is available in your Proxmox storage (use `pveam`).
#   - Default network bridge is 'vmbr0'.
#   - Sets root password to 'root'. Change after deployment.
#   - Enables unprivileged container and nesting.
#   - Root disk size is set to 8GB.
#
# Example Usage:
#   sudo ./create_lxc.sh 105 ubuntu 1024 1 bridge
#   sudo ./create_lxc.sh 106 fedora 2048 2 host
# -----------------------------------------------------------------------
