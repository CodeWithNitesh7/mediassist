# MediAssist – AI Health Chatbot (RAG + RBAC)

Stack: React + Tailwind (Vite), Node.js + Express, MongoDB, LangChain, Gemini API, Docker.

## Run with Docker (recommended)
```bash
cp .env.example .env        # then put your GEMINI_API_KEY and a JWT_SECRET in it
docker compose up --build
```
Open http://localhost:3000

Demo logins (auto-created on first start):
| Role    | Email                  | Password        |
|---------|------------------------|-----------------|
| Patient | patient@healthchat.dev | Patient@12345   |
| Doctor  | doctor@healthchat.dev  | Doctor@12345    |
| Admin   | admin@healthchat.dev   | Admin@12345     |

## Run locally (no Docker for the app)
```bash
# terminal 1 – MongoDB (or use a local install)
docker run -d -p 27017:27017 mongo:7
# terminal 2
cd server && cp .env.example .env && npm install && npm run dev
# terminal 3
cd client && npm install && npm run dev      # http://localhost:5173
```

## How it works
1. **Auth**: JWT stored in an `httpOnly` cookie (JS can't read it). `/api/auth/me` restores the session on refresh.
2. **RBAC** (`server/src/middleware/auth.js` + `ProtectedRoute` on the client):
   - patient: chat, own history only
   - doctor: chat + view/add knowledge-base documents
   - admin: everything + user roles, user deletion, delete knowledge, stats
   Public sign-up always creates a patient; only an admin can promote.
3. **RAG** (`server/src/services/rag.js`): document -> LangChain splitter -> Gemini embeddings -> stored in MongoDB.
   On each question: embed it -> cosine similarity -> top passages -> LangChain prompt -> Gemini -> answer + sources.
4. **Safety**: emergency keywords skip the AI and show an urgent-care message; the prompt forbids diagnosis/prescriptions.
5. **Images**: attach a JPEG, PNG, or WebP (up to 5 MB) in chat to ask Gemini about visible details. Images are sent to the AI for the request and are not saved in conversation history.
6. **PWA**: in a supported browser, install MediAssist from the browser's install option. The app shell is cached for offline launch; sign-in, chat, and AI requests still need a network connection.

## Ideas to extend (good for your viva)
- Swap in-process similarity for MongoDB Atlas Vector Search
- Stream responses (SSE), PDF upload for the knowledge base, doctor review of flagged chats
- Set `COOKIE_SECURE=true` behind HTTPS in production
