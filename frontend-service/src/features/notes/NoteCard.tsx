import type { Note } from "../../api";
import { Spinner } from "../../components/Spinner";
import { useAppDispatch, useAppSelector } from "../../store";
import { deleteRequested } from "./notesSlice";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function NoteCard({ note, index }: { note: Note; index: number }) {
  const dispatch = useAppDispatch();
  // Admins can delete their own team's notes only (the API enforces this too).
  const canDelete = useAppSelector((s) => s.auth.role === "admin" && s.auth.teamId === note.teamId);
  const deleting = useAppSelector((s) => s.notes.deletingIds.includes(note.id));

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className={`animate-fade-up group relative rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-black/30 ${
        deleting ? "scale-95 opacity-40" : ""
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <team-badge team={note.teamId} />
        <time className="text-[11px] text-slate-500">{formatDate(note.createdAt)}</time>

        {canDelete && (
          <button
            type="button"
            disabled={deleting}
            title="Delete note"
            aria-label={`Delete "${note.title}"`}
            onClick={() => confirm(`Delete "${note.title}"?`) && dispatch(deleteRequested(note.id))}
            className="ml-auto grid h-6 w-6 place-items-center rounded-md text-xs text-rose-300 opacity-0 transition hover:bg-rose-500/15 focus:opacity-100 group-hover:opacity-100"
          >
            {deleting ? <Spinner className="h-3 w-3" /> : "🗑"}
          </button>
        )}
      </div>

      <h3 className="text-sm font-semibold leading-snug">{note.title}</h3>
      {note.content ? (
        <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-slate-300">{note.content}</p>
      ) : (
        <p className="mt-1 text-[13px] italic text-slate-500">No details</p>
      )}
    </article>
  );
}
