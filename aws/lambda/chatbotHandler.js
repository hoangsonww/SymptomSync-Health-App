const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { prompt } = JSON.parse(event.body || '{}');
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const res = await fetch(
    'https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/publishers/google/models/chat-bison:predict',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ instances: [{ text: prompt }] }),
    }
  );
  const data = await res.json();
  const reply = data.predictions?.[0]?.content || 'Sorry, I have no answer.';
  return { statusCode: 200, body: JSON.stringify({ reply }) };
};
