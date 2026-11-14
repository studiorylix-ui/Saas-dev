"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase/client";
import { btn, input } from "@/lib/ui";

// Connexion par code à 6 chiffres reçu par email (fiable dans Safari comme en app installée).
export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function send() {
    setErr("");
    const { error } = await sb().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) setErr("Email non invité ou erreur d'envoi."); else setSent(true);
  }
  async function verify() {
    setErr("");
    const { error } = await sb().auth.verifyOtp({ email, token: code, type: "email" });
    if (error) setErr("Code invalide."); else { router.replace("/chat"); router.refresh(); }
  }

  return (
    <main className="mx-auto flex h-dvh max-w-sm flex-col justify-center gap-3 px-6">
      <h1 className="text-2xl font-bold">Rylix Hub</h1>
      <p className="text-sm text-neutral-500">Espace privé de l&apos;équipe.</p>
      <input className={input} type="email" inputMode="email" autoComplete="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} />
      {sent && <input className={input} inputMode="numeric" autoComplete="one-time-code" placeholder="code reçu par email" value={code} onChange={(e) => setCode(e.target.value)} />}
      <button className={btn} onClick={sent ? verify : send} disabled={!email || (sent && !code)}>{sent ? "Se connecter" : "Recevoir un code"}</button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </main>
  );
}
