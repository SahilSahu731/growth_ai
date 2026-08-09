"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Check,
  ChevronRight,
  CreditCard,
  HeartHandshake,
  LockKeyhole,
  Bell,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  updateSettingsAction,
  type SettingsActionState,
} from "@/app/(user)/settings/actions";
import { UpgradeTrigger } from "@/components/billing/upgrade-dialog";
import { DangerZone } from "@/components/growth/danger-zone";
import { AccountExportControl } from "@/components/settings/account-export-control";
import { PrivacyControls } from "@/components/settings/privacy-controls";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountOverview } from "@/lib/data/account";
import { getPlan, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

type TabId = "general" | "coach" | "notifications" | "billing" | "privacy";

type SettingsUser = {
  name: string;
  email: string;
  image: string | null;
  planTier: PlanId;
};

const tabs: Array<{
  id: TabId;
  label: string;
  description: string;
  keywords: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    id: "general",
    label: "General",
    description: "Profile and region",
    keywords: "profile name email avatar timezone language region",
    icon: Settings2,
  },
  {
    id: "coach",
    label: "AI coach",
    description: "Conversation style",
    keywords: "ai coach tone supportive balanced direct guidance",
    icon: Sparkles,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Optional weekly email",
    keywords: "email reminders summary quiet hours unsubscribe",
    icon: Bell,
  },
  {
    id: "billing",
    label: "Plan & billing",
    description: "Subscription and usage",
    keywords: "plan billing subscription payment razorpay pro founder goals",
    icon: CreditCard,
  },
  {
    id: "privacy",
    label: "Privacy & data",
    description: "Export or delete",
    keywords: "privacy data export download delete account security",
    icon: ShieldCheck,
  },
];

