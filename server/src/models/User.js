import mongoose from 'mongoose';

export const ROLES = ['patient', 'doctor', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'patient' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
