// Petits messages d'erreur/info en haut d'écran (affichés par <Toasts />).
type Toast = { id: number; text: string };
let items: Toast[] = [];
const subs = new Set<() => void>();
export const toastSubscribe = (l: () => void) => { subs.add(l); return () => { subs.delete(l); }; };
export const toastItems = () => items;
export function toast(text: string) {
  const id = Date.now() + Math.random();
  items = [...items, { id, text }];
  subs.forEach((l) => l());
  setTimeout(() => { items = items.filter((t) => t.id !== id); subs.forEach((l) => l()); }, 3200);
}
