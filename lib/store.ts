"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { realtimeReady, sb } from "./supabase/client";
import { toast } from "./toast";

/*
 * Magasin de données unique, côté téléphone.
 * - Tout est chargé une fois au démarrage (petite équipe : quelques milliers de lignes au plus).
 * - Un seul canal temps réel applique les changements ligne par ligne (pas de rechargement complet).
 * - Les écritures sont optimistes : affichées tout de suite, annulées avec un message si le serveur refuse.
 * - Resynchronisation complète au retour au premier plan, au retour du réseau et après une coupure du temps réel.
 * ponytail: tout en mémoire ; paginer messages/activité si une table dépasse quelques milliers de lignes.
 */

export const TABLES = ["profiles", "statuses", "labels", "field_defs", "channels", "messages", "reads", "posts", "post_likes", "activity", "task_comments", "tasks", "projects", "deals", "milestones", "notes"] as const;
export type TableName = (typeof TABLES)[number];
type Row = Record<string, unknown>;

const PK: Partial<Record<TableName, string[]>> = { post_likes: ["post_id", "user_id"], reads: ["user_id", "channel_id"] };
const AUTHOR = new Set<TableName>(["notes", "projects", "deals", "tasks", "messages", "posts", "task_comments"]);
const USER_COL: Partial<Record<TableName, string>> = { post_likes: "user_id", reads: "user_id" };
const SERVER_ONLY = new Set(["created_at", "updated_at", "num"]);
const pk = (t: TableName) => PK[t] ?? ["id"];
const keyOf = (t: TableName, r: Row) => pk(t).map((k) => String(r[k])).join(":");
const matchOf = (t: TableName, r: Row) => Object.fromEntries(pk(t).map((k) => [k, r[k]]));

type Table = { map: Map<string, Row>; snap: Row[]; ready: boolean };
const state = Object.fromEntries(TABLES.map((t) => [t, { map: new Map(), snap: [], ready: false }])) as unknown as Record<TableName, Table>;
const pending = new Set<string>(); // insertions optimistes pas encore confirmées
const listeners = new Set<() => void>();
let me: string | null = null;
let queued = false;

function emit() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; listeners.forEach((l) => l()); });
}
function commit(t: TableName) { state[t] = { ...state[t], snap: [...state[t].map.values()] }; emit(); }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const EMPTY: Row[] = [];

// ---------- Lecture ----------
export function useRows<R>(t: TableName): R[] {
  return useSyncExternalStore(subscribe, () => state[t].snap, () => EMPTY) as R[];
}
export function useReady(...ts: TableName[]) {
  return useSyncExternalStore(subscribe, () => ts.every((t) => state[t].ready), () => false);
}
export function useMe() {
  return useSyncExternalStore(subscribe, () => me, () => null);
}
const cmp = (a: unknown, b: unknown) => (a === b ? 0 : a == null ? 1 : b == null ? -1 : (a as string) < (b as string) ? -1 : 1);
// Même signature que l'ancien hook : lignes triées, sans requête réseau.
export function useTable<R>(t: TableName, order = "created_at", asc = false) {
  const rows = useRows<Row>(t);
  const sorted = useMemo(() => [...rows].sort((a, b) => (asc ? 1 : -1) * cmp(a[order], b[order])), [rows, order, asc]);
  return { rows: sorted as R[], reload: refetchAll };
}

// ---------- Synchronisation ----------
let started = false;
let channel: RealtimeChannel | null = null;
let hiddenAt = 0;

async function refetch(t: TableName) {
  const { data, error } = await sb().from(t).select("*").limit(10000);
  if (error) return;
  const m = new Map<string, Row>(data.map((r) => [keyOf(t, r), r]));
  for (const p of pending) {
    const [pt, k] = p.split("|");
    const local = state[t].map.get(k);
    if (pt === t && !m.has(k) && local) m.set(k, local);
  }
  state[t] = { map: m, snap: [...m.values()], ready: true };
  emit();
}
export const refetchAll = () => Promise.all(TABLES.map(refetch)).then(() => {});

