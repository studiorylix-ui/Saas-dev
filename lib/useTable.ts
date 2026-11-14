"use client";
import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { realtimeReady, sb } from "./supabase/client";

// Un abonnement permanent : sans lui, retirer le dernier canal coupe le WebSocket (remontage React, navigation)
// et la reconnexion qui suit échoue. Garder un canal ouvert évite cette coupure.
let keepAlive = false;
const keepSocketOpen = () => { if (!keepAlive) { keepAlive = true; sb().channel("keepalive").subscribe(); } };

// Charge une table et la recharge à chaque changement (temps réel).
// ponytail: refetch complet, ok pour une petite équipe; passer aux deltas si ça grossit.
export function useTable<T>(table: string, order = "created_at", asc = false) {
  const [rows, setRows] = useState<T[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let ch: RealtimeChannel | null = null;
    let gone = false;
    const load = () => void sb().from(table).select("*").order(order, { ascending: asc }).then(({ data }) => setRows((data ?? []) as T[]));
    load();
    realtimeReady().then(() => {
      if (gone) return;
      keepSocketOpen();
      ch = sb().channel(`rt-${table}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", { event: "*", schema: "public", table }, load).subscribe();
    });
    return () => { gone = true; if (ch) sb().removeChannel(ch); };
  }, [table, order, asc, tick]);
  return { rows, reload: () => setTick((t) => t + 1) };
}

export function useMe() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { sb().auth.getUser().then(({ data }) => setId(data.user?.id ?? null)); }, []);
  return id;
}
