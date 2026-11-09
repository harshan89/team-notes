import { useEffect, useState } from "react";
import { roleInfo } from "../../components/teamStyles";
import { useAppDispatch, useAppSelector } from "../../store";
import { signedOut } from "./authSlice";

/** Who you're signed in as, when the token expires, and a way to switch. */
export function SessionBar() {
  const dispatch = useAppDispatch();
  const { token, teamId, role, expiresAt } = useAppSelector((s) => s.auth);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);

  // Tick every 15s; sign out when the token expires.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (expiresAt && now >= expiresAt) {
      dispatch(signedOut("Your session has expired. Pick your team and role again."));
    }
  }, [now, expiresAt, dispatch]);

  if (!token || !teamId || !role) return null;
  const minutesLeft = Math.max(0, Math.ceil(((expiresAt ?? now) - now) / 60_000));

  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10 backdrop-blur-xl">
      <team-badge team={teamId} size="md" />
      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-xs ring-1 ring-white/10">
        {roleInfo[role].icon} {roleInfo[role].title}
      </span>
      <span className="text-xs text-slate-400">Token expires in {minutesLeft} min</span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={copyToken}
          title="Copy the JWT (e.g. to paste into Swagger)"
          className="rounded-md px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          {copied ? "Copied ✓" : "Copy token"}
        </button>
        <button
          type="button"
          onClick={() => dispatch(signedOut())}
          className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium transition hover:bg-white/20"
        >
          Switch team
        </button>
      </div>
    </div>
  );
}
