#!/bin/bash

# SymptomSync Agentic AI - AWS Deployment Script

set -e

echo "========================================"
echo "SymptomSync Agentic AI - AWS Deployment"
echo "========================================"

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
STACK_NAME="symptomsync-agentic-ai-${ENVIRONMENT}"
REGION=${AWS_REGION:-us-east-1}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI not found. Please install it first."
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
echo "Region: ${REGION}"
echo "Stack Name: ${STACK_NAME}"
echo ""

# Store secrets in AWS Secrets Manager
echo "Storing secrets in AWS Secrets Manager..."
OPENAI_SECRET_ARN=$(aws secretsmanager create-secret \
    --name "${STACK_NAME}/openai-api-key" \
    --secret-string "${OPENAI_API_KEY}" \
    --region ${REGION} \
    --query 'ARN' \
    --output text 2>/dev/null || \
    aws secretsmanager update-secret \
    --secret-id "${STACK_NAME}/openai-api-key" \
    --secret-string "${OPENAI_API_KEY}" \
    --region ${REGION} \
    --query 'ARN' \
    --output text)

echo "OpenAI Secret ARN: ${OPENAI_SECRET_ARN}"

# Deploy CloudFormation stack
echo ""
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation.yaml \
    --stack-name ${STACK_NAME} \
    --parameter-overrides \
        EnvironmentName=${ENVIRONMENT} \
        ContainerImage=${CONTAINER_IMAGE} \
        OpenAISecretArn=${OPENAI_SECRET_ARN} \
        DatabasePassword=${DATABASE_PASSWORD} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

# Get outputs
echo ""
echo "Deployment complete! Getting stack outputs..."
aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --region ${REGION} \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "========================================"
echo "Deployment successful!"
echo "========================================"
