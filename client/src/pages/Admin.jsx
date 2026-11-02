import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Admin() {
  const { user: me } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admin/stats').then((r) => setStats(r.data));
    api.get('/admin/users').then((r) => setUsers(r.data.users));
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    setError('');
    try { await api.patch(`/admin/users/${id}/role`, { role }); load(); } catch (e) { setError(errMsg(e)); }
  };
  const remove = async (u) => {
    if (!confirm(`Delete ${u.name} and all their chats?`)) return;
    setError('');
    try { await api.delete(`/admin/users/${u._id}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h2 className="font-serif text-2xl font-semibold">Admin</h2>

        {stats && (
          <dl className="grid grid-cols-3 gap-4">
            {[['Users', stats.users], ['Conversations', stats.conversations], ['Knowledge documents', stats.documents]].map(([label, n]) => (
              <div key={label} className="rounded-xl border border-ink/10 bg-white p-4">
                <dt className="text-sm text-ink/60">{label}</dt>
                <dd className="font-serif text-3xl font-semibold text-brand-700">{n}</dd>
              </div>
            ))}
          </dl>
        )}

        {error && <p role="alert" className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-alert">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-ink/60">
              <tr><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Email</th><th className="p-3 font-medium">Role</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="p-3 font-semibold">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select className="field !w-auto" value={u.role} disabled={u._id === me.id} onChange={(e) => changeRole(u._id, e.target.value)} aria-label={`Role for ${u.name}`}>
                      <option value="patient">patient</option>
                      <option value="doctor">doctor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    {u._id !== me.id && <button className="btn-danger !px-2" onClick={() => remove(u)} aria-label={`Delete ${u.name}`}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
