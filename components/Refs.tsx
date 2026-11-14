"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db, useMe, useTable } from "@/lib/store";
import type { Activity, Channel, Comment, FieldDef, Label, Msg, Post, PostLike, Profile, Read, Status, Task } from "@/lib/types";
import type { IconName } from "./Icon";
import type { Screen } from "./nav";

export type FeedItem = { id: string; at: string; actor: string; icon: IconName; text: string; sub: string; to: Screen };

type Refs = {
  me: string | null; profiles: Profile[]; name: (id?: string | null) => string;
  statuses: Status[]; labels: Label[]; fieldDefs: FieldDef[]; channels: Channel[];
  messages: Msg[]; unread: Record<string, number>; markRead: (channelId: string) => void;
  feed: FeedItem[]; feedUnseen: boolean; markFeedSeen: () => void;
};
const Ctx = createContext<Refs>(null as unknown as Refs);
export const useRefs = () => useContext(Ctx);
const after = (a: string, b?: string) => !b || new Date(a) > new Date(b);

// Données partagées par toute l'app : référentiels, messages + non-lus, fil d'activité personnel.
export default function RefsProvider({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const { rows: profiles } = useTable<Profile>("profiles", "name", true);
  const { rows: statuses } = useTable<Status>("statuses", "position", true);
  const { rows: labels } = useTable<Label>("labels", "name", true);
  const { rows: fieldDefs } = useTable<FieldDef>("field_defs", "position", true);
  const { rows: channels } = useTable<Channel>("channels", "name", true);
  const { rows: messages } = useTable<Msg>("messages", "created_at", true);
  const { rows: reads } = useTable<Read>("reads", "last_read_at");
  const { rows: posts } = useTable<Post>("posts");
  const { rows: likes } = useTable<PostLike>("post_likes");
  const { rows: activity } = useTable<Activity>("activity");
  const { rows: comments } = useTable<Comment>("task_comments");
  const { rows: tasks } = useTable<Task>("tasks");
  const [seen, setSeen] = useState<string | undefined>();
  const name = (id?: string | null) => profiles.find((p) => p.id === id)?.name ?? "—";

  // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique d'une préférence locale
  useEffect(() => { try { setSeen(localStorage.getItem("feedSeen") ?? undefined); } catch {} }, []);

  const unread = useMemo(() => {
    const r: Record<string, number> = {};
    for (const m of messages) {
      if (m.author === me || m.parent_id) continue;
      if (after(m.created_at, reads.find((x) => x.channel_id === m.channel_id)?.last_read_at)) r[m.channel_id] = (r[m.channel_id] ?? 0) + 1;
    }
    return r;
  }, [messages, reads, me]);

  const markRead = (channelId: string) => {
    const last = messages.filter((m) => m.channel_id === channelId).at(-1)?.created_at;
    const cur = reads.find((x) => x.channel_id === channelId)?.last_read_at;
    if (last && after(last, cur)) db.upsert("reads", { channel_id: channelId, last_read_at: last });
  };

  const feed = useMemo(() => {
    if (!me) return [];
    const myName = profiles.find((p) => p.id === me)?.name ?? "";
    const mine = new Set(posts.filter((p) => p.author === me).map((p) => p.id));
    const body = (id: string) => posts.find((p) => p.id === id)?.body ?? "";
    const items: FeedItem[] = [
      ...posts.filter((p) => p.author !== me && p.mentions.includes(me)).map((p) => ({ id: `m${p.id}`, at: p.created_at, actor: p.author, icon: "at" as IconName, text: "vous a mentionné", sub: p.body, to: { k: "post" as const, id: p.parent_id ?? p.id } })),
      ...posts.filter((p) => p.author !== me && p.parent_id && mine.has(p.parent_id) && !p.mentions.includes(me)).map((p) => ({ id: `r${p.id}`, at: p.created_at, actor: p.author, icon: "chat" as IconName, text: "a répondu à votre post", sub: p.body, to: { k: "post" as const, id: p.parent_id! } })),
      ...likes.filter((l) => l.user_id !== me && mine.has(l.post_id)).map((l) => ({ id: `l${l.post_id}${l.user_id}`, at: l.created_at, actor: l.user_id, icon: "heart" as IconName, text: "a aimé votre post", sub: body(l.post_id), to: { k: "post" as const, id: l.post_id } })),
      ...activity.filter((a) => a.entity === "tasks" && a.actor !== me && a.changes.assignee?.[1] === me).map((a) => ({ id: `a${a.id}`, at: a.created_at, actor: a.actor ?? "", icon: "check" as IconName, text: "vous a assigné une tâche", sub: tasks.find((t) => t.id === a.entity_id)?.title ?? "", to: { k: "task" as const, id: a.entity_id } })),
      ...comments.filter((c) => {
        if (c.author === me) return false;
        const t = tasks.find((x) => x.id === c.task_id);
        return t?.assignee === me || t?.author === me || (!!myName && new RegExp(`@${myName}\\b`, "i").test(c.body));
      }).map((c) => ({ id: `c${c.id}`, at: c.created_at, actor: c.author, icon: "chat" as IconName, text: "a commenté une tâche", sub: c.body, to: { k: "task" as const, id: c.task_id } })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100);
  }, [me, profiles, posts, likes, activity, comments, tasks]);

  const feedUnseen = !!feed[0] && after(feed[0].at, seen);
  const markFeedSeen = () => {
    const at = feed[0]?.at ?? new Date().toISOString();
    setSeen(at);
    try { localStorage.setItem("feedSeen", at); } catch {}
  };

  return (
    <Ctx.Provider value={{ me, profiles, name, statuses, labels, fieldDefs, channels, messages, unread, markRead, feed, feedUnseen, markFeedSeen }}>
      {children}
    </Ctx.Provider>
  );
}
