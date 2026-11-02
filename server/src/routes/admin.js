import { Router } from 'express';
import User, { ROLES } from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { KnowledgeDoc } from '../models/Knowledge.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/stats', async (_req, res) => {
  const [users, conversations, documents] = await Promise.all([
    User.countDocuments(),
    Conversation.countDocuments(),
    KnowledgeDoc.countDocuments(),
  ]);
  res.json({ users, conversations, documents });
});

router.get('/users', async (_req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body || {};
  if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role.' });
  if (req.params.id === String(req.user._id))
    return res.status(400).json({ message: "You can't change your own role." });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user });
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === String(req.user._id))
    return res.status(400).json({ message: "You can't delete your own account." });
  await Conversation.deleteMany({ user: req.params.id });
  await User.deleteOne({ _id: req.params.id });
  res.json({ message: 'Deleted.' });
});

export default router;
