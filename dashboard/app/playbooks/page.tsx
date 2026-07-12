import Link from "next/link";
import { marked } from "marked";
import { listDocs, readDoc } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Playbooks({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string }>;
}) {
  const docs = listDocs();
  const { doc } = await searchParams;
  const current = doc && docs.includes(doc) ? doc : docs[0];
  const html = current ? await marked.parse(readDoc(`docs/${current}`)) : "";

  return (
    <div className="flex gap-6">
      <nav className="w-56 shrink-0 space-y-1">
        <h1 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Playbooks</h1>
        {docs.map((d) => (
          <Link
            key={d}
            href={`/playbooks?doc=${d}`}
            className={`block rounded px-2 py-1.5 text-sm hover:bg-[#1a2130] ${
              d === current ? "bg-[#1a2130] text-white" : "text-slate-400"
            }`}
          >
            {d.replace(/\.md$/, "").replace(/^\d+-/, "").replace(/-/g, " ")}
          </Link>
        ))}
      </nav>
      <article className="doc-body min-w-0 max-w-3xl flex-1" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
