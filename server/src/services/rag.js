import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { KnowledgeDoc, KnowledgeChunk } from '../models/Knowledge.js';

// Created lazily so the server still boots (and login works) without an API key
let _embeddings, _llm;
const embeddings = () =>
  (_embeddings ??= new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
  }));
const llm = () =>
  (_llm ??= new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: 0.3,
  }));

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 100 });

/* ---------- INGEST: text -> chunks -> embeddings -> MongoDB ---------- */
export async function ingestDocument({ title, content, userId }) {
  const chunks = await splitter.splitText(content);
  const vectors = await embeddings().embedDocuments(chunks);

  const doc = await KnowledgeDoc.create({ title, content, chunkCount: chunks.length, createdBy: userId });
  await KnowledgeChunk.insertMany(
    chunks.map((text, i) => ({ doc: doc._id, title, text, embedding: vectors[i] }))
  );
  return { id: doc._id, title, chunkCount: chunks.length };
}

/* ---------- RETRIEVE: embed question -> cosine similarity -> top K ---------- */
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export async function retrieve(question, k = 4, minScore = 0.45) {
  const all = await KnowledgeChunk.find().select('+embedding');
  if (!all.length) return [];
  const q = await embeddings().embedQuery(question);
  return all
    .map((c) => ({ title: c.title, text: c.text, score: cosine(q, c.embedding) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
// Note: this in-process search is perfect for a demo / college project.
// For production, swap it for MongoDB Atlas Vector Search ($vectorSearch).

/* ---------- GENERATE ---------- */
const EMERGENCY =
  /(chest pain|can'?t breathe|cannot breathe|difficulty breathing|severe bleeding|unconscious|seizure|stroke|overdose|suicid|kill myself|heart attack)/i;

const EMERGENCY_REPLY =
  "**This could be an emergency.** Please call your local emergency number right now (112 in India, 911 in the US) or go to the nearest emergency room. If someone is with you, ask them to stay with you. If you're thinking about harming yourself, contact a crisis line or someone you trust immediately.\n\nI can't assess emergencies, so please don't wait for a chat reply.";

const systemPrompt = `You are MediAssist, a friendly health information assistant.
Rules:
- Give clear, general health information in plain language. Keep answers short and well organised.
- You are NOT a doctor. Never diagnose, and never prescribe doses or specific prescription drugs.
- Prefer the CONTEXT below when it is relevant; if you use it, stay faithful to it. If the context doesn't cover the question, answer from general knowledge and say so briefly.
- End with when to see a doctor if the topic involves symptoms.
- If an image is provided, describe only visible details and explain that an image alone cannot confirm a diagnosis. Do not infer details that are not visible.
- If the question isn't about health or wellbeing, politely say you can only help with health topics.

CONTEXT:
{context}`;

export async function askHealthAssistant(question, history = [], image = null) {
  if (EMERGENCY.test(question)) {
    return { answer: EMERGENCY_REPLY, sources: [], emergency: true };
  }

  const hits = await retrieve(question || 'general health information about an image');
  const context = hits.length
    ? hits.map((h, i) => `[${i + 1}] ${h.title}: ${h.text}`).join('\n\n')
    : '(no matching knowledge-base entries)';
  const messages = [
    new SystemMessage(systemPrompt.replace('{context}', context)),
    ...history.map((m) => (
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    )),
    new HumanMessage({
      content: [
        {
          type: 'text',
          text: `Question: ${question || 'Please describe the image and share any relevant general health information.'}`,
        },
        ...(image
          ? [{
              type: 'image_url',
              image_url: { url: `data:${image.mimeType};base64,${image.data}` },
            }]
          : []),
      ],
    }),
  ];
  const response = await llm().invoke(messages);
  const answer = await new StringOutputParser().invoke(response);

  return {
    answer,
    emergency: false,
    sources: hits.map((h) => ({ title: h.title, snippet: h.text.slice(0, 160) + '…' })),
  };
}
