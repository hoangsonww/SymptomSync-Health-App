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
const codedeploy = require('aws-cdk-lib/aws-codedeploy');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const ssm = require('aws-cdk-lib/aws-ssm');
const wafv2 = require('aws-cdk-lib/aws-wafv2');

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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
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

    // Live aliases for canary + blue/green routing
    const apiAlias = new lambda.Alias(this, 'ApiLiveAlias', {
      aliasName: 'live',
      version: apiFn.currentVersion,
      provisionedConcurrentExecutions: 1,
    });
    const reminderAlias = new lambda.Alias(this, 'ReminderLiveAlias', {
      aliasName: 'live',
      version: reminderFn.currentVersion,
      provisionedConcurrentExecutions: 1,
    });
    const chatbotAlias = new lambda.Alias(this, 'ChatbotLiveAlias', {
      aliasName: 'live',
      version: chatbotFn.currentVersion,
      provisionedConcurrentExecutions: 1,
    });
    const storageAlias = new lambda.Alias(this, 'StorageLiveAlias', {
      aliasName: 'live',
      version: storageFn.currentVersion,
      provisionedConcurrentExecutions: 1,
    });

    // CodeDeploy canary configs with rollback alarms
    const createDeploymentGroup = (alias, idPrefix) => {
      const errorAlarm = new cloudwatch.Alarm(this, `${idPrefix}ErrorAlarm`, {
        metric: alias.metricErrors({ period: Duration.minutes(1) }),
        threshold: 1,
        evaluationPeriods: 1,
      });

      return new codedeploy.LambdaDeploymentGroup(this, `${idPrefix}DeploymentGroup`, {
        alias,
        deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        alarms: [errorAlarm],
        autoRollback: { failedDeployment: true, stoppedDeployment: true },
      });
    };

    createDeploymentGroup(apiAlias, 'Api');
    createDeploymentGroup(reminderAlias, 'Reminder');
    createDeploymentGroup(chatbotAlias, 'Chatbot');
    createDeploymentGroup(storageAlias, 'Storage');

    // Permissions
    [userProfiles, medications, appointments, healthLogs, notifications].forEach(tbl => {
      tbl.grantReadWriteData(apiAlias);
      tbl.grantReadWriteData(reminderAlias);
    });
    avatarsBucket.grantReadWrite(storageAlias);
    documentsBucket.grantReadWrite(storageAlias);

    // API Gateway
    const api = new apigw.RestApi(this, 'SymptomSyncApi', {
      restApiName: 'SymptomSync Service',
      deploy: false,
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
    meds.addMethod('GET', new apigw.LambdaIntegration(apiAlias), { authorizer });
    meds.addMethod('POST', new apigw.LambdaIntegration(apiAlias), { authorizer });
    meds.addResource('{id}')
      .addMethod('PUT', new apigw.LambdaIntegration(apiAlias), { authorizer })
      .addMethod('DELETE', new apigw.LambdaIntegration(apiAlias), { authorizer });

    // /appointments
    const appts = api.root.addResource('appointments');
    appts.addMethod('GET', new apigw.LambdaIntegration(apiAlias), { authorizer });
    appts.addMethod('POST', new apigw.LambdaIntegration(apiAlias), { authorizer });
    appts.addResource('{id}')
      .addMethod('PUT', new apigw.LambdaIntegration(apiAlias), { authorizer })
      .addMethod('DELETE', new apigw.LambdaIntegration(apiAlias), { authorizer });

    // /logs
    const logs = api.root.addResource('logs');
    logs.addMethod('GET', new apigw.LambdaIntegration(apiAlias), { authorizer });
    logs.addMethod('POST', new apigw.LambdaIntegration(apiAlias), { authorizer });
    logs.addResource('{id}')
      .addMethod('PUT', new apigw.LambdaIntegration(apiAlias), { authorizer })
      .addMethod('DELETE', new apigw.LambdaIntegration(apiAlias), { authorizer });

    // /files
    const files = api.root.addResource('files');
    files.addMethod('GET', new apigw.LambdaIntegration(storageAlias), { authorizer });
    files.addMethod('POST', new apigw.LambdaIntegration(storageAlias), { authorizer });

    // /chatbot
    const chat = api.root.addResource('chatbot');
    chat.addMethod('POST', new apigw.LambdaIntegration(chatbotAlias), { authorizer });

    // /health (no auth) for smoke tests
    api.root.addResource('health').addMethod(
      'GET',
      new apigw.MockIntegration({
        integrationResponses: [{ statusCode: '200', responseTemplates: { 'application/json': '{"status":"ok"}' } }],
        passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: { 'application/json': '{"statusCode": 200}' },
      }),
      { methodResponses: [{ statusCode: '200' }], authorizationType: apigw.AuthorizationType.NONE },
    );

    // Blue/green stages
    const deployment = new apigw.Deployment(this, 'SymptomSyncDeployment', { api });
    const blueStage = new apigw.Stage(this, 'BlueStage', {
      deployment,
      stageName: 'blue',
      metricsEnabled: true,
      loggingLevel: apigw.MethodLoggingLevel.INFO,
      tracingEnabled: true,
      variables: { color: 'blue' },
    });
    const greenStage = new apigw.Stage(this, 'GreenStage', {
      deployment,
      stageName: 'green',
      metricsEnabled: true,
      loggingLevel: apigw.MethodLoggingLevel.INFO,
      tracingEnabled: true,
      variables: { color: 'green' },
    });

    const activeStageParam = new ssm.StringParameter(this, 'ActiveStageParameter', {
      parameterName: '/symptomsync/active_stage',
      stringValue: 'blue',
      description: 'Active API stage for production traffic (blue/green switch).',
    });

    // API Gateway WAF with managed protections
    const webAcl = new wafv2.CfnWebACL(this, 'ApiWafAcl', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'symptomsync-waf',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: { managedRuleGroupStatement: { vendorName: 'AWS', name: 'AWSManagedRulesCommonRuleSet' } },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'common-rule-set',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'RateLimit',
          priority: 2,
          action: { block: {} },
          statement: { rateBasedStatement: { aggregateKeyType: 'IP', limit: 2000 } },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'rate-limit',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Associate WAF to both stages
    new wafv2.CfnWebACLAssociation(this, 'BlueWafAssociation', {
      resourceArn: `arn:aws:apigateway:${Stack.of(this).region}::/restapis/${api.restApiId}/stages/${blueStage.stageName}`,
      webAclArn: webAcl.attrArn,
    });
    new wafv2.CfnWebACLAssociation(this, 'GreenWafAssociation', {
      resourceArn: `arn:aws:apigateway:${Stack.of(this).region}::/restapis/${api.restApiId}/stages/${greenStage.stageName}`,
      webAclArn: webAcl.attrArn,
    });

    // API Gateway alarms (5XX and latency per stage)
    const buildApiAlarms = (stageName, label) => {
      new cloudwatch.Alarm(this, `${label}5xxAlarm`, {
        metric: api.metricServerError({
          statistic: 'sum',
          period: Duration.minutes(1),
          dimensionsMap: { ApiName: api.restApiName, Stage: stageName },
        }),
        threshold: 5,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        alarmDescription: `${label} API 5XX rate high`,
      });
      new cloudwatch.Alarm(this, `${label}LatencyAlarm`, {
        metric: api.metricLatency({
          statistic: 'p95',
          period: Duration.minutes(1),
          dimensionsMap: { ApiName: api.restApiName, Stage: stageName },
        }),
        threshold: 2000,
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        alarmDescription: `${label} API latency high (p95)`,
      });
    };
    buildApiAlarms(blueStage.stageName, 'BlueStage');
    buildApiAlarms(greenStage.stageName, 'GreenStage');

    // Scheduled rule for reminders
    new events.Rule(this, 'ReminderSchedule', {
      schedule: events.Schedule.rate(Duration.minutes(1)),
      targets: [new targets.LambdaFunction(reminderAlias)],
    });

    new cdk.CfnOutput(this, 'BlueStageUrl', {
      value: `${api.urlForPath('/', blueStage.stageName)}`,
      description: 'Blue stage invoke URL',
    });
    new cdk.CfnOutput(this, 'GreenStageUrl', {
      value: `${api.urlForPath('/', greenStage.stageName)}`,
      description: 'Green stage invoke URL',
    });
    new cdk.CfnOutput(this, 'ActiveStageParameterName', {
      value: activeStageParam.parameterName,
      description: 'SSM parameter controlling active blue/green stage',
    });
  }
}

module.exports = { SymptomSyncStack };
