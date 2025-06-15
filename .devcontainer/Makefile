# web/Makefile for SymptomSync Frontend
# ────────────────────────────────────────────────────────────────────────────
# Usage:
#   make           # show this help
#   make install   # install dependencies
#   make dev       # start dev server (Next.js + Turbopack)
#   make build     # production build
#   make start     # run production build
#   make lint      # run ESLint
#   make format    # run Prettier
#   make test      # run Jest tests
#   make clean     # remove build artifacts and deps
# ────────────────────────────────────────────────────────────────────────────

SHELL := /usr/bin/env bash

NPM  := npm
CI   := $(NPM) ci --legacy-peer-deps
LINT := $(NPM) run lint
FMT  := $(NPM) run format
DEV  := $(NPM) run dev
BD   := $(NPM) run build
ST   := $(NPM) run start
TEST := $(NPM) test
CLEAN := rm -rf .next node_modules

.PHONY: help install dev build start lint format test clean

help:
	@echo "SymptomSync Frontend Makefile"
	@echo
	@echo "Available targets:"
	@echo "  install   Install dependencies"
	@echo "  dev       Start development server"
	@echo "  build     Create a production build"
	@echo "  start     Run the production build"
	@echo "  lint      Run ESLint"
	@echo "  format    Run Prettier"
	@echo "  test      Run Jest tests"
	@echo "  clean     Remove .next and node_modules"
	@echo "  help      Show this help message"

install:
	@echo "👉 Installing dependencies..."
	@$(CI)

dev:
	@echo "🚀 Starting development server..."
	@$(DEV)

build:
	@echo "🔨 Building for production..."
	@$(BD)

start:
	@echo "▶️  Running production build..."
	@$(ST)

lint:
	@echo "🔍 Running ESLint..."
	@$(LINT)

format:
	@echo "🎨 Running Prettier..."
	@$(FMT)

test:
	@echo "🧪 Running tests..."
	@$(TEST)

clean:
	@echo "🧹 Cleaning build artifacts and dependencies..."
	@$(CLEAN)
