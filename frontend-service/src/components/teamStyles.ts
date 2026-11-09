// One accent colour per team, used on the sign-in tiles (badges: see team-badge.ts).
export const teamStyles: Record<string, { label: string; dot: string; ring: string; glow: string }> = {
  "team-1": {
    label: "Team 1",
    dot: "bg-violet-400",
    ring: "ring-violet-400",
    glow: "from-violet-500/30",
  },
  "team-2": {
    label: "Team 2",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400",
    glow: "from-emerald-500/30",
  },
  "team-3": {
    label: "Team 3",
    dot: "bg-amber-400",
    ring: "ring-amber-400",
    glow: "from-amber-500/30",
  },
};

export const roleInfo: Record<string, { icon: string; title: string; description: string }> = {
  admin: { icon: "👑", title: "Admin", description: "All teams · deletes own" },
  editor: { icon: "✏️", title: "Editor", description: "Own team · can add" },
  viewer: { icon: "👀", title: "Viewer", description: "Own team · read only" },
};
