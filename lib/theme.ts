// Apparence : « system » suit l'iPhone, sinon clair/sombre forcé. Préférence gardée sur l'appareil.
export type Theme = "system" | "light" | "dark";
export const getTheme = (): Theme => { try { return (localStorage.getItem("theme") as Theme) || "system"; } catch { return "system"; } };
export function setTheme(t: Theme) {
  try { localStorage.setItem("theme", t); } catch {}
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}
// Appliqué avant le premier rendu (script en ligne dans <head>) pour éviter un flash de la mauvaise couleur.
export const themeBoot = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
