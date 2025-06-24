const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const {
  MEDS_TABLE,
  APPTS_TABLE,
  LOGS_TABLE,
} = process.env;

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer?.claims.sub;
  if (!userId) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const path = event.resource;
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : null;
  let table;

  if (path.startsWith('/medications')) table = MEDS_TABLE;
  else if (path.startsWith('/appointments')) table = APPTS_TABLE;
  else if (path.startsWith('/logs')) table = LOGS_TABLE;
  else return { statusCode: 404, body: 'Not Found' };

  try {
    // LIST
    if (method === 'GET' && !path.includes('{id}')) {
      const res = await client.send(new QueryCommand({
        TableName: table,
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': userId },
      }));
      return { statusCode: 200, body: JSON.stringify(res.Items) };
    }

    // CREATE
    if (method === 'POST') {
      const idKey = path.includes('medications') ? 'medId'
        : path.includes('appointments') ? 'apptId' : 'logId';
      const item = { userId, [idKey]: body[idKey], ...body };
      await client.send(new PutCommand({ TableName: table, Item: item }));
      return { statusCode: 201, body: JSON.stringify(item) };
    }

    const id = event.pathParameters.id;
    // UPDATE
    if (method === 'PUT') {
      const keyName = path.includes('medications') ? 'medId'
        : path.includes('appointments') ? 'apptId' : 'logId';
      await client.send(new UpdateCommand({
        TableName: table,
        Key: { userId, [keyName]: id },
        UpdateExpression: 'SET #data = :d',
        ExpressionAttributeNames: { '#data': 'data' },
        ExpressionAttributeValues: { ':d': body },
      }));
      return { statusCode: 204, body: '' };
    }
    // DELETE
    if (method === 'DELETE') {
      const keyName = path.includes('medications') ? 'medId'
        : path.includes('appointments') ? 'apptId' : 'logId';
      await client.send(new DeleteCommand({
        TableName: table,
        Key: { userId, [keyName]: id },
      }));
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 400, body: 'Bad Request' };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
