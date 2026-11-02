import { NavLink, useNavigate } from 'react-router-dom';
import { HeartPulse, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const link = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink/70 hover:bg-brand-50'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink/10 bg-white px-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-serif text-lg font-semibold text-brand-700">
          <HeartPulse size={20} /> MediAssist
        </div>
        <nav className="flex gap-1">
          <NavLink to="/" end className={link}>Chat</NavLink>
          {['doctor', 'admin'].includes(user.role) && <NavLink to="/knowledge" className={link}>Knowledge base</NavLink>}
          {user.role === 'admin' && <NavLink to="/admin" className={link}>Admin</NavLink>}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-ink/60">{user.role}</div>
        </div>
        <button className="btn-ghost" onClick={async () => { await logout(); nav('/login'); }} aria-label="Log out">
          <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
