# AWS Infrastructure for SymptomSync

This directory contains an AWS CDK (v2)–based, JavaScript-powered infrastructure definition for the SymptomSync health management app. It will provision:

- **Cognito** User Pool for authentication  
- **DynamoDB** tables for user profiles, medications, appointments, health logs, and notifications  
- **S3** buckets for avatars and health documents  
- **Lambda** functions for the REST API, reminder processor, chatbot integration, and S3 pre-signed URL generation  
- **API Gateway** (REST API) with Cognito authorizer  
- **EventBridge** rule to run reminders every minute  

---

## Prerequisites

- **Node.js** v16.x or later  
- **AWS CDK** v2 installed globally:  
  ```bash
  npm install -g aws-cdk@^2
  ```

* An AWS account & credentials configured (e.g. via `aws configure`)
* Environment variables:

  * `GOOGLE_AI_API_KEY` → your Google AI API key (for chatbot)

---

## Directory Structure

```
aws/
├── bin/
│   └── symptomsync.js         # CDK entry point
├── lambda/
│   ├── apiHandler.js          # REST API handler
│   ├── reminderProcessor.js   # Scheduled reminder logic
│   ├── chatbotHandler.js      # Google AI chatbot integration
│   └── storageHandler.js      # S3 pre-signed URL generator
├── lib/
│   └── symptomsync-stack.js   # CDK Stack definition
├── .gitignore
├── package.json
├── cdk.json
└── README.md                  # ← you are here
```

---

## Getting Started

1. **Install dependencies**

   ```bash
   cd aws
   npm install
   ```

2. **Bootstrap your AWS environment** (if you haven’t already)

   ```bash
   cdk bootstrap
   ```

3. **Deploy the stack**

   ```bash
   cdk deploy
   ```

   This will create all resources (Cognito, DynamoDB, S3, Lambdas, API Gateway, EventBridge rule).

4. **Capture the API endpoint**
   After deployment, note the REST API URL printed in the output (e.g. `SymptomSyncApiUrl`). Point your Next.js front end to this URL.

---

## Environment & Configuration

* All table names, bucket names, and the Google AI API key are injected into Lambda functions as environment variables via CDK.
* To update the Google AI key, set `GOOGLE_AI_API_KEY` in your shell before running `cdk deploy`.

---

## CDK Commands

* **Diff**: Preview changes before applying

  ```bash
  cdk diff
  ```
* **Destroy**: Tear down all provisioned resources

  ```bash
  cdk destroy
  ```

---

## Cleanup

To avoid ongoing charges, run:

```bash
cdk destroy
```

and confirm deletion of all stacks.

---

## Extending the Stack

* Swap **DynamoDB** for Aurora if you need relational capabilities
* Add **SNS** or **Lambda Destinations** for push notifications
* Enhance your **Cognito** setup with custom attributes, groups, or federated identity providers

---

## Contributing

1. Fork the repo & create a feature branch
2. Make your changes in `aws/` or the main app
3. Run `npm install` & `cdk synth` to validate
4. Commit, push, and open a PR!

---

*Last updated: June 2025*
