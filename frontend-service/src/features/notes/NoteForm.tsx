import { FormEvent, useEffect, useRef, useState } from "react";
import { Spinner } from "../../components/Spinner";
import { useAppDispatch, useAppSelector } from "../../store";
import { createRequested } from "./notesSlice";

export function NoteForm({ onDone }: { onDone: () => void }) {
  const dispatch = useAppDispatch();
  const creating = useAppSelector((s) => s.notes.creating);
  const error = useAppSelector((s) => s.notes.error);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const submitted = useRef(false);

  // Close the form once the note has been saved.
  useEffect(() => {
    if (submitted.current && !creating) {
      submitted.current = false;
      if (!error) onDone();
    }
  }, [creating, error, onDone]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    submitted.current = true;
    dispatch(createRequested({ title: title.trim(), content: content.trim() }));
  };

  return (
    <form
      onSubmit={submit}
      className="animate-scale-in space-y-2 rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10 backdrop-blur-xl"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Meeting title, e.g. Sprint 14 planning"
        className="w-full bg-transparent font-medium placeholder:text-slate-500 focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Decisions, owners, action items…"
        className="w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!title.trim() || creating}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 active:scale-95 disabled:opacity-40"
        >
          {creating && <Spinner />} Save note
        </button>
      </div>
    </form>
  );
}
