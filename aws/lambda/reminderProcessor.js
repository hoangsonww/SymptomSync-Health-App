const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const { MEDS_TABLE, APPTS_TABLE, NOTIFS_TABLE } = process.env;

exports.handler = async () => {
  const now = new Date().toISOString();
  const meds = await client.send(new ScanCommand({
    TableName: MEDS_TABLE,
    FilterExpression: 'nextDose <= :now',
    ExpressionAttributeValues: { ':now': now },
  }));
  const appts = await client.send(new ScanCommand({
    TableName: APPTS_TABLE,
    FilterExpression: 'apptTime <= :now',
    ExpressionAttributeValues: { ':now': now },
  }));
  for (const item of [...(meds.Items || []), ...(appts.Items || [])]) {
    await client.send(new PutCommand({
      TableName: NOTIFS_TABLE,
      Item: {
        userId: item.userId,
        noteId: `${item.userId}-${now}-${Math.random()}`,
        message: item.medicationName
          ? `Time to take ${item.medicationName}`
          : `Upcoming appointment: ${item.title || 'Appointment'}`,
        timestamp: now,
      },
    }));
  }
};
