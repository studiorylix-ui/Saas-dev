// Système visuel : fond #FAFAFA, surfaces blanches, bordures 1px #EDEDED, accent noir, coins ≤ 12px.
const ease = "transition-colors duration-150 ease-out";
export const input = `w-full h-11 rounded-[12px] bg-surface px-3.5 text-[16px] text-ink placeholder:text-muted/70 outline-none shadow-card ${ease} focus:ring-4 focus:ring-ink/[.06]`;
export const area = `w-full rounded-[20px] bg-surface px-4 py-2.5 text-[16px] leading-snug text-ink placeholder:text-muted/70 outline-none shadow-card ${ease} focus:ring-4 focus:ring-ink/[.06]`;
export const sel = `h-9 rounded-[10px] bg-surface px-2.5 text-[14px] text-ink outline-none shadow-card ${ease}`;
export const plain = `h-9 max-w-[58vw] truncate rounded-[10px] bg-transparent px-2 text-right text-[15px] text-ink outline-none [text-align-last:right] ${ease} active:bg-fill`;
export const btn = `tap btn-light inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[12px] px-4 text-[15px] font-semibold text-on-accent disabled:opacity-30`;
export const ghost = `tap inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-2.5 text-[14px] text-muted ${ease} active:bg-fill`;
export const iconBtn = `tap inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink ${ease} active:bg-fill`;
export const card = "group-card p-4";
export const pill = (on: boolean) => `tap inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] ${ease} ${on ? "bg-accent text-on-accent shadow-card" : "bg-surface text-ink shadow-card"}`;
export const seg = "flex h-9 rounded-[12px] bg-fill p-[3px] text-[13px]";
export const segItem = (on: boolean) => `flex-1 rounded-[9px] px-3 transition-all duration-200 ease-out ${on ? "bg-elevated font-semibold text-ink shadow-card" : "text-muted"}`;
export const section = "px-1 text-[13px] font-medium text-muted";
export const tag = "inline-flex h-[22px] items-center gap-1 rounded-full bg-fill px-2 text-[12px] text-muted";

export const PRIORITIES = ["Aucune", "Basse", "Moyenne", "Haute", "Urgente"];
export const PCOLOR = ["#aeaeb2", "#8e8e93", "#ff9f0a", "#ff6b00", "#ff3b30"];
export const STAGES = ["prospect", "devis", "négociation", "gagnée", "perdue"];
export const STAGE_PROB: Record<string, number> = { prospect: 0.1, devis: 0.3, négociation: 0.6, gagnée: 1, perdue: 0 };
export const PROJECT_STATUS = ["idée", "en cours", "en pause", "terminé"];
export const ago = (d: string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "maintenant";
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.round(m / 60)} h`;
  if (m < 10080) return `${Math.round(m / 1440)} j`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};
export const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "");
export const overdue = (d: string | null) => !!d && new Date(d) < new Date(new Date().toDateString());
export const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
