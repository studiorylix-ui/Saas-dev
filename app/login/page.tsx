"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase/client";
import { btn, input } from "@/lib/ui";

// Connexion email + mot de passe (comptes créés par l'admin dans Supabase > Authentication > Users).
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const { error } = await sb().auth.signInWithPassword({ email, password });
    if (error) setErr("Email ou mot de passe incorrect."); else { router.replace("/chat"); router.refresh(); }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex h-dvh max-w-sm flex-col justify-center gap-3 px-6">
      <h1 className="text-2xl font-bold">Rylix Hub</h1>
      <p className="text-sm text-neutral-500">Espace privé de l&apos;équipe.</p>
      <input className={input} type="email" inputMode="email" autoComplete="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} type="password" autoComplete="current-password" placeholder="mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className={btn} disabled={!email || !password}>Se connecter</button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
