import { NextResponse } from "next/server";
import { execFileSync } from "child_process";
import { REPO } from "@/lib/data";

export const dynamic = "force-dynamic";

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: REPO, encoding: "utf8", timeout: 30000 }).trim();
}

// GET: sync status (ahead/behind origin, dirty files)
export async function GET() {
  try {
    let fetched = true;
    try {
      git("fetch", "--quiet");
    } catch {
      fetched = false; // offline is fine — report local state
    }
    const branch = git("rev-parse", "--abbrev-ref", "HEAD");
    const dirty = git("status", "--porcelain").split("\n").filter(Boolean).length;
    let ahead = 0,
      behind = 0;
    try {
      const [a, b] = git("rev-list", "--left-right", "--count", `${branch}...origin/${branch}`).split("\t");
      ahead = Number(a);
      behind = Number(b);
    } catch {
      /* no upstream yet */
    }
    return NextResponse.json({ branch, dirty, ahead, behind, fetched });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST: pull --rebase, commit data/memory/config changes, push
export async function POST() {
  const steps: string[] = [];
  try {
    const dirty = git("status", "--porcelain").split("\n").filter(Boolean).length;
    if (dirty) {
      git("add", "data", "memory", "config");
      try {
        git("commit", "-m", "dashboard sync: pipeline + config updates");
        steps.push("committed local changes");
      } catch {
        steps.push("nothing staged to commit");
      }
    }
    try {
      git("pull", "--rebase", "--quiet");
      steps.push("pulled latest");
    } catch (e) {
      return NextResponse.json({ error: `pull failed — resolve in terminal: ${e}`, steps }, { status: 409 });
    }
    git("push", "--quiet");
    steps.push("pushed");
    return NextResponse.json({ ok: true, steps });
  } catch (e) {
    return NextResponse.json({ error: String(e), steps }, { status: 500 });
  }
}
