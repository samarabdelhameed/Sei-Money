#!/bin/bash

# SeiMoney Contract Interaction Script
# This script provides easy interaction with the deployed contract

set -e

# Load deployment info
if [ ! -f "deployment_info.json" ]; then
    echo "❌ Deployment info not found. Please deploy the contract first."
    exit 1
fi

CONTRACT_ADDRESS=$(jq -r '.contract_address' deployment_info.json)
CHAIN_ID=$(jq -r '.chain_id' deployment_info.json)
NODE="https://rpc.atlantic-2.seinetwork.io:443"
KEYRING_BACKEND="test"
KEY_NAME="deployer"

DOCKER_CMD="docker run --rm -v $(pwd):/workspace -w /workspace seiprotocol/seid:latest"

echo "🔗 Interacting with contract: $CONTRACT_ADDRESS"
echo ""

# Function to query contract
query_contract() {
    local query_msg="$1"
    echo "🔍 Querying: $query_msg"
    $DOCKER_CMD query wasm contract-state smart $CONTRACT_ADDRESS "$query_msg" \
        --chain-id $CHAIN_ID \
        --node $NODE \
        --output json | jq '.'
}

# Function to execute contract
execute_contract() {
    local exec_msg="$1"
    local funds="$2"
    echo "⚡ Executing: $exec_msg"
    
    if [ -n "$funds" ]; then
        $DOCKER_CMD tx wasm execute $CONTRACT_ADDRESS "$exec_msg" \
            --from $KEY_NAME \
            --keyring-backend $KEYRING_BACKEND \
            --chain-id $CHAIN_ID \
            --node $NODE \
            --amount $funds \
            --gas auto \
            --gas-adjustment 1.3 \
            --fees 20000usei \
            --broadcast-mode block \
            --output json \
            -y | jq '.'
    else
        $DOCKER_CMD tx wasm execute $CONTRACT_ADDRESS "$exec_msg" \
            --from $KEY_NAME \
            --keyring-backend $KEYRING_BACKEND \
            --chain-id $CHAIN_ID \
            --node $NODE \
            --gas auto \
            --gas-adjustment 1.3 \
            --fees 20000usei \
            --broadcast-mode block \
            --output json \
            -y | jq '.'
    fi
}

# Menu system
while true; do
    echo ""
    echo "🎯 SeiMoney Contract Interaction Menu:"
    echo "1. Query Config"
    echo "2. Query Transfer by ID"
    echo "3. Query Transfers by Sender"
    echo "4. Query Transfers by Recipient"
    echo "5. Create Transfer"
    echo "6. Claim Transfer"
    echo "7. Refund Transfer"
    echo "8. Update Config (Admin only)"
    echo "9. Exit"
    echo ""
    read -p "Select an option (1-9): " choice

    case $choice in
        1)
            query_contract '{"get_config":{}}'
            ;;
        2)
            read -p "Enter transfer ID: " transfer_id
            query_contract '{"get_transfer":{"id":"'$transfer_id'"}}'
            ;;
        3)
            read -p "Enter sender address: " sender
            query_contract '{"get_transfers_by_sender":{"sender":"'$sender'","start_after":null,"limit":10}}'
            ;;
        4)
            read -p "Enter recipient address: " recipient
            query_contract '{"get_transfers_by_recipient":{"recipient":"'$recipient'","start_after":null,"limit":10}}'
            ;;
        5)
            read -p "Enter recipient address: " recipient
            read -p "Enter amount (in usei): " amount
            read -p "Enter expiry hours from now: " hours
            expiry=$(($(date +%s) + $hours * 3600))
            read -p "Enter memo (optional): " memo
            
            exec_msg='{"create_transfer":{"recipient":"'$recipient'","expiry_time":'$expiry',"memo":"'$memo'"}}'
            execute_contract "$exec_msg" "${amount}usei"
            ;;
        6)
            read -p "Enter transfer ID to claim: " transfer_id
            exec_msg='{"claim_transfer":{"id":"'$transfer_id'"}}'
            execute_contract "$exec_msg"
            ;;
        7)
            read -p "Enter transfer ID to refund: " transfer_id
            exec_msg='{"refund_transfer":{"id":"'$transfer_id'"}}'
            execute_contract "$exec_msg"
            ;;
        8)
            echo "Update Config options:"
            echo "a. Update fee percentage"
            echo "b. Update transfer limits"
            echo "c. Add supported denom"
            read -p "Select (a/b/c): " config_choice
            
            case $config_choice in
                a)
                    read -p "Enter new fee percentage (basis points, e.g., 250 for 2.5%): " fee
                    exec_msg='{"update_config":{"fee_percentage":'$fee'}}'
                    execute_contract "$exec_msg"
                    ;;
                b)
                    read -p "Enter min transfer amount: " min_amount
                    read -p "Enter max transfer amount: " max_amount
                    exec_msg='{"update_config":{"min_transfer_amount":"'$min_amount'","max_transfer_amount":"'$max_amount'"}}'
                    execute_contract "$exec_msg"
                    ;;
                c)
                    read -p "Enter denom to add: " denom
                    exec_msg='{"update_config":{"supported_denoms":["'$denom'"]}}'
                    execute_contract "$exec_msg"
                    ;;
            esac
            ;;
        9)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac
done