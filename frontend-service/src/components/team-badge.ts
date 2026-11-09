/**
 * <team-badge team="team-1" size="sm|md"></team-badge>
 *
 * A framework-free Web Component: a coloured pill with the team's name.
 * Styles live in its Shadow DOM, so it looks the same in any page or framework.
 */
const TEAMS: Record<string, { label: string; rgb: string; text: string }> = {
  "team-1": { label: "Team 1", rgb: "139 92 246", text: "#c4b5fd" }, // violet
  "team-2": { label: "Team 2", rgb: "16 185 129", text: "#6ee7b7" }, // emerald
  "team-3": { label: "Team 3", rgb: "245 158 11", text: "#fcd34d" }, // amber
};
const UNKNOWN = { rgb: "148 163 184", text: "#cbd5e1" }; // slate, for any other team id

const styles = `
  :host { display: inline-flex; vertical-align: middle; }
  .badge {
    display: inline-flex; align-items: center; gap: 0.3em;
    padding: 0.125rem 0.5rem; border-radius: 9999px;
    font-family: inherit; font-size: 11px; font-weight: 500; line-height: 1.4;
    color: var(--text);
    background: rgb(var(--rgb) / 0.15);
    box-shadow: inset 0 0 0 1px rgb(var(--rgb) / 0.3);
    white-space: nowrap;
  }
  .dot { width: 6px; height: 6px; border-radius: 9999px; background: rgb(var(--rgb)); }
  :host([size="md"]) .badge { font-size: 12px; padding: 0.125rem 0.625rem; gap: 0.4em; }
  :host([size="md"]) .dot { width: 8px; height: 8px; }
`;

export class TeamBadge extends HTMLElement {
  static observedAttributes = ["team"];

  private label: HTMLSpanElement;
  private badge: HTMLSpanElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${styles}</style><span class="badge" part="badge"><span class="dot"></span><span class="label"></span></span>`;
    this.badge = root.querySelector(".badge")!;
    this.label = root.querySelector(".label")!;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  private render() {
    const id = this.getAttribute("team") ?? "";
    const team = TEAMS[id];
    const { rgb, text } = team ?? UNKNOWN;
    this.badge.style.setProperty("--rgb", rgb);
    this.badge.style.setProperty("--text", text);
    this.label.textContent = team?.label ?? id;
  }
}

if (!customElements.get("team-badge")) customElements.define("team-badge", TeamBadge);

// Lets TSX use <team-badge> with type-checked attributes.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "team-badge": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        team: string;
        size?: "sm" | "md";
      };
    }
  }
}
