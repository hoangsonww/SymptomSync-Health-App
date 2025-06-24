#!/usr/bin/env node
const cdk = require("aws-cdk-lib");
const { SymptomSyncStack } = require("../lib/symptomsync-stack");

const app = new cdk.App();
new SymptomSyncStack(app, "SymptomSyncStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
