"use client";
import { useEffect } from "react";
import { ago } from "@/lib/ui";
import Avatar from "../Avatar";
import Header from "../Header";
import Icon from "../Icon";
import { PushLink } from "../nav";
import { useRefs } from "../Refs";

// Activité façon Threads : mentions, réponses, likes, assignations et commentaires qui vous concernent.
export default function ActivityScreen() {
  const { feed, name, markFeedSeen } = useRefs();
  useEffect(() => { if (feed.length) markFeedSeen(); }, [feed.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Header title="Activité" />
      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <div className={feed.length ? "group-card mx-4 mt-2 divide-y divide-line" : ""}>
          {feed.map((f) => (
            <PushLink key={f.id} to={f.to} className="rise flex gap-3 px-4 py-3 active:bg-subtle">
              <div className="relative">
                <Avatar name={name(f.actor)} size={38} />
                <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-bg bg-ink text-on-accent"><Icon name={f.icon} size={10} stroke={2.6} filled={f.icon === "heart"} /></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px]"><span className="font-semibold">{name(f.actor)}</span> <span className="text-muted">{ago(f.at)}</span></div>
                <div className="text-[14.5px] text-muted">{f.text}</div>
                {f.sub && <div className="mt-0.5 line-clamp-2 text-[14.5px]">{f.sub}</div>}
              </div>
            </PushLink>
          ))}
        </div>
        {!feed.length && (
          <div className="rise flex flex-col items-center gap-2 pt-24 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-card text-muted"><Icon name="heart" size={22} /></span>
            <p className="text-[15px] font-medium">Rien de nouveau</p>
            <p className="max-w-[260px] text-[13px] text-muted">Mentions, réponses, likes, assignations et commentaires qui vous concernent apparaîtront ici.</p>
          </div>
        )}
      </div>
    </>
  );
}
