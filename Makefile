.PHONY: help setup build deploy test clean sdk seed verify

# Default target
help:
	@echo "🚀 Sei Money - Available Commands"
	@echo ""
	@echo "🔧 Setup & Development:"
	@echo "  setup        - Setup development environment"
	@echo "  setup-wallet - Setup Sei wallet"
	@echo "  fund-wallet  - Fund wallet from faucet"
	@echo ""
	@echo "🏗️ Build & Deploy:"
	@echo "  build        - Build all WASM contracts"
	@echo "  deploy       - Deploy specific contract (usage: make deploy CONTRACT=payments)"
	@echo "  verify       - Verify deployed contract (usage: make verify ADDR=sei1...)"
	@echo "  quick-deploy - Deploy all contracts quickly"
	@echo "  deploy-all   - Build and deploy all contracts"
	@echo ""
	@echo "🧪 Testing & Development:"
	@echo "  test         - Run all tests"
	@echo "  sdk          - Generate TypeScript SDK"
	@echo "  seed         - Seed demo data"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  clean        - Clean build artifacts"
	@echo "  env          - Load environment variables"
	@echo "  health       - System health check"
	@echo ""
	@echo "📋 Examples:"
	@echo "  make deploy CONTRACT=payments"
	@echo "  make verify ADDR=sei1abc123..."

# Setup development environment
setup:
	@chmod +x scripts/setup_dev.sh
	@./scripts/setup_dev.sh

# Setup wallet
setup-wallet:
	@chmod +x scripts/setup_wallet.sh
	@./scripts/setup_wallet.sh

# Fund wallet
fund-wallet:
	@chmod +x scripts/fund_wallet.sh
	@./scripts/fund_wallet.sh

# Build all contracts
build:
	@chmod +x scripts/build_wasm.sh
	@./scripts/build_wasm.sh

# Deploy contract
deploy:
	@if [ -z "$(CONTRACT)" ]; then \
		echo "❌ Usage: make deploy CONTRACT=<contract_name>"; \
		echo "Available: payments, groups, pots, alias, risk_escrow, vaults"; \
		exit 1; \
	fi
	@chmod +x scripts/deploy_sei.sh
	@./scripts/deploy_sei.sh $(CONTRACT)

# Verify contract
verify:
	@if [ -z "$(ADDR)" ]; then \
		echo "❌ Usage: make verify ADDR=<contract_address>"; \
		exit 1; \
	fi
	@chmod +x scripts/verify_sei.sh
	@./scripts/verify_sei.sh $(ADDR)

# Generate SDK
sdk:
	@chmod +x scripts/gen_ts.sh
	@./scripts/gen_ts.sh

# Seed demo data
seed:
	@chmod +x scripts/seed_demo_data.sh
	@./scripts/seed_demo_data.sh

# Load environment
env:
	@chmod +x scripts/env.sh
	@source scripts/env.sh

# Run tests
test:
	@echo "🧪 Running Rust tests..."
	@cd contracts && cargo test --workspace --locked
	@echo "🧪 Running backend tests..."
	@cd backend && pnpm test
	@echo "🧪 Running frontend tests..."
	@cd app && pnpm test

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd contracts && cargo clean
	@cd backend && rm -rf dist build
	@cd app && rm -rf dist build
	@cd SDK && rm -rf dist build
	@echo "✅ Clean complete"

# Quick start (setup + build + test)
quick-start: setup build test
	@echo "🎉 Quick start complete! Your development environment is ready."
	@echo "💡 Next steps:"
	@echo "  1. make setup-wallet"
	@echo "  2. make fund-wallet"
	@echo "  3. make deploy CONTRACT=payments"

# Show project status
status:
	@echo "📊 Sei Money Project Status"
	@echo ""
	@echo "🔧 Tools:"
	@echo "  Rust: $(shell command -v rustc >/dev/null 2>&1 && echo "✅" || echo "❌")"
	@echo "  Node: $(shell command -v node >/dev/null 2>&1 && echo "✅" || echo "❌")"
	@echo "  pnpm: $(shell command -v pnpm >/dev/null 2>&1 && echo "✅" || echo "❌")"
	@echo "  seid: $(shell command -v seid >/dev/null 2>&1 && echo "✅" || echo "❌")"
	@echo "  jq: $(shell command -v jq >/dev/null 2>&1 && echo "✅" || echo "❌")"
	@echo ""
	@echo "🏗️ Contracts:"
	@for dir in payments groups pots alias risk_escrow vaults; do \
		if [ -d "contracts/$$dir" ]; then \
			if [ -f "contracts/target/wasm32-unknown-unknown/release/seimoney_$$dir.wasm" ]; then \
				echo "  $$dir: ✅ Built"; \
			else \
				echo "  $$dir: ⚠️ Not built"; \
			fi; \
		else \
			echo "  $$dir: ❌ Not found"; \
		fi; \
	done
	@echo ""
	@echo "💡 Run 'make help' for available commands"

# Quick deploy all contracts
quick-deploy:
	@chmod +x scripts/quick_deploy.sh
	@./scripts/quick_deploy.sh

# Health check
health:
	@chmod +x scripts/health_check.sh
	@./scripts/health_check.sh

# Full deployment pipeline
deploy-all: build quick-deploy
	@echo "🎉 Full deployment pipeline completed!"
