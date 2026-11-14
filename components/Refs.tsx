"use client";
import { createContext, useContext } from "react";
import { useMe, useTable } from "@/lib/useTable";
import type { Channel, FieldDef, Label, Profile, Status } from "@/lib/types";

type Refs = { me: string | null; profiles: Profile[]; name: (id?: string | null) => string; statuses: Status[]; labels: Label[]; fieldDefs: FieldDef[]; channels: Channel[] };
const Ctx = createContext<Refs>(null as unknown as Refs);
export const useRefs = () => useContext(Ctx);

// Données de référence chargées une seule fois pour toute l'app.
export default function RefsProvider({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const { rows: profiles } = useTable<Profile>("profiles", "name", true);
  const { rows: statuses } = useTable<Status>("statuses", "position", true);
  const { rows: labels } = useTable<Label>("labels", "name", true);
  const { rows: fieldDefs } = useTable<FieldDef>("field_defs", "position", true);
  const { rows: channels } = useTable<Channel>("channels", "name", true);
  const name = (id?: string | null) => profiles.find((p) => p.id === id)?.name ?? "—";
  return <Ctx.Provider value={{ me, profiles, name, statuses, labels, fieldDefs, channels }}>{children}</Ctx.Provider>;
}
