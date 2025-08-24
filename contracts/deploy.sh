#!/bin/bash

# 🐒💰 SeiMoney DeFi Contracts Deployment Script
# Deploy all contracts to Sei Network testnet (atlantic-2)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHAIN_ID="atlantic-2"
NODE="https://rpc.atlantic-2.seinetwork.io:443"
DENOM="usei"
FROM="deployer"

# Contract names and files
declare -A CONTRACTS=(
    ["payments"]="seimoney_payments.wasm"
    ["groups"]="seimoney_groups.wasm"
    ["pots"]="seimoney_pots.wasm"
    ["alias"]="seimoney_alias.wasm"
    ["risk_escrow"]="seimoney_risk_escrow.wasm"
    ["vaults"]="seimoney_vaults.wasm"
)

# Contract instantiation parameters
declare -A INSTANTIATE_PARAMS=(
    ["payments"]='{"default_denom":"usei","admin":"ADMIN_ADDRESS"}'
    ["groups"]='{"default_denom":"usei","admin":"ADMIN_ADDRESS"}'
    ["pots"]='{"default_denom":"usei","admin":"ADMIN_ADDRESS"}'
    ["alias"]='{"min_username_length":3,"max_username_length":20,"admin":"ADMIN_ADDRESS"}'
    ["risk_escrow"]='{"default_denom":"usei","min_approval_threshold":2,"admin":"ADMIN_ADDRESS"}'
    ["vaults"]='{"default_denom":"usei","max_fee_bps":1000,"admin":"ADMIN_ADDRESS"}'
)

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if seid is available
    if ! command -v seid &> /dev/null; then
        print_error "seid CLI not found. Please install seid first."
        print_status "You can build it from source:"
        print_status "git clone https://github.com/sei-protocol/sei-chain.git"
        print_status "cd sei-chain && go build -o seid ./cmd/seid"
        exit 1
    fi
    
    # Check if WASM files exist
    for contract in "${!CONTRACTS[@]}"; do
        wasm_file="target/wasm32-unknown-unknown/release/${CONTRACTS[$contract]}"
        if [[ ! -f "$wasm_file" ]]; then
            print_error "WASM file not found: $wasm_file"
            print_status "Please build contracts first:"
            print_status "RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown"
            exit 1
        fi
    done
    
    print_success "All prerequisites met!"
}

# Function to configure seid
configure_seid() {
    print_status "Configuring seid CLI..."
    
    seid config chain-id "$CHAIN_ID"
    seid config node "$NODE"
    
    print_success "seid configured for $CHAIN_ID"
}

# Function to get deployer address
get_deployer_address() {
    print_status "Getting deployer address..."
    
    ADMIN_ADDRESS=$(seid keys show "$FROM" -a)
    if [[ -z "$ADMIN_ADDRESS" ]]; then
        print_error "Could not get deployer address. Make sure key '$FROM' exists."
        exit 1
    fi
    
    print_success "Deployer address: $ADMIN_ADDRESS"
    
    # Update instantiate parameters with actual admin address
    for contract in "${!INSTANTIATE_PARAMS[@]}"; do
        INSTANTIATE_PARAMS[$contract]=${INSTANTIATE_PARAMS[$contract]/ADMIN_ADDRESS/$ADMIN_ADDRESS}
    done
}

# Function to store WASM files
store_wasm_files() {
    print_status "Storing WASM files on chain..."
    
    declare -A CODE_IDS
    
    for contract in "${!CONTRACTS[@]}"; do
        wasm_file="target/wasm32-unknown-unknown/release/${CONTRACTS[$contract]}"
        
        print_status "Storing $contract contract..."
        
        # Store WASM file
        result=$(seid tx wasm store "$wasm_file" \
            --from "$FROM" \
            --chain-id "$CHAIN_ID" \
            --node "$NODE" \
            --gas 2000000 \
            --fees "100000$DENOM" \
            --output json \
            -y)
        
        # Extract code ID
        code_id=$(echo "$result" | jq -r '.logs[0].events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value')
        
        if [[ -z "$code_id" || "$code_id" == "null" ]]; then
            print_error "Failed to get code ID for $contract contract"
            print_error "Result: $result"
            exit 1
        fi
        
        CODE_IDS[$contract]=$code_id
        print_success "$contract contract stored with Code ID: $code_id"
    done
    
    # Save code IDs to file
    echo "#!/bin/bash" > deployed_code_ids.sh
    echo "# Generated Code IDs from deployment" >> deployed_code_ids.sh
    echo "" >> deployed_code_ids.sh
    for contract in "${!CODE_IDS[@]}"; do
        echo "export ${contract^^}_CODE_ID=${CODE_IDS[$contract]}" >> deployed_code_ids.sh
    done
    echo "" >> deployed_code_ids.sh
    echo "echo 'Code IDs loaded:'" >> deployed_code_ids.sh
    for contract in "${!CODE_IDS[@]}"; do
        echo "echo \"$contract: \$${contract^^}_CODE_ID\"" >> deployed_code_ids.sh
    done
    
    chmod +x deployed_code_ids.sh
    print_success "Code IDs saved to deployed_code_ids.sh"
}

