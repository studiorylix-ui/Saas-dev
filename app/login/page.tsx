"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase/client";
import { btn, input } from "@/lib/ui";

// Nom d'utilisateur + code. Le nom d'utilisateur devient l'email interne `nom@rylix.hub` (jamais utilisé pour écrire).
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const { error } = await sb().auth.signInWithPassword({ email: `${username.trim().toLowerCase()}@rylix.hub`, password });
    if (error) setErr("Nom d'utilisateur ou code incorrect."); else { router.replace("/chat"); router.refresh(); }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex h-dvh max-w-sm flex-col justify-center gap-3 px-6">
      <h1 className="text-2xl font-bold">Rylix Hub</h1>
      <p className="text-sm text-neutral-500">Espace privé de l&apos;équipe.</p>
      <input className={input} autoCapitalize="none" autoCorrect="off" autoComplete="username" placeholder="nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className={input} type="password" inputMode="numeric" autoComplete="current-password" placeholder="code" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className={btn} disabled={!username || !password}>Se connecter</button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