const timezoneSuggestions = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export function SettingsWorkspace({
  user,
  preferences,
}: {
  user: SettingsUser;
  preferences: AccountOverview["preferences"];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [query, setQuery] = useState("");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const visibleTabs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? tabs.filter((tab) =>
          `${tab.label} ${tab.description} ${tab.keywords}`
            .toLowerCase()
            .includes(term),
        )
      : tabs;
  }, [query]);

  useEffect(() => {
    const syncHash = () => {
      const value = window.location.hash.slice(1) as TabId;
      if (tabs.some((tab) => tab.id === value)) setActiveTab(value);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function selectTab(id: TabId) {
    setActiveTab(id);
    setQuery("");
    window.history.replaceState(null, "", `${window.location.pathname}#${id}`);
  }

  function moveTab(index: number) {
    if (!visibleTabs.length) return;
    const next = (index + visibleTabs.length) % visibleTabs.length;
    selectTab(visibleTabs[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="min-h-svh bg-[#101010] text-[#f2f2f0] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="border-b border-[#292929] bg-[#151515] p-4 lg:min-h-svh lg:border-b-0 lg:border-r lg:p-5">
        <div className="mb-7 hidden px-2 lg:block">
          <h1 className="text-xl font-semibold tracking-[-.02em] text-[#f5f5f3]">
            Settings
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#8a8a86]">
            Your GrowthAI preferences
          </p>
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && visibleTabs[0])
                selectTab(visibleTabs[0].id);
            }}
            placeholder="Search settings"
            aria-label="Search settings"
            className="h-11 w-full rounded-xl border border-[#353535] bg-[#1c1c1c] pl-10 pr-3 text-sm font-normal text-[#ededeb] outline-none transition placeholder:text-[#777773] focus:border-[#565656] focus:ring-2 focus:ring-[#303030]"
          />
        </label>

        <nav
          aria-label="Settings sections"
          className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:block lg:space-y-1"
          role="tablist"
        >
          {visibleTabs.map((tab, index) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`settings-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`settings-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    moveTab(index + 1);
                  } else if (
                    event.key === "ArrowLeft" ||
                    event.key === "ArrowUp"
                  ) {
                    event.preventDefault();
                    moveTab(index - 1);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    moveTab(0);
                  } else if (event.key === "End") {
                    event.preventDefault();
                    moveTab(visibleTabs.length - 1);
                  }
                }}
                className={cn(
                  "flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-3 py-3 text-left transition lg:w-full",
                  selected
                    ? "bg-[#2b2b2b] text-[#fafaf8]"
                    : "text-[#b5b5b0] hover:bg-[#202020] hover:text-[#f0f0ed]",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0",
                    selected ? "text-primary" : "text-[#7f7f7a]",
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {tab.label}
                  </span>
                  <span className="mt-0.5 hidden truncate text-[11px] font-normal text-[#777773] lg:block">
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
          {!visibleTabs.length ? (
            <p className="col-span-full px-3 py-8 text-center text-xs leading-5 text-neutral-400">
              No settings match “{query}”.
            </p>
          ) : null}
        </nav>

        <div className="mt-7 hidden border-t border-[#303030] px-3 pt-6 lg:block">
          <p className="text-[11px] font-medium uppercase tracking-[.12em] text-[#777773]">
            Signed in as
          </p>
          <p className="mt-2 truncate text-sm font-normal text-[#a5a5a0]">
            {user.email}
          </p>
        </div>
      </aside>

      <div className="min-w-0 bg-[#101010]">
        {activeTab === "general" ? (
          <GeneralPanel user={user} preferences={preferences} />
        ) : null}
        {activeTab === "coach" ? (
          <CoachPanel preferences={preferences} />
        ) : null}
        {activeTab === "notifications" ? (
          <NotificationsPanel preferences={preferences} />
        ) : null}
        {activeTab === "billing" ? (
          <BillingPanel planTier={user.planTier} />
        ) : null}
        {activeTab === "privacy" ? (
          <PrivacyPanel
            email={user.email}
            retentionDays={preferences.messageRetentionDays}
          />
        ) : null}
      </div>
    </div>
  );
}

function NotificationsPanel({
  preferences,
}: {
  preferences: AccountOverview["preferences"];
}) {
  const [state, action, pending] = useActionState(
    updateSettingsAction,
    {} as SettingsActionState,
  );
  return (
    <SettingsPanel
      id="notifications"
      eyebrow="Optional communication"
      title="Notifications"
      description="A bounded weekly summary, disabled by default and separate from required account or billing messages."
    >
      <Section
        title="Weekly review email"
        description="One optional summary per week. GrowthAI does not send daily streaks or shame-based reminders."
      >
        <form action={action} className="divide-y divide-[#292929]">
          <input type="hidden" name="section" value="notifications" />
          <SettingRow label="Weekly summary">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="emailNotifications"
                defaultChecked={preferences.emailNotifications}
                className="mt-1 size-4 accent-cyan-300"
              />
              <span className="text-sm font-normal leading-6 text-[#b8b8b3]">
                Email me when a source-backed weekly review is available.
                Uncheck to unsubscribe from all optional email.
              </span>
            </label>
          </SettingRow>
          <SettingRow label="Quiet hours" align="start">
            <div className="grid max-w-sm grid-cols-2 gap-3">
              <label className="text-xs text-[#858581]">
                Start
                <input
                  type="time"
                  name="notificationQuietStart"
                  defaultValue={preferences.notificationQuietStart}
                  className="mt-2 h-10 w-full rounded-lg border border-[#343434] bg-[#171717] px-3 text-[#ededeb]"
                />
              </label>
              <label className="text-xs text-[#858581]">
                End
                <input
                  type="time"
                  name="notificationQuietEnd"
                  defaultValue={preferences.notificationQuietEnd}
                  className="mt-2 h-10 w-full rounded-lg border border-[#343434] bg-[#171717] px-3 text-[#ededeb]"
                />
              </label>
              <p className="col-span-2 text-xs leading-5 text-[#777773]">
                Times use your General timezone. Transactional security and
                billing email is not suppressed.
              </p>
            </div>
          </SettingRow>
          <SettingRow label="Snooze summaries" align="start">
            <div className="w-full max-w-sm">
              <input
                type="date"
                name="notificationSnoozedUntil"
                defaultValue={preferences.notificationSnoozedUntil?.slice(0, 10) ?? ""}
                className="h-10 w-full rounded-lg border border-[#343434] bg-[#171717] px-3 text-sm text-[#ededeb]"
              />
              <p className="mt-2 text-xs leading-5 text-[#777773]">
                Optional summaries stay paused through this date. Clear the date
                to resume the normal weekly schedule.
              </p>
            </div>
          </SettingRow>
          <FormFooter state={state} pending={pending} />
        </form>
        <div className="border-t border-[#292929] bg-[#151515] p-5 sm:p-6">
          <p className="text-[10px] font-medium uppercase tracking-[.12em] text-[#777773]">Email preview</p>
          <div className="mt-3 rounded-xl border border-[#303030] bg-[#101010] p-4">
            <p className="text-sm font-medium text-[#ededeb]">Your GrowthAI weekly review</p>
            <p className="mt-2 text-xs leading-5 text-[#8f8f8b]">Your review summarizes completed, deferred, dismissed, and overdue commitments. Open GrowthAI to inspect sources and correct interpretations.</p>
          </div>
        </div>
      </Section>
    </SettingsPanel>
  );
}

function GeneralPanel({
  user,
  preferences,
}: {
  user: SettingsUser;
  preferences: AccountOverview["preferences"];
}) {
  const [state, action, pending] = useActionState(
    updateSettingsAction,
    {} as SettingsActionState,
  );
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);
  const initials =
    user.name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G";
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timer = window.setTimeout(() => {
      if (detected && detected !== preferences.timezone)
        setDetectedTimezone(detected);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [preferences.timezone]);
  return (
    <SettingsPanel
      id="general"
      eyebrow="Account"
      title="General"
      description="Your profile identity and regional preferences."
    >
      <Section
        title="Profile"
        description="Your name, photo, and email come from your connected Google account."
      >
        <SettingRow label="Avatar">
          <Avatar className="size-12">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-[#2a2a2a] text-sm font-medium text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </SettingRow>
        <SettingRow label="Full name">
          <ReadOnlyValue>{user.name}</ReadOnlyValue>
        </SettingRow>
        <SettingRow label="Email address">
          <ReadOnlyValue>{user.email}</ReadOnlyValue>
        </SettingRow>
        <SettingRow label="Sign-in method">
          <span className="inline-flex items-center gap-2 text-sm font-normal text-[#c8c8c4]">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#252525] text-xs font-semibold text-[#e8e8e5]">
              G
            </span>
            Google OAuth
          </span>
        </SettingRow>
      </Section>

      <Section
        title="Region"
        description="GrowthAI uses your timezone to place tasks and weekly activity on the right day."
      >
        <form action={action} className="divide-y divide-neutral-100">
          <input type="hidden" name="section" value="general" />
          <SettingRow label="Timezone" align="start">
            <div className="w-full max-w-md">
              <Input
                name="timezone"
                list="timezone-suggestions"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                required
                className="h-11 rounded-lg border-[#343434] bg-[#171717] px-3 text-sm font-normal text-[#e8e8e5]"
              />
              <datalist id="timezone-suggestions">
                {timezoneSuggestions.map((suggestion) => (
                  <option value={suggestion} key={suggestion} />
                ))}
              </datalist>
              <p className="mt-2 text-xs leading-5 text-[#777773]">
                Use an IANA timezone such as Asia/Kolkata.
              </p>
              {detectedTimezone ? (
                <button
                  type="button"
                  onClick={() => setTimezone(detectedTimezone)}
                  className="mt-2 text-xs font-medium text-primary underline underline-offset-4"
                >
                  Use detected timezone: {detectedTimezone}
                </button>
              ) : null}
            </div>
          </SettingRow>
          <FormFooter state={state} pending={pending} />
        </form>
      </Section>
    </SettingsPanel>
  );
}

function CoachPanel({
  preferences,
}: {
  preferences: AccountOverview["preferences"];
}) {
  const [state, action, pending] = useActionState(
    updateSettingsAction,
    {} as SettingsActionState,
  );
  const tones = [
    {
      id: "supportive",
      title: "Supportive",
      text: "Gentle encouragement with extra context.",
      icon: HeartHandshake,
    },
    {
      id: "balanced",
      title: "Balanced",
      text: "Warm, clear, and practical by default.",
      icon: Sparkles,
    },
    {
      id: "blunt",
      title: "Direct",
      text: "Concise guidance that gets to the point.",
      icon: Zap,
    },
  ] as const;
  return (
    <SettingsPanel
      id="coach"
      eyebrow="Conversation"
      title="AI coach"
      description="Choose how GrowthAI should communicate while keeping its safety boundaries unchanged."
    >
      <Section
        title="Conversation style"
        description="This changes tone—not the quality, privacy, or safety rules of your guidance."
      >
        <form action={action} className="p-5 sm:p-6">
          <input type="hidden" name="section" value="coach" />
          <fieldset className="grid gap-3 md:grid-cols-3">
            <legend className="sr-only">Conversation style</legend>
            {tones.map((tone) => {
              const Icon = tone.icon;
              return (
                <label key={tone.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="coachTone"
                    value={tone.id}
                    defaultChecked={preferences.coachTone === tone.id}
                    className="peer sr-only"
                  />
                  <span className="flex h-full min-h-40 flex-col rounded-xl border border-[#303030] bg-[#151515] p-5 transition hover:border-[#444] peer-checked:border-primary/60 peer-checked:bg-[#1b2426] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-checked:[&_.tone-check]:opacity-100">
                    <Icon className="size-4 text-primary" />
                    <span className="mt-6 text-base font-medium">
                      {tone.title}
                    </span>
                    <span className="mt-2 text-sm font-normal leading-6 text-[#92928e]">
                      {tone.text}
                    </span>
                    <Check className="tone-check absolute right-4 top-4 size-4 opacity-0" />
                  </span>
                </label>
              );
            })}
          </fieldset>
          <FormFooter state={state} pending={pending} inset={false} />
        </form>
      </Section>

      <Section
        title="What stays consistent"
        description="These principles apply in every conversation style."
      >
        <InfoRow
          icon={ShieldCheck}
          title="Grounded guidance"
          text="Suggestions are based on what you share, with uncertainty kept visible."
        />
        <InfoRow
          icon={LockKeyhole}
          title="Clear boundaries"
          text="GrowthAI does not diagnose, impersonate therapy, or give high-stakes directives."
        />
        <InfoRow
          icon={Sparkles}
          title="Actionable by design"
          text="Plans stay small, editable, and connected to goals you approve."
        />
      </Section>
    </SettingsPanel>
  );
}

function BillingPanel({ planTier }: { planTier: SettingsUser["planTier"] }) {
  const resolvedPlan = getPlan(planTier === "team" ? "pro" : planTier);
  return (
    <SettingsPanel
      id="billing"
      eyebrow="Subscription"
      title="Plan & billing"
      description="Review your entitlement and manage subscription renewal securely."
    >
      <div className="border-y border-[#303030]">
        <div className="flex flex-col gap-5 bg-[#151515] px-6 py-7 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[.14em] text-primary">
              Current plan
            </p>
            <p className="mt-3 text-3xl font-semibold">{resolvedPlan.name}</p>
            <p className="mt-2 max-w-md text-sm font-normal leading-6 text-[#94948f]">
              {resolvedPlan.description}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-2xl font-semibold">
              {resolvedPlan.monthlyPrice
                ? `₹${resolvedPlan.monthlyPrice}`
                : "₹0"}
            </p>
            <p className="mt-1 text-xs text-[#858581]">
              {resolvedPlan.monthlyPrice ? "per month" : "no recurring charge"}
            </p>
          </div>
        </div>
        <div className="px-6 py-7">
          <ul className="grid gap-4 sm:grid-cols-2">
            {resolvedPlan.features.map((feature) => (
              <li
                key={feature}
                className="flex gap-2.5 text-sm font-normal leading-6 text-[#b8b8b3]"
              >
                <Check className="mt-1 size-4 shrink-0 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3 border-t border-[#292929] pt-6">
            {planTier === "free" ? (
              <UpgradeTrigger
                feature="GrowthAI Pro"
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Compare paid plans
              </UpgradeTrigger>
            ) : null}
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-lg px-4 text-sm font-medium"
            >
              <Link href="/billing">
                Manage billing <ChevronRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Section
        title="Payment security"
        description="GrowthAI never stores card numbers, CVV, or banking credentials."
      >
        <InfoRow
          icon={LockKeyhole}
          title="Hosted checkout"
          text="Payment details are entered directly on Razorpay’s secure checkout."
        />
        <InfoRow
          icon={ShieldCheck}
          title="Verified access"
          text="Paid features activate only after a signed provider event matches your subscription."
        />
      </Section>
    </SettingsPanel>
  );
}

function PrivacyPanel({
  email,
  retentionDays,
}: {
  email: string;
  retentionDays: number;
}) {
  return (
    <SettingsPanel
      id="privacy"
      eyebrow="Your information"
      title="Privacy & data"
      description="Understand what is stored, download a copy, or permanently remove your account."
    >
      <p className="text-sm leading-7 text-[#b0b0ab]">
        Read the{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Notice
        </Link>
        ,{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Terms
        </Link>
        ,{" "}
        <Link href="/security" className="underline underline-offset-4">
          Security practices
        </Link>
        , and{" "}
        <Link href="/ai-safety" className="underline underline-offset-4">
          AI safety notice
        </Link>
        .
      </p>
      <Section
        title="Your data"
        description="Your stored context makes conversations and planning coherent across sessions."
      >
        <InfoRow
          icon={Sparkles}
          title="Growth context"
          text="Chats, approved goals, tasks, and preferences used to run your workspace."
        />
        <InfoRow
          icon={CreditCard}
          title="Billing records"
          text="Provider subscription identifiers and lifecycle status—never card or banking details."
        />
        <div className="flex items-center justify-between gap-4 px-1 py-6">
          <div>
            <p className="text-sm font-medium text-[#dededb]">
              Download your information
            </p>
            <p className="mt-1 text-xs leading-5 text-[#a3a39e]">
              Export the data associated with your account as JSON. A sign-in
              from the last 15 minutes is required.
            </p>
          </div>
          <AccountExportControl />
        </div>
      </Section>
      <Section
        title="Retention, AI memory, and privacy requests"
        description="These controls are independent from deleting your whole account."
      >
        <PrivacyControls initialRetentionDays={retentionDays} />
      </Section>
      <div className="border-y border-red-500/25 bg-red-500/[.035] px-1 py-7 sm:px-0">
        <p className="text-xs font-medium uppercase tracking-[.14em] text-red-400">
          Danger zone
        </p>
        <h2 className="mt-3 text-xl font-semibold text-[#f0f0ed]">
          Permanently delete account
        </h2>
        <div className="mt-4">
          <DangerZone email={email} hideExport />
        </div>
      </div>
    </SettingsPanel>
  );
}

function SettingsPanel({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: TabId;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`settings-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`settings-tab-${id}`}
      className="mx-auto w-full max-w-5xl space-y-12 px-6 py-10 sm:px-10 lg:px-14 lg:py-14"
    >
      <header>
        <p className="text-xs font-medium uppercase tracking-[.14em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-.025em] text-[#f5f5f3] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-base font-normal leading-7 text-[#999994]">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[#303030]">
      <div className="border-b border-[#292929] py-6">
        <h3 className="text-lg font-semibold text-[#ededeb]">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm font-normal leading-6 text-[#858581]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="divide-y divide-[#292929]">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "grid gap-4 py-5 sm:grid-cols-[minmax(170px,.55fr)_minmax(0,1fr)] sm:py-6",
        align === "center" ? "sm:items-center" : "sm:items-start",
      )}
    >
      <p className="text-sm font-normal text-[#c5c5c0]">{label}</p>
      <div className="min-w-0 sm:justify-self-stretch">{children}</div>
    </div>
  );
}

function ReadOnlyValue({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center rounded-lg border border-[#343434] bg-[#171717] px-3 text-sm font-normal text-[#dededb]">
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 py-6">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1d1d1d]">
        <Icon className="size-4 text-[#aaa9a5]" />
      </span>
      <div>
        <p className="text-sm font-medium text-[#dededb]">{title}</p>
        <p className="mt-1.5 text-sm font-normal leading-6 text-[#858581]">
          {text}
        </p>
      </div>
    </div>
  );
}

function FormFooter({
  state,
  pending,
  inset = true,
}: {
  state: SettingsActionState;
  pending: boolean;
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex min-h-11 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        inset && "pb-1",
      )}
    >
      <div aria-live="polite">
        {state.error ? (
          <p className="text-sm font-normal text-red-400">{state.error}</p>
        ) : state.success ? (
          <p className="flex items-center gap-2 text-sm font-normal text-emerald-400">
            <Check className="size-4" />
            {state.success}
          </p>
        ) : null}
      </div>
      <Button
        disabled={pending}
        className="h-10 self-start rounded-lg px-5 text-sm font-semibold sm:self-auto"
      >
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
