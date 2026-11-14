"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/client";
import { type Theme, getTheme, setTheme } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { btn, input } from "@/lib/ui";
import Avatar from "../Avatar";
import Header from "../Header";
import Icon from "../Icon";
import Segmented from "../Segmented";
import { ask } from "../Overlays";
import { useRefs } from "../Refs";

const THEMES: [Theme, string][] = [["system", "Auto"], ["light", "Clair"], ["dark", "Sombre"]];

// Compte : nom d'utilisateur, code (mot de passe), apparence, déconnexion.
export default function AccountScreen() {
  const { me, name } = useRefs();
  const current = name(me);
  const [user, setUser] = useState(current === "—" ? "" : current);
  const [seen, setSeen] = useState(current);
  if (current !== seen) { setSeen(current); if (current !== "—") setUser(current); } // profil chargé ou renommé
  const [code, setCode] = useState("");
  const [code2, setCode2] = useState("");
  const [busy, setBusy] = useState<"" | "user" | "code">("");
  const [theme, setT] = useState<Theme>(getTheme);

  const cleanUser = user.trim().toLowerCase();
  const userOk = /^[a-z0-9][a-z0-9_-]{1,19}$/.test(cleanUser) && cleanUser !== current;
  const codeOk = code.length >= 6 && code === code2;

  async function saveUser() {
    setBusy("user");
    const { error } = await sb().rpc("change_username", { new_name: cleanUser });
    setBusy("");
    if (error) toast(error.message);
    else toast(`Nom changé : connectez-vous désormais avec « ${cleanUser} »`);
  }
  async function saveCode() {
    setBusy("code");
    const { error } = await sb().auth.updateUser({ password: code });
    setBusy("");
    if (error) toast(error.message.includes("different") ? "Le nouveau code doit être différent de l'ancien." : "Impossible de changer le code.");
    else { setCode(""); setCode2(""); toast("Code mis à jour"); }
  }
  async function logout() {
    if (!(await ask({ title: "Se déconnecter de Rylix Hub ?", confirm: "Se déconnecter", danger: true }))) return;
    await sb().auth.signOut();
    window.location.replace("/login");
  }
  const pick = (t: Theme) => { setT(t); setTheme(t); };

  return (
    <>
      <Header title="Compte" />
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 pb-10">
        <div className="flex flex-col items-center pt-4 text-center">
          <Avatar name={current} size={76} />
          <div className="mt-3 text-[22px] font-semibold tracking-[-0.02em]">{current}</div>
          <div className="text-[13px] text-muted">Membre de l&apos;équipe</div>
        </div>

        <section className="space-y-2">
          <h2 className="px-1 text-[13px] font-medium text-muted">Apparence</h2>
          <div className="group-card p-3">
            <Segmented options={THEMES} value={theme} onChange={pick} />
            <p className="mt-2 px-1 text-[12.5px] text-muted">« Auto » suit le réglage clair/sombre de l&apos;iPhone.</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-[13px] font-medium text-muted">Nom d&apos;utilisateur</h2>
          <div className="group-card space-y-3 p-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-muted">@</span>
              <input className={`${input} pl-8`} autoCapitalize="none" autoCorrect="off" spellCheck={false} value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
            <p className="px-1 text-[12.5px] text-muted">2 à 20 caractères : lettres, chiffres, - ou _. Il sert à vous connecter et à vous mentionner.</p>
            <button className={`${btn} w-full`} disabled={!userOk || busy !== ""} onClick={saveUser}>{busy === "user" ? "…" : "Enregistrer le nom"}</button>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-[13px] font-medium text-muted">Code de connexion</h2>
          <div className="group-card space-y-3 p-3">
            <input className={input} type="password" autoComplete="new-password" placeholder="Nouveau code (6 caractères min.)" value={code} onChange={(e) => setCode(e.target.value)} />
            <input className={input} type="password" autoComplete="new-password" placeholder="Confirmer le code" value={code2} onChange={(e) => setCode2(e.target.value)} />
            {code2 && code !== code2 && <p className="px-1 text-[12.5px] text-danger">Les deux codes ne correspondent pas.</p>}
            <button className={`${btn} w-full`} disabled={!codeOk || busy !== ""} onClick={saveCode}>{busy === "code" ? "…" : "Changer le code"}</button>
          </div>
        </section>

        <button onClick={logout} className="tap group-card flex h-12 w-full items-center justify-center gap-2 text-[16px] font-medium text-danger">
          <Icon name="back" size={18} />Se déconnecter
        </button>
      </div>
    </>
  );
}
