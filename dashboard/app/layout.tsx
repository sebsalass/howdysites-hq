import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SyncButton from "@/components/SyncButton";

export const metadata: Metadata = {
  title: "Howdy Sites HQ",
  description: "Operations dashboard — the repo is the database",
};

const NAV = [
  ["/", "Overview"],
  ["/pipeline", "Pipeline"],
  ["/mockup", "Mockup"],
  ["/territories", "Territories"],
  ["/clients", "Clients"],
  ["/import", "Import"],
  ["/money", "Money"],
  ["/playbooks", "Playbooks"],
  ["/settings", "Settings"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <aside className="w-48 shrink-0 border-r border-[#1f2633] p-4 flex flex-col gap-1">
            <div className="text-sm font-bold tracking-wide text-slate-100 mb-3">HOWDY SITES</div>
            {NAV.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded px-2 py-1.5 text-sm text-slate-300 hover:bg-[#1a2130] hover:text-white"
              >
                {label}
              </Link>
            ))}
            <div className="mt-auto text-[10px] text-slate-600">HOU · DAL · SA</div>
          </aside>
          <div className="flex-1 min-w-0">
            <header className="flex items-center justify-end border-b border-[#1f2633] px-6 py-2">
              <SyncButton />
            </header>
            <main className="p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
