import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  Beaker,
  Brain,
  CheckCircle2,
  CircleAlert,
  Compass,
  Plus,
  Trash2,
} from "lucide-react";

import {
  deleteGrowthMapItemAction,
  mergeGrowthMapItemsAction,
  saveGrowthMapItemAction,
  setGrowthMapItemStatusAction,
} from "./actions";
import { authOptions } from "@/auth";
import { getGrowthMap } from "@/lib/data/growth-map";

export const dynamic = "force-dynamic";
export const metadata = { title: "Growth map" };

const icons = {
  evidence: CheckCircle2,
  obstacle: CircleAlert,
  experiment: Beaker,
  outcome: Compass,
};

export default async function GrowthMapPage() {
  if (process.env.MAJOR_EXPERIENCES_ENABLED === "false") redirect("/chat")
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const map = await getGrowthMap(session.user.id);
  const activeItems = map.items.filter((item) => item.status === "active");
  const dismissed = map.items.filter((item) => item.status === "dismissed");
  const recentChanges = map.items.slice(0, 8);
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">
          Evidence, not identity labels
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] text-neutral-950 sm:text-5xl">
          Your Growth Map.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-500">
          Connect goals to evidence, recurring obstacles, experiments, and
          outcomes. Confidence stays visible, and every inferred pattern can be
          corrected, dismissed, merged, or deleted.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary
          label="Active goals"
          value={map.goals.filter((goal) => goal.status === "active").length}
        />
        <Summary label="Completed commitments" value={map.outcomes.completed} />
        <Summary
          label="Open experiments"
          value={
            activeItems.filter((item) => item.type === "experiment").length
          }
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {(["evidence", "obstacle", "experiment", "outcome"] as const).map(
            (type) => {
              const Icon = icons[type];
              const items = activeItems.filter((item) => item.type === type);
              return (
                <section
                  key={type}
                  className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold capitalize text-neutral-900">
                        {type}
                      </h2>
                      <p className="text-[10px] text-neutral-400">
                        {items.length} active{" "}
                        {items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-neutral-800">
                                {item.title}
                              </h3>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] text-neutral-500">
                                {Math.round(item.confidence * 100)}% confidence
                              </span>
                              {item.userConfirmed ? (
                                <span className="text-[9px] font-semibold text-emerald-600">
                                  User-confirmed
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-xs leading-5 text-neutral-500">
                              {item.description}
                            </p>
                            <p className="mt-2 text-[9px] text-neutral-400">
                              Sources: {item.sourceTaskIds.length} tasks ·{" "}
                              {item.sourceConversationIds.length} conversations
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <form action={setGrowthMapItemStatusAction}>
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="status"
                                value="dismissed"
                              />
                              <button
                                aria-label={`Dismiss ${item.title}`}
                                className="rounded-lg px-2 py-1 text-[10px] text-neutral-400 hover:bg-white hover:text-neutral-700"
                              >
                                Dismiss
                              </button>
                            </form>
                            <form action={deleteGrowthMapItemAction}>
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <button
                                aria-label={`Delete ${item.title}`}
                                className="rounded-lg p-1.5 text-neutral-300 hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </form>
                          </div>
                        </div>
                        <details className="mt-3 border-t border-neutral-200 pt-3">
                          <summary className="cursor-pointer text-[10px] font-semibold text-neutral-500 hover:text-neutral-800">
                            Edit or correct this item
                          </summary>
                          <form action={saveGrowthMapItemAction} className="mt-3 grid gap-2">
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="type" value={item.type} />
                            <input type="hidden" name="confidence" value="1" />
                            <input name="title" defaultValue={item.title} minLength={3} maxLength={100} required className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800" />
                            <textarea name="description" defaultValue={item.description} minLength={3} maxLength={500} required className="min-h-20 rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-800" />
                            <button className="h-9 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                              Save correction and confirm
                            </button>
                          </form>
                        </details>
                      </article>
                    ))}
                    {!items.length ? (
                      <p className="rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center text-xs text-neutral-400">
                        No {type} recorded yet.
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            },
          )}
        </div>
        <aside className="space-y-5">
          <section className="sticky top-6 rounded-3xl border border-neutral-200 bg-neutral-950 p-6 text-white">
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Add a confirmed item</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/40">
              Manual items begin at 100% confidence because you supplied them.
              AI-inferred items should retain lower confidence and source links.
            </p>
            <form action={saveGrowthMapItemAction} className="mt-5 space-y-3">
              <select
                name="type"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs"
              >
                <option value="evidence">Evidence</option>
                <option value="obstacle">Obstacle</option>
                <option value="experiment">Experiment</option>
                <option value="outcome">Outcome</option>
              </select>
              <input
                name="title"
                minLength={3}
                maxLength={100}
                required
                placeholder="Short title"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs outline-none focus:border-primary"
              />
              <textarea
                name="description"
                minLength={3}
                maxLength={500}
                required
                placeholder="What happened or what will you test?"
                className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs outline-none focus:border-primary"
              />
              <input type="hidden" name="confidence" value="1" />
              <button className="h-10 w-full rounded-xl bg-primary text-xs font-semibold text-primary-foreground">
                Add to map
              </button>
            </form>
          </section>
          {activeItems.length > 1 ? (
            <section className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-xs font-semibold text-neutral-700">
                Merge duplicate patterns
              </h2>
              <p className="mt-1 text-[10px] leading-4 text-neutral-400">
                The first item is archived into the second. Source links are
                preserved on the surviving item.
              </p>
              <form action={mergeGrowthMapItemsAction} className="mt-3 space-y-2">
                <select
                  name="sourceId"
                  aria-label="Pattern to merge"
                  required
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-700"
                >
                  <option value="">Merge this pattern…</option>
                  {activeItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
                <select
                  name="targetId"
                  aria-label="Surviving pattern"
                  required
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-700"
                >
                  <option value="">Into this pattern…</option>
                  {activeItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
                <button className="h-9 w-full rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                  Merge and preserve sources
                </button>
              </form>
            </section>
          ) : null}
          {dismissed.length ? (
            <section className="rounded-2xl border border-neutral-200 p-4">
              <h2 className="text-xs font-semibold text-neutral-700">
                Dismissed patterns
              </h2>
              <div className="mt-3 space-y-2">
                {dismissed.map((item) => (
                  <form
                    key={item.id}
                    action={setGrowthMapItemStatusAction}
                    className="flex items-center justify-between gap-2"
                  >
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="status" value="active" />
                    <span className="truncate text-[10px] text-neutral-400">
                      {item.title}
                    </span>
                    <button className="text-[10px] font-semibold text-primary">
                      Restore
                    </button>
                  </form>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </section>
      {recentChanges.length ? (
        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-900">Map history</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            A time-ordered record of evidence and experiments—not a wellbeing score.
          </p>
          <ol className="mt-5 divide-y divide-neutral-100">
            {recentChanges.map((item) => (
              <li key={item.id} className="grid gap-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)_6rem] sm:items-center">
                <time dateTime={item.updatedAt} className="text-[10px] text-neutral-400">
                  {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.updatedAt))}
                </time>
                <span className="text-xs text-neutral-700">{item.title}</span>
                <span className="text-[9px] uppercase tracking-wide text-neutral-400 sm:text-right">{item.status}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Brain className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p className="text-xs leading-5 text-amber-900/70">
            Growth Map is descriptive, not diagnostic. It does not assign
            personality types, predict wellbeing, or replace professional
            advice. Deleting an item removes it from this map.
          </p>
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-2xl font-semibold text-neutral-950">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>
    </article>
  );
}
