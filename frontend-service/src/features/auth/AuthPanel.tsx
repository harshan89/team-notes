import { useState } from "react";
import { ROLES, Role, Team, TEAMS } from "../../api";
import { Spinner } from "../../components/Spinner";
import { roleInfo, teamStyles } from "../../components/teamStyles";
import { useAppDispatch, useAppSelector } from "../../store";
import { tokenRequested } from "./authSlice";

export function AuthPanel() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [team, setTeam] = useState<Team | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const ready = team && role && !loading;

  return (
    <section className="mx-auto max-w-lg">
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Who are you today?</h2>
        <p className="mt-1 text-sm text-slate-400">Pick your team and role to get an access token.</p>
      </div>

      <div className="rounded-2xl bg-white/[0.04] p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
        {error && (
          <div className="animate-scale-in mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">
            {error}
          </div>
        )}

        <Step number={1} title="Team" />
        <div className="grid grid-cols-3 gap-2">
          {TEAMS.map((t, i) => {
            const style = teamStyles[t];
            const selected = team === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTeam(t)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`animate-fade-up group relative flex items-center gap-2 overflow-hidden rounded-xl bg-white/[0.03] px-3 py-2.5 text-left text-sm font-medium ring-1 transition duration-200 hover:bg-white/[0.06] ${
                  selected ? `ring-2 ${style.ring}` : "ring-white/10"
                }`}
              >
                <span
                  className={`absolute inset-0 bg-gradient-to-br ${style.glow} to-transparent opacity-0 transition-opacity duration-300 ${
                    selected ? "opacity-100" : "group-hover:opacity-60"
                  }`}
                />
                <span className={`relative h-2 w-2 rounded-full ${style.dot}`} />
                <span className="relative">{style.label}</span>
              </button>
            );
          })}
        </div>

        <Step number={2} title="Role" className="mt-4" />
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r, i) => {
            const info = roleInfo[r];
            const selected = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{ animationDelay: `${180 + i * 60}ms` }}
                className={`animate-fade-up rounded-xl px-3 py-2.5 text-left ring-1 transition duration-200 ${
                  selected ? "bg-sky-500/10 ring-2 ring-sky-400" : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <span>{info.icon}</span> {info.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-400">{info.description}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={() => team && role && dispatch(tokenRequested({ teamId: team, role }))}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? (
            <>
              <Spinner /> Generating token…
            </>
          ) : (
            "Generate token & open notes →"
          )}
        </button>
      </div>
    </section>
  );
}

function Step({ number, title, className = "" }: { number: number; title: string; className?: string }) {
  return (
    <div className={`mb-2 flex items-center gap-2 ${className}`}>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[11px] font-semibold">{number}</span>
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</h3>
    </div>
  );
}
