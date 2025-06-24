const cdk = require('aws-cdk-lib');
const { Stack, Duration } = cdk;
const { Construct } = require('constructs');
const cognito = require('aws-cdk-lib/aws-cognito');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const s3 = require('aws-cdk-lib/aws-s3');
const lambda = require('aws-cdk-lib/aws-lambda');
const nodejsLambda = require('aws-cdk-lib/aws-lambda-nodejs');
const apigw = require('aws-cdk-lib/aws-apigateway');
const events = require('aws-cdk-lib/aws-events');
const targets = require('aws-cdk-lib/aws-events-targets');

class SymptomSyncStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: false } },
    });
    userPool.addClient('UserPoolClient', {
      authFlows: { userPassword: true },
      generateSecret: false,
    });

    // DynamoDB Tables
    const userProfiles = new dynamodb.Table(this, 'UserProfilesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const medications = new dynamodb.Table(this, 'MedicationsTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'medId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const appointments = new dynamodb.Table(this, 'AppointmentsTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'apptId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const healthLogs = new dynamodb.Table(this, 'HealthLogsTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'logId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const notifications = new dynamodb.Table(this, 'NotificationsTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'noteId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // S3 Buckets
    const avatarsBucket = new s3.Bucket(this, 'AvatarsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Common environment vars
    const commonEnv = {
      USER_PROFILES_TABLE: userProfiles.tableName,
      MEDS_TABLE: medications.tableName,
      APPTS_TABLE: appointments.tableName,
      LOGS_TABLE: healthLogs.tableName,
      NOTIFS_TABLE: notifications.tableName,
      AVATARS_BUCKET: avatarsBucket.bucketName,
      DOCUMENTS_BUCKET: documentsBucket.bucketName,
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || '',
    };

    // Lambda functions
    const apiFn = new nodejsLambda.NodejsFunction(this, 'ApiHandler', {
      entry: 'aws/lambda/apiHandler.js',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: Duration.seconds(10),
      environment: commonEnv,
    });
    const reminderFn = new nodejsLambda.NodejsFunction(this, 'ReminderProcessor', {
      entry: 'aws/lambda/reminderProcessor.js',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: Duration.seconds(15),
      environment: commonEnv,
    });
    const chatbotFn = new nodejsLambda.NodejsFunction(this, 'ChatbotHandler', {
      entry: 'aws/lambda/chatbotHandler.js',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: commonEnv,
    });
    const storageFn = new nodejsLambda.NodejsFunction(this, 'StorageHandler', {
      entry: 'aws/lambda/storageHandler.js',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
      environment: commonEnv,
    });

    // Permissions
    [userProfiles, medications, appointments, healthLogs, notifications].forEach(tbl => {
      tbl.grantReadWriteData(apiFn);
      tbl.grantReadWriteData(reminderFn);
    });
    avatarsBucket.grantReadWrite(storageFn);
    documentsBucket.grantReadWrite(storageFn);

    // API Gateway
    const api = new apigw.RestApi(this, 'SymptomSyncApi', {
      restApiName: 'SymptomSync Service',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
      },
    });
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // /medications
    const meds = api.root.addResource('medications');
    meds.addMethod('GET', new apigw.LambdaIntegration(apiFn), { authorizer });
    meds.addMethod('POST', new apigw.LambdaIntegration(apiFn), { authorizer });
    meds.addResource('{id}')
      .addMethod('PUT', new apigw.LambdaIntegration(apiFn), { authorizer })
      .addMethod('DELETE', new apigw.LambdaIntegration(apiFn), { authorizer });

    // /appointments
    const appts = api.root.addResource('appointments');
    appts.addMethod('GET', new apigw.LambdaIntegration(apiFn), { authorizer });
    appts.addMethod('POST', new apigw.LambdaIntegration(apiFn), { authorizer });
    appts.addResource('{id}')
      .addMethod('PUT', new apigw.LambdaIntegration(apiFn), { authorizer })
      .addMethod('DELETE', new apigw.LambdaIntegration(apiFn), { authorizer });

    // /logs
    const logs = api.root.addResource('logs');
    logs.addMethod('GET', new apigw.LambdaIntegration(apiFn), { authorizer });
    logs.addMethod('POST', new apigw.LambdaIntegration(apiFn), { authorizer });
    logs.addResource('{id}')
      .addMethod('PUT', new apigw.LambdaIntegration(apiFn), { authorizer })
      .addMethod('DELETE', new apigw.LambdaIntegration(apiFn), { authorizer });

    // /files
    const files = api.root.addResource('files');
    files.addMethod('GET', new apigw.LambdaIntegration(storageFn), { authorizer });
    files.addMethod('POST', new apigw.LambdaIntegration(storageFn), { authorizer });

    // /chatbot
    const chat = api.root.addResource('chatbot');
    chat.addMethod('POST', new apigw.LambdaIntegration(chatbotFn), { authorizer });

    // Scheduled rule for reminders
    new events.Rule(this, 'ReminderSchedule', {
      schedule: events.Schedule.rate(Duration.minutes(1)),
      targets: [new targets.LambdaFunction(reminderFn)],
    });
  }
}

module.exports = { SymptomSyncStack };
