import Navbar from './Navbar.jsx';

export default function Layout({ children }) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
