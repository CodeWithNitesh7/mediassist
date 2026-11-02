import { Router } from 'express';
import { KnowledgeDoc, KnowledgeChunk } from '../models/Knowledge.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ingestDocument } from '../services/rag.js';

const router = Router();
router.use(requireAuth);

// Doctors and admins can view + add medical knowledge. Only admins can delete.
router.get('/', requireRole('doctor', 'admin'), async (_req, res) => {
  const docs = await KnowledgeDoc.find().select('-content').sort({ createdAt: -1 }).populate('createdBy', 'name');
  res.json({ documents: docs });
});

router.post('/', requireRole('doctor', 'admin'), async (req, res) => {
  const { title, content } = req.body || {};
  if (!title?.trim() || !content?.trim() || content.trim().length < 30)
    return res.status(400).json({ message: 'Add a title and at least a few sentences of content.' });
  try {
    const doc = await ingestDocument({ title: title.trim(), content: content.trim(), userId: req.user._id });
    res.status(201).json({ document: doc });
  } catch (err) {
    console.error('Ingest error:', err.message);
    res.status(502).json({ message: 'Could not embed the document. Check GEMINI_API_KEY on the server.' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await KnowledgeChunk.deleteMany({ doc: req.params.id });
  await KnowledgeDoc.deleteOne({ _id: req.params.id });
  res.json({ message: 'Deleted.' });
});

export default router;
