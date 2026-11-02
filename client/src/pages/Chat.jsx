import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, BookOpen, ImagePlus, Plus, Send, Trash2, X } from 'lucide-react';
import api, { errMsg } from '../api.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const SUGGESTIONS = [
  'How do I treat a minor burn at home?',
  'What lifestyle changes help with high blood pressure?',
  'When should I worry about a fever?',
];

function Message({ m }) {
  const mine = m.role === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          mine
            ? 'bg-brand-500 text-white'
            : m.emergency
            ? 'border border-alert/40 bg-orange-50 text-ink'
            : 'border border-ink/10 bg-white'
        }`}
      >
        {m.image && (
          <img
            src={m.image}
            alt="Image attached to the health question"
            className="mb-2 max-h-64 max-w-full rounded-lg object-contain"
          />
        )}
        {m.emergency && (
          <div className="mb-2 flex items-center gap-2 font-semibold text-alert"><AlertTriangle size={16} /> Urgent</div>
        )}
        <div className="prose-chat"><ReactMarkdown>{m.content}</ReactMarkdown></div>
        {m.sources?.length > 0 && (
          <details className="mt-3 border-t border-ink/10 pt-2 text-xs text-ink/70">
            <summary className="flex cursor-pointer items-center gap-1 font-semibold">
              <BookOpen size={13} /> Based on {m.sources.length} knowledge-base {m.sources.length === 1 ? 'entry' : 'entries'}
            </summary>
            <ul className="mt-2 space-y-2">
              {m.sources.map((s, i) => (
                <li key={i}><span className="font-semibold">{s.title}</span><br />{s.snippet}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef(null);
  const imageInput = useRef(null);

  const loadList = () => api.get('/chat/conversations').then((r) => setConvos(r.data.conversations));
  useEffect(() => { loadList(); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const open = async (id) => {
    setError('');
    setAttachment(null);
    setActiveId(id);
    const { data } = await api.get(`/chat/conversations/${id}`);
    setMessages(data.conversation.messages);
  };
  const newChat = () => { setActiveId(null); setMessages([]); setAttachment(null); setError(''); };
  const remove = async (id) => {
    await api.delete(`/chat/conversations/${id}`);
    if (id === activeId) newChat();
    loadList();
  };

  const send = async (text) => {
    const msg = (text ?? input).trim();
    const selectedImage = attachment;
    if ((!msg && !selectedImage) || sending) return;
    setInput('');
    setAttachment(null);
    setError('');
    setMessages((m) => [...m, {
      role: 'user',
      content: msg || 'Image attached (not stored)',
      image: selectedImage?.dataUrl,
    }]);
    setSending(true);
    try {
      const { data } = await api.post('/chat', {
        conversationId: activeId,
        message: msg,
        image: selectedImage
          ? {
              mimeType: selectedImage.file.type,
              data: selectedImage.dataUrl.split(',')[1],
            }
          : undefined,
      });
      setActiveId(data.conversationId);
      setMessages((m) => [...m, data.reply]);
      loadList();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSending(false);
    }
  };

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Images must be 5 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setError('The selected image could not be read.');
        return;
      }
      setAttachment({ file, dataUrl: reader.result });
      setError('');
    };
    reader.onerror = () => setError('The selected image could not be read.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink/10 bg-white md:flex">
        <div className="p-3"><button className="btn-primary w-full" onClick={newChat}><Plus size={16} /> New chat</button></div>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {convos.length === 0 && <li className="px-2 py-3 text-sm text-ink/60">Your past chats will appear here.</li>}
          {convos.map((c) => (
            <li key={c._id} className={`group flex items-center rounded-lg ${c._id === activeId ? 'bg-brand-50' : 'hover:bg-brand-50/60'}`}>
              <button className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm" onClick={() => open(c._id)}>{c.title}</button>
              <button className="p-2 text-ink/40 opacity-0 hover:text-alert group-hover:opacity-100 focus:opacity-100" onClick={() => remove(c._id)} aria-label="Delete chat">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.length === 0 && (
              <div className="pt-10">
                <h2 className="font-serif text-3xl font-semibold">What would you like to know?</h2>
                <p className="mt-2 text-ink/70">Ask a health question in your own words.</p>
                <div className="mt-6 flex flex-col items-start gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm hover:border-brand-500 hover:text-brand-700" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => <Message key={i} m={m} />)}
            {sending && <div className="text-sm text-ink/60">MediAssist is thinking…</div>}
            {error && <p role="alert" className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-alert">{error}</p>}
            <div ref={bottom} />
          </div>
        </div>

        <div className="border-t border-ink/10 bg-white p-3">
          {attachment && (
            <div className="mx-auto mb-2 flex max-w-3xl items-center gap-3 rounded-lg border border-ink/10 p-2">
              <img src={attachment.dataUrl} alt="Selected image preview" className="h-14 w-14 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink/70">{attachment.file.name}</span>
              <button
                type="button"
                className="btn-ghost px-2"
                onClick={() => setAttachment(null)}
                aria-label="Remove selected image"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <form className="mx-auto flex max-w-3xl gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input
              ref={imageInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={selectImage}
              aria-label="Choose an image"
            />
            <button
              type="button"
              className="btn-ghost shrink-0 px-3"
              onClick={() => imageInput.current?.click()}
              disabled={sending}
              aria-label="Attach an image"
              title="Attach an image"
            >
              <ImagePlus size={18} />
            </button>
            <input className="field min-w-0" placeholder="Ask a question or attach an image…" value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} />
            <button className="btn-primary shrink-0" disabled={sending || (!input.trim() && !attachment)}><Send size={16} /> Send</button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-xs text-ink/50">JPEG, PNG, or WebP up to 5 MB. Images are sent for analysis but not saved. General information only, not medical advice. In an emergency, call your local emergency number.</p>
        </div>
      </section>
    </div>
  );
}
