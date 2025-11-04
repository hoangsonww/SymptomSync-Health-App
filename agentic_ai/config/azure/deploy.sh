#!/bin/bash

# SymptomSync Agentic AI - Azure Deployment Script

set -e

echo "=========================================="
echo "SymptomSync Agentic AI - Azure Deployment"
echo "=========================================="

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
RESOURCE_GROUP="symptomsync-agentic-ai-${ENVIRONMENT}"
LOCATION=${AZURE_LOCATION:-eastus}

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "ERROR: Azure CLI not found. Please install it first."
    exit 1
fi

# Check parameters
if [ -z "$OPENAI_API_KEY" ]; then
    echo "ERROR: OPENAI_API_KEY environment variable not set"
    exit 1
fi

if [ -z "$DATABASE_PASSWORD" ]; then
    echo "ERROR: DATABASE_PASSWORD environment variable not set"
    exit 1
fi

if [ -z "$CONTAINER_IMAGE" ]; then
    echo "ERROR: CONTAINER_IMAGE environment variable not set"
    exit 1
fi

echo "Environment: ${ENVIRONMENT}"
echo "Location: ${LOCATION}"
echo "Resource Group: ${RESOURCE_GROUP}"
echo ""

# Login check
echo "Checking Azure login status..."
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure CLI first:"
    echo "  az login"
    exit 1
}

# Create resource group
echo "Creating resource group..."
az group create \
    --name ${RESOURCE_GROUP} \
    --location ${LOCATION}

# Deploy ARM template
echo ""
echo "Deploying ARM template..."
DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group ${RESOURCE_GROUP} \
    --template-file arm-template.json \
    --parameters \
        environmentName=${ENVIRONMENT} \
        containerImage=${CONTAINER_IMAGE} \
        openAIApiKey=${OPENAI_API_KEY} \
        databasePassword=${DATABASE_PASSWORD} \
    --query 'properties.outputs' \
    --output json)

# Display outputs
echo ""
echo "Deployment complete! Outputs:"
echo ${DEPLOYMENT_OUTPUT} | jq '.'

# Extract and display key endpoints
API_ENDPOINT=$(echo ${DEPLOYMENT_OUTPUT} | jq -r '.apiEndpoint.value')
echo ""
echo "=========================================="
echo "Deployment successful!"
echo "API Endpoint: ${API_ENDPOINT}"
echo "=========================================="
