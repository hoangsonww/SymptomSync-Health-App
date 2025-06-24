const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({});
const { AVATARS_BUCKET, DOCUMENTS_BUCKET } = process.env;

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const bucket = params.type === 'avatar' ? AVATARS_BUCKET : DOCUMENTS_BUCKET;

  if (event.httpMethod === 'GET') {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: params.key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
    return { statusCode: 200, body: JSON.stringify({ url }) };
  }

  if (event.httpMethod === 'POST') {
    const newKey = `${Date.now()}-${params.key}`;
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: newKey });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    return { statusCode: 201, body: JSON.stringify({ key: newKey, url }) };
  }

  return { statusCode: 400, body: 'Bad Request' };
};
