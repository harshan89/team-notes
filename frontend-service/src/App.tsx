import { AuthPanel } from "./features/auth/AuthPanel";
import { NotesPanel } from "./features/notes/NotesPanel";
import { useAppSelector } from "./store";

export default function App() {
  const token = useAppSelector((s) => s.auth.token);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Soft animated background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-blob absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="animate-blob absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl [animation-delay:-6s]" />
        <div className="animate-blob absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl [animation-delay:-12s]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center gap-3 px-6 pt-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-lg shadow-lg shadow-violet-500/30">
          📝
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Team Notes</h1>
          <p className="text-xs text-slate-400">Meeting notes, shared with your team</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* key forces a fresh fade-in when switching between the two screens */}
        <div key={token ? "notes" : "auth"} className="animate-fade-up">
          {token ? <NotesPanel /> : <AuthPanel />}
        </div>
      </main>
    </div>
  );
}
