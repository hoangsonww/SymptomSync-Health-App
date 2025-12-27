import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
} from "@google/generative-ai";

type GeminiModelInfo = {
  name?: string;
  supportedGenerationMethods?: string[];
};

type GeminiModelListResponse = {
  models?: GeminiModelInfo[];
};

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-001",
];

let geminiModelCursor = 0;

const getRotatedModels = (models: string[], startIndex: number) => {
  if (models.length === 0) return [];
  const normalizedIndex =
    ((startIndex % models.length) + models.length) % models.length;
  return [
    ...models.slice(normalizedIndex),
    ...models.slice(0, normalizedIndex),
  ];
};

const fetchGeminiModels = async (apiKey: string): Promise<string[]> => {
  const url = new URL("https://generativelanguage.googleapis.com/v1/models");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `Failed to list Gemini models: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GeminiModelListResponse;
  if (!Array.isArray(data.models)) return [];

  const seen = new Set<string>();
  const models: string[] = [];

  for (const model of data.models) {
    const name = model.name;
    if (!name || !name.startsWith("models/gemini-")) continue;

    const lowerName = name.toLowerCase();
    if (lowerName.includes("embedding") || lowerName.includes("-pro")) continue;

    const methods = Array.isArray(model.supportedGenerationMethods)
      ? model.supportedGenerationMethods
      : [];
    if (!methods.includes("generateContent")) continue;

    const cleanedName = name.replace(/^models\//, "");
    if (seen.has(cleanedName)) continue;
    seen.add(cleanedName);
    models.push(cleanedName);
  }

  return models;
};

/**
 * Sends a chat message to Gemini AI. This helper preserves conversation history so that the context
 * is maintained between messages. The assistant is identified as "SymptomSync Assistant" and acts as a
 * knowledgeable health expert.
 *
 * @param history - An array representing the conversation history. Each element should have a `role` and `parts`.
 * @param message - The latest user message to send.
 * @param systemInstruction - (Optional) A custom system instruction to override the default.
 * @returns A promise that resolves to the AI's response text.
 */
export async function chatWithHealthAI(
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  message: string,
  systemInstruction = "",
  userContext?: string,
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY in environment variables");
  }

  const defaultSystemInstruction =
    systemInstruction ||
    `
    You are SymptomSync Assistant, a health expert. 
    Answer user questions about their health accurately, empathetically, and in detail. 
    Provide advice based on relevant medical knowledge.
    Today's date/time is ${new Date().toISOString()} — resolve relative dates like "today", "tomorrow", "yesterday", "tonight" using this.

    ACTIONS ARE MANDATORY when the user asks to add/update/delete an appointment, medication, or health log.
    Always include EXACTLY ONE fenced action block when the user requests a change, even if you must ask follow-up questions. If any required field is missing, ask for it AND still include a best-effort action block with known fields. Never fabricate unknown data; leave unknown fields out.

    Required fields per entity:
      - appointment: appointment_name AND date/time (convert relative terms to concrete date/time using current date above).
      - medication: medication_name AND reminder_time (with a time; convert relative terms).
      - health_log: symptom_type (severity/start_date/notes optional).

    Use this exact format for the action block:
    \`\`\`symptomsync-action
    {
      "entity": "appointment" | "medication" | "health_log",
      "intent": "create" | "update" | "delete",
      "data": {
        // For appointments (required: appointment_name, date with time): "id" (preferred) or "appointment_name", "date" (ISO or natural language WITH a time), optional "notes"
        // For medications (required: medication_name, reminder_time): "id" (preferred) or "medication_name", "reminder_time" (ISO or natural language WITH a time), optional "dosage", "recurrence"
        // For health logs (required: symptom_type): "id" (preferred) or "symptom_type", optional "severity" (1-10), "start_date" (ISO or natural language), "notes", "mood", "medication_intake"
      }
    }
    \`\`\`
    If you do not have a valid time/date, ask the user for it instead of emitting an action block.
    Keep the rest of the response natural and supportive. If details are missing, ask for them instead of guessing.
    
    Here is some user-specific data you can reference:
    ${userContext ?? "No user data available."}

    This is a conversation between a user and you, the assistant. Basically, you're a health expert who is knowledgeable and empathetic.
    You should always be polite and respectful. And you also have access to the conversation history, so you can refer to previous messages.
  `;

  const genAI = new GoogleGenerativeAI(apiKey);

  const generationConfig: GenerationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  history.push({ role: "user", parts: [{ text: message }] });

  let modelsToTry: string[] = [];
  try {
    modelsToTry = await fetchGeminiModels(apiKey);
  } catch {
    modelsToTry = [];
  }

  if (modelsToTry.length === 0) {
    modelsToTry = DEFAULT_GEMINI_MODELS;
  }
  if (modelsToTry.length === 0) {
    throw new Error("No Gemini models available to handle the request.");
  }

  const startIndex = geminiModelCursor % modelsToTry.length;
  const orderedModels = getRotatedModels(modelsToTry, startIndex);
  let lastError: unknown = null;

  for (let i = 0; i < orderedModels.length; i += 1) {
    const modelName = orderedModels[i];
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: defaultSystemInstruction,
      });

      const chatSession = model.startChat({
        generationConfig,
        safetySettings,
        history,
      });

      const result = await chatSession.sendMessage(message);

      if (!result.response || !result.response.text) {
        throw new Error("Failed to get text response from the AI.");
      }

      geminiModelCursor = (startIndex + i + 1) % modelsToTry.length;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return result.response.text();
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Failed to get text response from the AI.");
}
