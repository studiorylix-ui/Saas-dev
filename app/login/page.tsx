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
    <form onSubmit={submit} className="mx-auto flex h-dvh max-w-sm flex-col justify-center px-6 pb-[env(safe-area-inset-bottom)]">
      <div className="mb-8">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-accent text-[18px] font-semibold text-on-accent">R</div>
        <h1 className="text-[26px] font-semibold tracking-[-0.03em]">Rylix Hub</h1>
        <p className="mt-1 text-[14px] text-muted">Espace privé de l&apos;équipe.</p>
      </div>
      <div className="space-y-2.5">
        <input className={input} autoCapitalize="none" autoCorrect="off" autoComplete="username" placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className={input} type="password" inputMode="numeric" autoComplete="current-password" placeholder="Code" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className={`${btn} w-full`} disabled={!username || !password}>Se connecter</button>
      </div>
      <p className="mt-3 h-5 text-[13px] text-danger">{err}</p>
    </form>
  );
}