function apply(t: TableName, p: RealtimePostgresChangesPayload<Row>) {
  if (p.eventType === "DELETE") {
    if (state[t].map.delete(keyOf(t, p.old as Row))) commit(t);
    return;
  }
  const k = keyOf(t, p.new);
  pending.delete(`${t}|${k}`);
  state[t].map.set(k, p.new);
  commit(t);
}

function connect() {
  let dropped = false;
  let ch = sb().channel(`db-${Math.random().toString(36).slice(2)}`);
  for (const t of TABLES) ch = ch.on("postgres_changes", { event: "*", schema: "public", table: t }, (p) => apply(t, p as RealtimePostgresChangesPayload<Row>));
  ch.subscribe((s) => {
    if (s === "SUBSCRIBED") { if (dropped) refetchAll(); dropped = false; }
    else dropped = true; // CLOSED / TIMED_OUT / CHANNEL_ERROR : supabase-js rejoint seul, on rattrape au retour
  });
  channel = ch;
}

async function resync() {
  if (channel && channel.state !== "joined") { await sb().removeChannel(channel); connect(); }
  refetchAll();
}

export async function startSync() {
  if (started) return;
  started = true;
  const { data } = await sb().auth.getSession();
  me = data.session?.user.id ?? null;
  emit();
  await realtimeReady();
  sb().channel("keepalive").subscribe(); // évite la coupure du WebSocket quand on recrée le canal principal
  connect();
  await refetchAll();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (Date.now() - hiddenAt > 15000) resync(); // iOS suspend les pages en arrière-plan
  });
  window.addEventListener("online", resync);
}

// ---------- Écriture optimiste ----------
const fail = (e: { message: string }) => toast(e.message.includes("violates") ? "Action refusée : élément encore utilisé." : "Pas de connexion au serveur, modification annulée.");
const now = () => new Date().toISOString();

export const db = {
  // Retourne la ligne locale immédiatement (id généré ici).
  insert<R = Row>(t: TableName, row: Row): R {
    const r: Row = {
      ...(PK[t] ? {} : { id: crypto.randomUUID() }),
      ...(AUTHOR.has(t) ? { author: me } : {}),
      ...(USER_COL[t] ? { [USER_COL[t]!]: me } : {}),
      created_at: now(), updated_at: now(),
      ...row,
    };
    const k = keyOf(t, r);
    state[t].map.set(k, r);
    pending.add(`${t}|${k}`);
    commit(t);
    const send = Object.fromEntries(Object.entries(r).filter(([c]) => !SERVER_ONLY.has(c)));
    sb().from(t).insert(send).then(({ error }) => {
      if (!error) return;
      pending.delete(`${t}|${k}`);
      state[t].map.delete(k);
      commit(t);
      fail(error);
    });
    return r as R;
  },
  update(t: TableName, match: string | Row, patch: Row) {
    const k = typeof match === "string" ? match : keyOf(t, match);
    const prev = state[t].map.get(k);
    if (!prev) return;
    state[t].map.set(k, { ...prev, ...patch });
    commit(t);
    sb().from(t).update(patch).match(matchOf(t, prev)).then(({ error }) => {
      if (!error) return;
      state[t].map.set(k, prev);
      commit(t);
      fail(error);
    });
  },
  remove(t: TableName, match: string | Row) {
    const k = typeof match === "string" ? match : keyOf(t, match);
    const prev = state[t].map.get(k);
    if (!prev) return;
    state[t].map.delete(k);
    commit(t);
    sb().from(t).delete().match(matchOf(t, prev)).then(({ error }) => {
      if (!error) return;
      state[t].map.set(k, prev);
      commit(t);
      fail(error);
    });
  },
  upsert(t: TableName, row: Row) {
    const r: Row = { ...(USER_COL[t] ? { [USER_COL[t]!]: me } : {}), ...row };
    const k = keyOf(t, r);
    const prev = state[t].map.get(k);
    state[t].map.set(k, { ...prev, ...r });
    commit(t);
    sb().from(t).upsert(r).then(({ error }) => {
      if (!error) return;
      if (prev) state[t].map.set(k, prev); else state[t].map.delete(k);
      commit(t);
    });
  },
  get<R = Row>(t: TableName, id: string) { return state[t].map.get(id) as R | undefined; },
};
