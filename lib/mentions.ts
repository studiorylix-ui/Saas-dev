import type { Profile } from "./types";

export const extractMentions = (t: string, profiles: Profile[]) =>
  [...new Set([...t.matchAll(/@([\w-]+)/g)].map((m) => profiles.find((p) => p.name.toLowerCase() === m[1].toLowerCase())?.id).filter((x): x is string => !!x))];
