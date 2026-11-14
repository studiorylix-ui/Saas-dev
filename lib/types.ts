export type Profile = { id: string; name: string };
export type Msg = { id: string; kind: "chat" | "post"; body: string; parent_id: string | null; author: string; created_at: string };
export type Like = { message_id: string; user_id: string };
export type Note = { id: string; title: string; body: string; author: string; updated_at: string };
export type Project = { id: string; name: string; description: string; status: string; created_at: string };
export type Deal = { id: string; name: string; client: string; stage: string; amount: number | null; created_at: string };
export type Task = { id: string; title: string; status: "todo" | "doing" | "done"; assignee: string | null; due: string | null; project_id: string | null; deal_id: string | null; created_at: string };
