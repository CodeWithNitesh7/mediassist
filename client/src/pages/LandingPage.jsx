import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  HeartPulse,
  ImagePlus,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

function InstallAppButton({ className = '' }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isInstalled = () =>
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setInstalled(isInstalled());

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (installed) {
      setShowInstructions((visible) => !visible);
      return;
    }
    if (!installPrompt) {
      setShowInstructions((visible) => !visible);
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === 'accepted') setInstalled(true);
    else setShowInstructions(true);
  };

  return (
    <div className="relative">
      <button type="button" onClick={install} className={className}>
        {installed ? <Check size={17} /> : <ArrowDownToLine size={17} />}
        {installed ? 'App installed' : 'Download app'}
      </button>
      {showInstructions && (
        <div
          role="status"
          className="absolute right-0 top-full z-20 mt-3 w-72 rounded-2xl border border-ink/10 bg-white p-4 text-left text-sm text-ink shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">Add MediAssist to your device</p>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="text-ink/50 hover:text-ink"
              aria-label="Close install instructions"
            >
              ×
            </button>
          </div>
          <p className="mt-2 leading-relaxed text-ink/70">
            Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
            On iPhone or iPad, use Share, then Add to Home Screen.
          </p>
        </div>
      )}
    </div>
  );
}

const features = [
  {
    icon: MessageCircle,
    title: 'Ask in your own words',
    description: 'Get clear, approachable information about everyday health questions and healthy habits.',
  },
  {
    icon: ImagePlus,
    title: 'Ask about an image',
    description: 'Share a photo and ask what is visible. Images are sent for analysis, not saved to chat history.',
  },
  {
    icon: ShieldCheck,
    title: 'Thoughtful, safer guidance',
    description: 'Answers are general information, with clear reminders to seek professional care when appropriate.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-paper text-ink">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-brand-700">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm">
            <HeartPulse size={22} />
          </span>
          MediAssist
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-ink/75 transition hover:bg-white sm:px-4">
            Log in
          </Link>
          <InstallAppButton className="btn-primary !rounded-full !px-3 !py-2 sm:!px-4" />
          <Link to="/register" className="hidden rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold transition hover:border-brand-500 sm:inline-flex">
            Sign up
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pb-28 lg:pt-20">
          <div className="pointer-events-none absolute -left-48 top-0 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="relative z-[1]">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-brand-700 shadow-sm">
              <Sparkles size={14} /> A little more clarity, whenever you need it
            </div>
            <h1 className="mt-6 max-w-2xl font-serif text-5xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Health questions deserve <span className="text-brand-600">clear answers.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">
              Get calm, easy-to-understand health information. Ask a question, share an image, and take a more informed next step.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary !rounded-full !px-6 !py-3">
                Get started <ArrowRight size={17} />
              </Link>
              <InstallAppButton className="btn !rounded-full border border-ink/10 bg-white !px-5 !py-3 text-ink shadow-sm hover:border-brand-500 hover:text-brand-700" />
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-ink/55">
              <ShieldCheck size={16} className="text-brand-600" />
              Private sign-in · Images aren’t saved to chat history
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
            <div className="absolute -right-7 -top-8 h-40 w-40 rounded-full bg-[#dbeee7] blur-2xl" />
            <div className="absolute -bottom-8 -left-5 h-44 w-44 rounded-full bg-[#f2e9d8] blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/80 bg-white/75 p-3 shadow-[0_30px_90px_-40px_rgba(9,82,80,0.35)] backdrop-blur">
              <div className="overflow-hidden rounded-[1.5rem] bg-paper">
                <div className="flex items-center justify-between border-b border-ink/5 bg-white px-5 py-4">
                  <div className="flex items-center gap-2 font-serif font-semibold text-brand-700">
                    <HeartPulse size={18} /> Your health chat
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-ink/50">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready to help
                  </span>
                </div>
                <div className="space-y-4 p-5 sm:p-7">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-ink/5 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-brand-700">YOU</p>
                    <p className="mt-1 text-sm leading-6">Can you tell me what you notice in this picture?</p>
                    <div className="mt-3 flex h-28 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#d8ebe5] via-[#f2e9d8] to-[#e9d9cf] text-brand-700/70">
                      <ImagePlus size={27} />
                      <span className="text-xs font-medium">Image attached</span>
                    </div>
                  </div>
                  <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-md bg-brand-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand-700">
                      <Sparkles size={14} /> MEDIASSIST
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/80">
                      I can share general information about visible details. A photo alone can’t confirm a diagnosis.
                    </p>
                    <div className="mt-3 flex items-center gap-2 border-t border-brand-100 pt-3 text-xs text-ink/55">
                      <Stethoscope size={14} /> A clinician can give advice tailored to you.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-3 text-xs text-ink/40 shadow-sm">
                    Ask a health question… <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white"><ArrowRight size={14} /></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-5 top-1/2 hidden -translate-y-1/2 items-center gap-2 rounded-2xl border border-white bg-white px-4 py-3 text-sm font-semibold shadow-lg sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><ShieldCheck size={17} /></span>
              Here when you need clarity
            </div>
          </div>
        </section>

        <section className="border-y border-ink/5 bg-white/75">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Made for everyday questions</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">A more helpful place to start.</h2>
              <p className="mt-3 leading-7 text-ink/65">Simple tools to help you understand general health information—without replacing care from a medical professional.</p>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="rounded-3xl border border-ink/8 bg-paper/70 p-6 transition hover:-translate-y-1 hover:border-brand-100 hover:shadow-lg">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${index === 1 ? 'bg-[#f4ead8] text-[#9b6b22]' : 'bg-brand-50 text-brand-700'}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="flex flex-col justify-between gap-8 rounded-[2rem] bg-brand-700 p-7 text-white sm:p-10 lg:flex-row lg:items-center lg:p-12">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-100">Start at your own pace</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">A little clarity can make the next step easier.</h2>
              <p className="mt-3 max-w-xl leading-7 text-brand-100">Create an account to ask your question and keep your conversations together.</p>
            </div>
            <Link to="/register" className="btn shrink-0 self-start !rounded-full bg-white !px-6 !py-3 text-brand-700 hover:bg-brand-50 lg:self-center">
              Create your account <ArrowRight size={17} />
            </Link>
          </div>
          <footer className="flex flex-col gap-3 py-7 text-xs text-ink/50 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5"><HeartPulse size={14} className="text-brand-600" /> MediAssist</p>
            <p>General information only—not medical advice. For emergencies, contact local emergency services.</p>
          </footer>
        </section>
      </main>
    </div>
  );
}
