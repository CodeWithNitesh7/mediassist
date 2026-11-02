import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { KnowledgeDoc } from './models/Knowledge.js';
import { ingestDocument } from './services/rag.js';

const SAMPLE_DOCS = [
  {
    title: 'Managing a common cold',
    content:
      'A common cold is a viral infection of the nose and throat. Symptoms include a runny nose, sore throat, cough, mild fever and tiredness, and usually last 7 to 10 days. Antibiotics do not work on colds. Rest, drink plenty of fluids, and use saline nasal rinses or steam to ease congestion. Honey in warm water can soothe a cough in adults and children over one year. See a doctor if fever lasts more than three days, breathing becomes difficult, or symptoms get worse after a week.',
  },
  {
    title: 'Lifestyle tips for high blood pressure',
    content:
      'High blood pressure (hypertension) often has no symptoms, so regular checks matter. Lifestyle changes that help include eating less salt, following a diet rich in vegetables, fruit and whole grains, staying physically active for about 150 minutes a week, keeping a healthy weight, limiting alcohol, not smoking, and managing stress and sleep. Medication decisions must always be made with a doctor. Seek urgent care for a severe headache, chest pain, or vision changes together with very high readings.',
  },
  {
    title: 'First aid for minor burns',
    content:
      'For a minor burn, cool the area under cool (not ice-cold) running water for 20 minutes. Remove rings or tight items near the burn before swelling starts. Cover loosely with a clean non-stick dressing or cling film. Do not apply butter, toothpaste or ice, and do not pop blisters. Seek medical help for burns larger than the palm of the hand, burns on the face, hands, feet or genitals, deep burns, or burns caused by chemicals or electricity.',
  },
  {
    title: 'Staying hydrated and managing fever',
    content:
      'Fever is a temperature of 38 degrees Celsius (100.4 F) or higher and is the body fighting an infection. Drink water, oral rehydration solutions or clear soups, wear light clothing and rest. Fever alone is not always dangerous in healthy adults. Seek medical care for fever above 39.5 C, fever lasting more than three days, a stiff neck, a rash, confusion, or any fever in a baby under three months.',
  },
];

export async function seedDefaults() {
  // 1) Default accounts so every role can be demoed instantly
  const accounts = [
    { name: process.env.ADMIN_NAME || 'Site Admin', email: process.env.ADMIN_EMAIL || 'admin@healthchat.dev', password: process.env.ADMIN_PASSWORD || 'Admin@12345', role: 'admin' },
    { name: 'Dr. Demo', email: 'doctor@healthchat.dev', password: 'Doctor@12345', role: 'doctor' },
    { name: 'Demo Patient', email: 'patient@healthchat.dev', password: 'Patient@12345', role: 'patient' },
  ];
  for (const a of accounts) {
    if (!(await User.findOne({ email: a.email.toLowerCase() }))) {
      await User.create({ ...a, password: await bcrypt.hash(a.password, 10) });
      console.log(`Seeded ${a.role}: ${a.email}`);
    }
  }

  // 2) Starter knowledge base for RAG (needs a valid Gemini key)
  if ((await KnowledgeDoc.countDocuments()) === 0) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY missing: skipping knowledge-base seeding.');
      return;
    }
    try {
      for (const d of SAMPLE_DOCS) await ingestDocument({ ...d, userId: null });
      console.log('Seeded sample knowledge base');
    } catch (e) {
      console.warn('Could not seed knowledge base (check GEMINI_API_KEY):', e.message);
    }
  }
}
