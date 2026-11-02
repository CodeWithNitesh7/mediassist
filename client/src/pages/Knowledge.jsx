import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Knowledge() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = () => api.get('/knowledge').then((r) => setDocs(r.data.documents));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      const { data } = await api.post('/knowledge', form);
      setMsg({ type: 'ok', text: `Added "${data.document.title}" (${data.document.chunkCount} passages indexed).` });
      setForm({ title: '', content: '' });
      load();
    } catch (err) {
      setMsg({ type: 'err', text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => { await api.delete(`/knowledge/${id}`); load(); };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
        <form onSubmit={add} className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold">Add medical knowledge</h2>
          <p className="text-sm text-ink/70">Text you add here is split into passages and indexed, so the assistant can cite it when answering patients.</p>
          <input className="field" placeholder="Title, e.g. Managing asthma attacks" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="field min-h-[220px]" placeholder="Paste vetted guidance here…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          {msg.text && <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${msg.type === 'ok' ? 'bg-brand-50 text-brand-700' : 'bg-orange-50 text-alert'}`}>{msg.text}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? 'Indexing…' : 'Add to knowledge base'}</button>
        </form>

        <div>
          <h2 className="font-serif text-2xl font-semibold">Indexed documents</h2>
          <ul className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
            {docs.length === 0 && <li className="p-4 text-sm text-ink/60">Nothing indexed yet. Add your first document.</li>}
            {docs.map((d) => (
              <li key={d._id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{d.title}</div>
                  <div className="text-xs text-ink/60">{d.chunkCount} passages{d.createdBy?.name ? `, added by ${d.createdBy.name}` : ''}</div>
                </div>
                {user.role === 'admin' && (
                  <button className="btn-danger !px-2" onClick={() => remove(d._id)} aria-label={`Delete ${d.title}`}><Trash2 size={16} /></button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
