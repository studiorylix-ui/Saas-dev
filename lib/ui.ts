export const input = "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900";
export const btn = "rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white active:bg-indigo-700 disabled:opacity-40";
export const card = "rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900";
export const ago = (d: string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.round(m / 60)} h`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};
