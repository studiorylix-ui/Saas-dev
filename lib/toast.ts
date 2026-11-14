// Petits messages en haut d'écran (affichés par <Toasts />), avec une action facultative (« Annuler »).
type Toast = { id: number; text: string; action?: { label: string; run: () => void } };
let items: Toast[] = [];
const subs = new Set<() => void>();
const notify = () => subs.forEach((l) => l());
export const toastSubscribe = (l: () => void) => { subs.add(l); return () => { subs.delete(l); }; };
export const toastItems = () => items;
export const dismissToast = (id: number) => { items = items.filter((t) => t.id !== id); notify(); };
export function toast(text: string, action?: Toast["action"], ms = 3200) {
  const id = Date.now() + Math.random();
  items = [...items.slice(-2), { id, text, action }];
  notify();
  setTimeout(() => dismissToast(id), ms);
}