# Function to instantiate contracts
instantiate_contracts() {
    print_status "Instantiating contracts..."
    
    # Source code IDs
    if [[ -f "deployed_code_ids.sh" ]]; then
        source deployed_code_ids.sh
    else
        print_error "Code IDs file not found. Please run store_wasm_files first."
        exit 1
    fi
    
    declare -A CONTRACT_ADDRESSES
    
    for contract in "${!CONTRACTS[@]}"; do
        code_id_var="${contract^^}_CODE_ID"
        code_id="${!code_id_var}"
        
        if [[ -z "$code_id" ]]; then
            print_error "Code ID not found for $contract contract"
            exit 1
        fi
        
        print_status "Instantiating $contract contract with Code ID: $code_id"
        
        # Instantiate contract
        result=$(seid tx wasm instantiate "$code_id" \
            "${INSTANTIATE_PARAMS[$contract]}" \
            --label "seimoney-$contract" \
            --admin "$ADMIN_ADDRESS" \
            --from "$FROM" \
            --chain-id "$CHAIN_ID" \
            --node "$NODE" \
            --gas 1000000 \
            --fees "50000$DENOM" \
            --output json \
            -y)
        
        # Extract contract address
        contract_address=$(echo "$result" | jq -r '.logs[0].events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") | .value')
        
        if [[ -z "$contract_address" || "$contract_address" == "null" ]]; then
            print_error "Failed to get contract address for $contract contract"
            print_error "Result: $result"
            exit 1
        fi
        
        CONTRACT_ADDRESSES[$contract]=$contract_address
        print_success "$contract contract instantiated at: $contract_address"
    done
    
    # Save contract addresses to file
    echo "#!/bin/bash" > deployed_addresses.sh
    echo "# Generated Contract Addresses from deployment" >> deployed_addresses.sh
    echo "" >> deployed_addresses.sh
    for contract in "${!CONTRACT_ADDRESSES[@]}"; do
        echo "export ${contract^^}_CONTRACT_ADDRESS=${CONTRACT_ADDRESSES[$contract]}" >> deployed_addresses.sh
    done
    echo "" >> deployed_addresses.sh
    echo "echo 'Contract Addresses:'" >> deployed_addresses.sh
    for contract in "${!CONTRACT_ADDRESSES[@]}"; do
        echo "echo \"$contract: \$${contract^^}_CONTRACT_ADDRESS\"" >> deployed_addresses.sh
    done
    
    chmod +x deployed_addresses.sh
    print_success "Contract addresses saved to deployed_addresses.sh"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying contract deployment..."
    
    # Source contract addresses
    if [[ -f "deployed_addresses.sh" ]]; then
        source deployed_addresses.sh
    else
        print_error "Contract addresses file not found. Please run instantiate_contracts first."
        exit 1
    fi
    
    for contract in "${!CONTRACTS[@]}"; do
        address_var="${contract^^}_CONTRACT_ADDRESS"
        contract_address="${!address_var}"
        
        if [[ -z "$contract_address" ]]; then
            print_error "Contract address not found for $contract"
            continue
        fi
        
        print_status "Verifying $contract contract at $contract_address"
        
        # Query contract info
        result=$(seid query wasm contract "$contract_address" \
            --node "$NODE" \
            --output json 2>/dev/null || echo "{}")
        
        if [[ "$result" != "{}" ]]; then
            print_success "$contract contract verified successfully"
        else
            print_warning "$contract contract verification failed"
        fi
    done
}

# Function to display deployment summary
display_summary() {
    print_status "Deployment Summary"
    print_status "=================="
    
    if [[ -f "deployed_addresses.sh" ]]; then
        source deployed_addresses.sh
        echo ""
        for contract in "${!CONTRACTS[@]}"; do
            address_var="${contract^^}_CONTRACT_ADDRESS"
            contract_address="${!address_var}"
            echo -e "${GREEN}✅ $contract${NC}: $contract_address"
        done
    fi
    
    if [[ -f "deployed_code_ids.sh" ]]; then
        source deployed_code_ids.sh
        echo ""
        print_status "Code IDs:"
        for contract in "${!CONTRACTS[@]}"; do
            code_id_var="${contract^^}_CODE_ID"
            code_id="${!code_id_var}"
            echo -e "${BLUE}📦 $contract${NC}: $code_id"
        done
    fi
    
    echo ""
    print_success "All contracts deployed successfully!"
    print_status "Next steps:"
    print_status "1. Test contract functionality"
    print_status "2. Update frontend with new addresses"
    print_status "3. Deploy to mainnet when ready"
}

# Main deployment function
main() {
    echo -e "${BLUE}"
    echo "🐒💰 SeiMoney DeFi Contracts Deployment"
    echo "====================================="
    echo -e "${NC}"
    
    print_status "Starting deployment to $CHAIN_ID..."
    
    # Check prerequisites
    check_prerequisites
    
    # Configure seid
    configure_seid
    
    # Get deployer address
    get_deployer_address
    
    # Store WASM files
    store_wasm_files
    
    # Instantiate contracts
    instantiate_contracts
    
    # Verify deployment
    verify_deployment
    
    # Display summary
    display_summary
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --check    Check prerequisites only"
    echo "  -s, --store    Store WASM files only"
    echo "  -i, --instantiate  Instantiate contracts only"
    echo "  -v, --verify   Verify deployment only"
    echo ""
    echo "Examples:"
    echo "  $0              # Full deployment"
    echo "  $0 --check      # Check prerequisites"
    echo "  $0 --store      # Store WASM files only"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -c|--check)
        check_prerequisites
        exit 0
        ;;
    -s|--store)
        check_prerequisites
        configure_seid
        get_deployer_address
        store_wasm_files
        exit 0
        ;;
    -i|--instantiate)
        check_prerequisites
        configure_seid
        get_deployer_address
        instantiate_contracts
        exit 0
        ;;
    -v|--verify)
        verify_deployment
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
