import mongoose from 'mongoose';

// One document the doctor/admin uploads
const docSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    chunkCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Small pieces of that document + their embedding vector (the "R" in RAG)
const chunkSchema = new mongoose.Schema({
  doc: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeDoc', index: true },
  title: String,
  text: String,
  embedding: { type: [Number], select: false },
});

export const KnowledgeDoc = mongoose.model('KnowledgeDoc', docSchema);
export const KnowledgeChunk = mongoose.model('KnowledgeChunk', chunkSchema);
