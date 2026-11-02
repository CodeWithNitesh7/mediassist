import { Router } from 'express';
import Conversation from '../models/Conversation.js';
import { requireAuth } from '../middleware/auth.js';
import { askHealthAssistant } from '../services/rag.js';

const router = Router();
router.use(requireAuth);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_SIGNATURES = {
  'image/jpeg': (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  'image/png': (data) => data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/webp': (data) => data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP',
};

// List my conversations (never anyone else's)
router.get('/conversations', async (req, res) => {
  const list = await Conversation.find({ user: req.user._id })
    .select('title updatedAt')
    .sort({ updatedAt: -1 })
    .limit(50);
  res.json({ conversations: list });
});

router.get('/conversations/:id', async (req, res) => {
  const convo = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!convo) return res.status(404).json({ message: 'Conversation not found.' });
  res.json({ conversation: convo });
});

router.delete('/conversations/:id', async (req, res) => {
  await Conversation.deleteOne({ _id: req.params.id, user: req.user._id });
  res.json({ message: 'Deleted.' });
});

// Send a message -> RAG -> Gemini -> save + return
router.post('/', async (req, res) => {
  const { conversationId, message, image } = req.body || {};
  if (message !== undefined && typeof message !== 'string') {
    return res.status(400).json({ message: 'Message must be text.' });
  }
  const question = message?.trim() || '';
  if (!question && !image) return res.status(400).json({ message: 'Type a message or attach an image.' });
  if (question.length > 2000) return res.status(400).json({ message: 'Message is too long (max 2000 characters).' });

  let validatedImage = null;
  if (image !== undefined) {
    if (
      !image ||
      typeof image.mimeType !== 'string' ||
      !Object.hasOwn(IMAGE_SIGNATURES, image.mimeType) ||
      typeof image.data !== 'string' ||
      image.data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(image.data)
    ) {
      return res.status(400).json({ message: 'Attach a valid JPEG, PNG, or WebP image up to 5 MB.' });
    }

    const data = Buffer.from(image.data, 'base64');
    if (
      data.length === 0 ||
      data.length > MAX_IMAGE_BYTES ||
      !IMAGE_SIGNATURES[image.mimeType](data)
    ) {
      return res.status(400).json({ message: 'The image is invalid, unsupported, or larger than 5 MB.' });
    }
    validatedImage = { mimeType: image.mimeType, data: image.data };
  }

  let convo = conversationId
    ? await Conversation.findOne({ _id: conversationId, user: req.user._id })
    : null;
  if (conversationId && !convo) return res.status(404).json({ message: 'Conversation not found.' });
  if (!convo) {
    convo = new Conversation({
      user: req.user._id,
      title: (question || 'Image question').slice(0, 50),
      messages: [],
    });
  }

  const history = convo.messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

  try {
    const { answer, sources, emergency } = await askHealthAssistant(question, history, validatedImage);
    convo.messages.push({ role: 'user', content: question || 'Image attached (not stored)' });
    convo.messages.push({ role: 'assistant', content: answer, sources, emergency });
    await convo.save();
    res.json({ conversationId: convo._id, title: convo.title, reply: convo.messages.at(-1) });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(502).json({
      message: 'The AI service is unavailable. Check GEMINI_API_KEY on the server and try again.',
    });
  }
});

export default router;
