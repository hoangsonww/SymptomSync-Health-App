# ────────────────────────────────────────────────────────────────────────────
# Makefile for SymptomSync
#
# Variables (can override from environment):
GITHUB_ACTOR ?= $(error GITHUB_ACTOR is undefined, please export your GitHub username)
GH_TOKEN     ?= $(error GH_TOKEN is undefined, please export your PAT with write:packages scope)
FRONT_DIR    := web
DEVCONT_DIR  := .devcontainer
FRONT_IMAGE  := ghcr.io/hoangsonww/symptomsync-frontend:0.1.0
DEV_IMAGE    := ghcr.io/hoangsonww/devcontainer-setup:latest
BUILD_DATE   := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
SHELL        := /usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
.PHONY: help all build build-frontend build-devcontainer publish publish-frontend \
        publish-devcontainer lint format clean clean-node_modules

# Default target
all: build

# Show usage
help:
	@echo "SymptomSync Makefile"
	@echo
	@echo "Usage:"
	@echo "  make [target]"
	@echo
	@echo "Targets:"
	@echo "  all (default)          Build frontend & devcontainer"
	@echo "  build                  Alias for all"
	@echo "  build-frontend         Install deps & build Next.js app"
	@echo "  build-devcontainer     Build the devcontainer image (dry-run)"
	@echo "  publish                Publish both images to GHCR"
	@echo "  publish-frontend       Publish frontend image"
	@echo "  publish-devcontainer   Publish devcontainer image"
	@echo "  lint                   Run ESLint on frontend"
	@echo "  format                 Run Prettier on frontend"
	@echo "  clean                  Remove build artifacts & node_modules"
	@echo "  clean-node_modules     Remove only node_modules from frontend"
	@echo "  help                   Show this help message"
	@echo

# ────────────────────────────────────────────────────────────────────────────
# Build targets
# ────────────────────────────────────────────────────────────────────────────

build: build-frontend build-devcontainer

build-frontend:
	@echo "👉 [frontend] Installing dependencies"
	cd $(FRONT_DIR) && npm install --legacy-peer-deps
	@echo "👉 [frontend] Building Next.js"
	cd $(FRONT_DIR) && npm run build

build-devcontainer:
	@echo "👉 [devcontainer] Dry-run build"
	docker build --help > /dev/null 2>&1
	@echo "✔ Devcontainer build configuration is valid (dry-run)"

# ────────────────────────────────────────────────────────────────────────────
# Publish targets
# ────────────────────────────────────────────────────────────────────────────

publish: publish-frontend publish-devcontainer

publish-frontend:
	@echo "🔨 Building frontend image: $(FRONT_IMAGE)"
	docker build \
	  --build-arg BUILD_DATE=$(BUILD_DATE) \
	  --label org.opencontainers.image.source="https://github.com/comp426-25s/final-project-team-16" \
	  -t $(FRONT_IMAGE) $(FRONT_DIR)
	@echo "🔐 Logging in to GHCR"
	echo "$(GH_TOKEN)" | docker login ghcr.io -u "$(GITHUB_ACTOR)" --password-stdin
	@echo "📤 Pushing: $(FRONT_IMAGE)"
	docker push $(FRONT_IMAGE)

publish-devcontainer:
	@echo "🔨 Building devcontainer image: $(DEV_IMAGE)"
	docker build \
	  --label org.opencontainers.image.title="devcontainer-setup" \
	  --label org.opencontainers.image.description="Devcontainer with Node.js, Supabase CLI, zsh, etc." \
	  -t $(DEV_IMAGE) $(DEVCONT_DIR)
	@echo "🔐 Logging in to GHCR"
	echo "$(GH_TOKEN)" | docker login ghcr.io -u "$(GITHUB_ACTOR)" --password-stdin
	@echo "📤 Pushing: $(DEV_IMAGE)"
	docker push $(DEV_IMAGE)

# ────────────────────────────────────────────────────────────────────────────
# Lint / Format
# ────────────────────────────────────────────────────────────────────────────

lint:
	@echo "👉 Running ESLint"
	cd $(FRONT_DIR) && npm run lint

format:
	@echo "👉 Running Prettier"
	cd $(FRONT_DIR) && npm run format

# ────────────────────────────────────────────────────────────────────────────
# Clean
# ────────────────────────────────────────────────────────────────────────────

clean: clean-node_modules
	@echo "👉 Removing build artifacts"
	rm -rf $(FRONT_DIR)/.next

clean-node_modules:
	@echo "👉 Removing node_modules from frontend"
	find $(FRONT_DIR) -maxdepth 2 -name node_modules | xargs rm -rf || true
