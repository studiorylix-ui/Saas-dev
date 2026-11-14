"use client";
import { useEffect, useState } from "react";
import { sb } from "./supabase/client";

// Charge une table et la recharge à chaque changement (temps réel).
// ponytail: refetch complet, ok pour une petite équipe; passer aux deltas si ça grossit.
export function useTable<T>(table: string, order = "created_at", asc = false) {
  const [rows, setRows] = useState<T[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const load = () => void sb().from(table).select("*").order(order, { ascending: asc }).then(({ data }) => setRows((data ?? []) as T[]));
    load();
    const ch = sb().channel(`rt-${table}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", { event: "*", schema: "public", table }, load).subscribe();
    return () => { sb().removeChannel(ch); };
  }, [table, order, asc, tick]);
  return { rows, reload: () => setTick((t) => t + 1) };
}

export function useMe() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { sb().auth.getUser().then(({ data }) => setId(data.user?.id ?? null)); }, []);
  return id;
}
