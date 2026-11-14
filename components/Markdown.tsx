"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// @nom et #tag deviennent des liens, sauf dans le code.
const pre = (b: string) =>
  b.split(/(```[\s\S]*?```|`[^`]*`)/g).map((s, i) => i % 2 ? s : s.replace(/(^|[\s(])@([\w-]+)/g, "$1[@$2](mention:$2)").replace(/(^|[\s(])#([\p{L}\d_-]+)/gu, "$1[#$2](tag:$2)")).join("");

export default function Markdown({ text, onTag }: { text: string; onTag?: (t: string) => void }) {
  return (
    <div className="md text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(u) => (/^(https?:|mailto:|mention:|tag:)/i.test(u) ? u : "")}
        components={{
          a: ({ href, children }) =>
            href?.startsWith("mention:") ? <span className="font-medium text-indigo-600">{children}</span>
            : href?.startsWith("tag:") ? <button type="button" className="font-medium text-indigo-600" onClick={() => onTag?.(href.slice(4))}>{children}</button>
            : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
        }}
      >
        {pre(text)}
      </ReactMarkdown>
    </div>
  );
}
