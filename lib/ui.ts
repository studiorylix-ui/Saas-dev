// Système visuel : fond #FAFAFA, surfaces blanches, bordures 1px #EDEDED, accent noir, coins ≤ 12px.
const ease = "transition-colors duration-150 ease-out";
export const input = `w-full h-11 rounded-[10px] border border-line bg-surface px-3 text-[16px] text-ink placeholder:text-muted/60 outline-none ${ease} focus:border-neutral-400`;
export const area = `w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[16px] leading-snug text-ink placeholder:text-muted/60 outline-none ${ease} focus:border-neutral-400`;
export const sel = `h-9 rounded-lg border border-line bg-surface px-2.5 text-[14px] text-ink outline-none ${ease} focus:border-neutral-400`;
export const btn = `inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-accent px-4 text-[15px] font-medium text-white transition-opacity duration-150 ease-out active:opacity-80 disabled:opacity-25`;
export const ghost = `inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[14px] text-muted ${ease} active:bg-black/[.05]`;
export const iconBtn = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-ink ${ease} active:bg-black/[.05]`;
export const plain = `h-9 max-w-[58vw] truncate rounded-lg bg-transparent px-2 text-right text-[14px] text-ink outline-none [text-align-last:right] ${ease} active:bg-black/[.05]`;
export const card = "rounded-xl border border-line bg-surface p-3.5";
export const pill = (on: boolean) => `inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-[13px] ${ease} ${on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink active:bg-subtle"}`;
export const seg = "flex h-9 rounded-[10px] bg-black/[.045] p-[3px] text-[13px]";
export const segItem = (on: boolean) => `flex-1 rounded-[8px] px-3 ${ease} ${on ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_#e8e8e8]" : "text-muted"}`;
export const section = "text-[12px] font-medium uppercase tracking-[.06em] text-muted";
export const tag = "inline-flex h-[22px] items-center gap-1 rounded-md border border-line bg-surface px-1.5 text-[12px] text-muted";

export const PRIORITIES = ["Aucune", "Basse", "Moyenne", "Haute", "Urgente"];
export const PCOLOR = ["#b5b5b5", "#8a8a8a", "#d08a1c", "#e2611f", "#d93636"];
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
