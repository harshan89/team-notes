import { useState } from "react";
import { SessionBar } from "../auth/SessionBar";
import { useAppDispatch, useAppSelector } from "../../store";
import { NoteCard } from "./NoteCard";
import { NoteForm } from "./NoteForm";
import { errorDismissed, fetchRequested } from "./notesSlice";

export function NotesPanel() {
  const dispatch = useAppDispatch();
  const { items, query, loading, error } = useAppSelector((s) => s.notes);
  const role = useAppSelector((s) => s.auth.role);
  const [showForm, setShowForm] = useState(false);
  const canCreate = role !== "viewer"; // viewers are read-only

  return (
    <section className="space-y-4">
      <SessionBar />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Notes <span className="ml-1 text-sm font-normal text-slate-500">{items.length}</span>
          </h2>
          <p className="text-sm text-slate-400">
            {role === "admin" ? "Showing notes from every team." : "Showing notes from your team."}
            {!canCreate && " You have read-only access."}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
            <input
              value={query}
              onChange={(e) => dispatch(fetchRequested(e.target.value))}
              placeholder="Search notes…"
              className="w-full rounded-lg bg-white/5 py-2 pl-9 pr-3 text-sm ring-1 ring-white/10 transition placeholder:text-slate-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-gradient-to-r from-violet-500 to-sky-500 px-3.5 py-2 text-sm font-semibold shadow-lg shadow-violet-500/20 transition hover:brightness-110 active:scale-95"
            >
              {showForm ? "Close" : "+ New note"}
            </button>
          )}
        </div>
      </div>

      {canCreate && showForm && <NoteForm onDone={() => setShowForm(false)} />}

      {error && (
        <div className="animate-scale-in flex items-center justify-between gap-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
          <span>{error}</span>
          <button type="button" onClick={() => dispatch(errorDismissed())} className="text-rose-200 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <EmptyState searching={!!query} onCreate={canCreate ? () => setShowForm(true) : undefined} />
      ) : (
        <div
          className={`grid gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`}
        >
          {items.map((note, i) => (
            <NoteCard key={note.id} note={note} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-shimmer h-28 rounded-xl bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.08),rgba(255,255,255,0.03))] bg-[length:200%_100%] ring-1 ring-white/10"
        />
      ))}
    </div>
  );
}

function EmptyState({ searching, onCreate }: { searching: boolean; onCreate?: () => void }) {
  return (
    <div className="animate-scale-in rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
      <div className="text-3xl">{searching ? "🔍" : "🗒️"}</div>
      <h3 className="mt-3 font-medium">{searching ? "No matching notes" : "No notes yet"}</h3>
      <p className="mt-1 text-sm text-slate-400">
        {searching
          ? "Try a different search."
          : onCreate
            ? "Capture your first meeting note for the team."
            : "Your team hasn't added any notes yet."}
      </p>
      {!searching && onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 rounded-lg bg-white/10 px-3.5 py-1.5 text-sm font-medium transition hover:bg-white/20"
        >
          + New note
        </button>
      )}
    </div>
  );
}
