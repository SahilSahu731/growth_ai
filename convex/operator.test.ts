/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")
const identity = { tokenIdentifier: "test|member", subject: "member:user-1", role: "member", scope: "operator:member" }
const adminIdentity = { tokenIdentifier: "test|admin", subject: "admin:test", role: "admin", scope: "admin:read" }
const adminWriteIdentity = { ...adminIdentity, scope: "admin:write" }
const backgroundIdentity = { tokenIdentifier: "test|background", subject: "background:ai-provider", role: "background", scope: "operator:provider" }
const billingIdentity = { ...identity, scope: "billing:write" }

function stamp(index = 0) {
  return new Date(Date.UTC(2026, 7, 1, 0, 0, index)).toISOString()
}

async function seedAccount(t: ReturnType<typeof convexTest>, planTier: "free" | "pro" = "free") {
  return t.run(async (ctx) => {
    const timestamp = stamp()
    await ctx.db.insert("users", {
      legacyId: "user-1",
      name: "Alex Example",
      email: "alex@example.test",
      authProvider: "google",
      providerAccountId: "google-fixture-1",
      emailVerifiedAt: timestamp,
      planTier,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await ctx.db.insert("operatorConversations", {
      legacyId: "conversation-1",
      userId: "user-1",
      title: "Fixture conversation",
      state: "discovery",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  })
}

describe("operator invariants", () => {
  it("returns the newest 80 messages and paginates older history", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    await t.run(async (ctx) => {
      for (let index = 0; index < 500; index += 1) {
        await ctx.db.insert("operatorMessages", {
          legacyId: `message-${index}`,
          userId: "user-1",
          conversationId: "conversation-1",
          role: "user",
          content: `Message ${index}`,
          quickReplies: [],
          taskDrafts: [],
          createdAt: stamp(index),
        })
      }
    })
    const server = t.withIdentity(identity)
    const workspace = await server.query(api.operator.getWorkspace, { userId: "user-1", conversationId: "conversation-1" })
    expect(workspace?.messages).toHaveLength(80)
    expect(workspace?.messages[0]?.content).toBe("Message 420")
    expect(workspace?.messages.at(-1)?.content).toBe("Message 499")
    expect(workspace?.hasMoreMessages).toBe(true)

    let cursor = workspace?.messageCursor ?? null
    let done = !workspace?.hasMoreMessages
    let allMessages = [...(workspace?.messages ?? [])]
    while (!done) {
      const older = await server.query(api.operator.getMessagePage, {
        userId: "user-1",
        conversationId: "conversation-1",
        paginationOpts: { cursor, numItems: 80 },
      })
      allMessages = [...older.page, ...allMessages]
      cursor = older.continueCursor
      done = older.isDone
    }
    expect(allMessages).toHaveLength(500)
    expect(allMessages[0]?.content).toBe("Message 0")
    expect(allMessages.at(-1)?.content).toBe("Message 499")
  })

  it("enforces active-goal limits on reactivation and clears completion state", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    await t.run(async (ctx) => {
      for (let index = 0; index < 3; index += 1) {
        await ctx.db.insert("operatorGoals", {
          legacyId: `active-${index}`,
          userId: "user-1",
          title: `Active ${index}`,
          description: "Fixture",
          status: "active",
          createdAt: stamp(index),
          updatedAt: stamp(index),
        })
      }
      await ctx.db.insert("operatorGoals", {
        legacyId: "completed-1",
        userId: "user-1",
        title: "Completed goal",
        description: "Fixture",
        status: "completed",
        completedAt: stamp(4),
        createdAt: stamp(4),
        updatedAt: stamp(4),
      })
    })
    const server = t.withIdentity(identity)
    await expect(server.mutation(api.operator.updateGoal, {
      userId: "user-1", goalId: "completed-1", title: "Completed goal", description: "Fixture", status: "active",
    })).rejects.toThrow("GOAL_LIMIT_REACHED")

    await server.mutation(api.operator.updateGoal, {
      userId: "user-1", goalId: "active-0", title: "Active 0", description: "Fixture", status: "completed",
    })
    const reopened = await server.mutation(api.operator.updateGoal, {
      userId: "user-1", goalId: "active-0", title: "Active 0", description: "Fixture", status: "active",
    })
    expect(reopened.completedAt).toBeUndefined()
  })

  it.each([
    ["free", 3],
    ["pro", 25],
  ] as const)("enforces the %s goal limit on creation and reactivation", async (planTier, limit) => {
    const t = convexTest(schema, modules)
    await seedAccount(t, planTier)
    await t.run(async (ctx) => {
      for (let index = 0; index < limit; index += 1) {
        await ctx.db.insert("operatorGoals", {
          legacyId: `goal-${index}`, userId: "user-1", title: `Goal ${index}`, description: "Fixture", status: "active", createdAt: stamp(index), updatedAt: stamp(index),
        })
      }
      await ctx.db.insert("operatorGoals", {
        legacyId: "archived-goal", userId: "user-1", title: "Archived goal", description: "Fixture", status: "archived", createdAt: stamp(), updatedAt: stamp(),
      })
    })
    const server = t.withIdentity(identity)
    await expect(server.mutation(api.operator.createGoal, { userId: "user-1", title: "One goal too many", description: "Fixture" })).rejects.toThrow(/goal limit|active goals/i)
    await expect(server.mutation(api.operator.updateGoal, {
      userId: "user-1", goalId: "archived-goal", title: "Archived goal", description: "Fixture", status: "active",
    })).rejects.toThrow("GOAL_LIMIT_REACHED")
  })

  it("applies the shared limit to admin reactivation and plan downgrades", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t, "pro")
    await t.run(async (ctx) => {
      for (let index = 0; index < 4; index += 1) {
        await ctx.db.insert("operatorGoals", {
          legacyId: `active-${index}`, userId: "user-1", title: `Active ${index}`, description: "Fixture", status: "active", createdAt: stamp(index), updatedAt: stamp(index),
        })
      }
      await ctx.db.insert("operatorGoals", {
        legacyId: "archived-1", userId: "user-1", title: "Archived", description: "Fixture", status: "archived", createdAt: stamp(), updatedAt: stamp(),
      })
    })
    const server = t.withIdentity(adminWriteIdentity)
    await expect(server.mutation(api.admin.updateUser, { actor: "owner@example.test", userId: "user-1", name: "Alex Example", planTier: "free" })).rejects.toThrow("PLAN_ASSIGNMENT_RETIRED")

    await t.run(async (ctx) => {
      const user = await ctx.db.query("users").withIndex("by_legacy_id", (q) => q.eq("legacyId", "user-1")).unique()
      if (user) await ctx.db.patch(user._id, { planTier: "free" })
    })
    await expect(server.mutation(api.admin.setGoalStatus, { actor: "owner@example.test", userId: "user-1", goalId: "archived-1", status: "active" })).rejects.toThrow("GOAL_LIMIT_REACHED")
  })

  it("rejects duplicate goal titles during update", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    await t.run(async (ctx) => {
      for (const [legacyId, title] of [["goal-a", "Career Focus"], ["goal-b", "Health Focus"]] as const) {
        await ctx.db.insert("operatorGoals", { legacyId, userId: "user-1", title, description: "Fixture", status: "active", createdAt: stamp(), updatedAt: stamp() })
      }
    })
    await expect(t.withIdentity(identity).mutation(api.operator.updateGoal, {
      userId: "user-1", goalId: "goal-b", title: "  career   focus ", description: "Fixture", status: "active",
    })).rejects.toThrow("DUPLICATE_GOAL")
    const duplicate = await t.withIdentity(identity).mutation(api.operator.createGoal, {
      userId: "user-1", title: " career  focus ", description: "Duplicate fixture",
    })
    expect(duplicate.duplicate).toBe(true)
    expect(duplicate.goal.id).toBe("goal-a")
  })

  it("supports the complete goal lifecycle and only deletes goals without task history", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const server = t.withIdentity(identity)
    const created = await server.mutation(api.operator.createGoal, { userId: "user-1", title: "Lifecycle goal", description: "Initial" })
    const edited = await server.mutation(api.operator.updateGoal, { userId: "user-1", goalId: created.goal.id, title: "Lifecycle edited", description: "Edited", status: "active" })
    expect(edited.title).toBe("Lifecycle edited")
    const completed = await server.mutation(api.operator.updateGoal, { userId: "user-1", goalId: created.goal.id, title: "Lifecycle edited", description: "Edited", status: "completed" })
    expect(completed.completedAt).toBeTruthy()
    const archived = await server.mutation(api.operator.updateGoal, { userId: "user-1", goalId: created.goal.id, title: "Lifecycle edited", description: "Edited", status: "archived" })
    expect(archived.completedAt).toBeUndefined()
    const reopened = await server.mutation(api.operator.updateGoal, { userId: "user-1", goalId: created.goal.id, title: "Lifecycle edited", description: "Edited", status: "active" })
    expect(reopened.completedAt).toBeUndefined()
    await expect(server.mutation(api.operator.deleteGoal, { userId: "user-1", goalId: created.goal.id })).resolves.toBe(true)
  })

  it("sets and clears completedAt across todo, done, and dismissed task transitions", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    await t.run(async (ctx) => {
      await ctx.db.insert("operatorTasks", {
        legacyId: "task-1", userId: "user-1", conversationId: "conversation-1", sourceMessageId: "message-1", goalId: "goal-1",
        title: "Fixture task", note: "", status: "todo", estimatedMinutes: 20, completionCondition: "Complete", scheduledFor: "2026-08-07",
        position: 0, createdAt: stamp(), updatedAt: stamp(),
      })
    })
    const server = t.withIdentity(identity)
    await server.mutation(api.operator.setTaskStatus, { userId: "user-1", taskId: "task-1", status: "done" })
    let task = await t.run((ctx) => ctx.db.query("operatorTasks").withIndex("by_legacy_id", (q) => q.eq("legacyId", "task-1")).unique())
    expect(task?.completedAt).toBeTruthy()
    await server.mutation(api.operator.setTaskStatus, { userId: "user-1", taskId: "task-1", status: "dismissed" })
    task = await t.run((ctx) => ctx.db.query("operatorTasks").withIndex("by_legacy_id", (q) => q.eq("legacyId", "task-1")).unique())
    expect(task?.completedAt).toBeUndefined()
    await server.mutation(api.operator.setTaskStatus, { userId: "user-1", taskId: "task-1", status: "todo" })
    task = await t.run((ctx) => ctx.db.query("operatorTasks").withIndex("by_legacy_id", (q) => q.eq("legacyId", "task-1")).unique())
    expect(task?.completedAt).toBeUndefined()
  })

  it("matches dashboard totals and weekly completions to source task state", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const recent = new Date().toISOString()
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    await t.run(async (ctx) => {
      const fixtures = [
        { legacyId: "done-recent", status: "done" as const, completedAt: recent },
        { legacyId: "dismissed-recent", status: "dismissed" as const, completedAt: recent },
        { legacyId: "done-old", status: "done" as const, completedAt: old },
        { legacyId: "todo", status: "todo" as const, completedAt: undefined },
      ]
      for (const [index, fixture] of fixtures.entries()) {
        await ctx.db.insert("operatorTasks", {
          legacyId: fixture.legacyId, userId: "user-1", goalId: "goal-1", title: fixture.legacyId, note: "", status: fixture.status,
          estimatedMinutes: 20, completionCondition: "Complete", scheduledFor: "2026-08-07", position: index, createdAt: stamp(index), updatedAt: recent,
          ...(fixture.completedAt ? { completedAt: fixture.completedAt } : {}),
        })
      }
    })
    const dashboard = await t.withIdentity(adminIdentity).query(api.admin.getDashboard, {})
    expect(dashboard.totals.completedTasks).toBe(2)
    expect(dashboard.totals.openTasks).toBe(1)
    expect(dashboard.lastSevenDays.completedTasks).toBe(1)
  })

  it("does not create an empty goal when every proposed task hits the daily limit", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    await t.run(async (ctx) => {
      await ctx.db.insert("operatorMessages", {
        legacyId: "proposal-1", userId: "user-1", conversationId: "conversation-1", role: "assistant", content: "Proposal", quickReplies: [],
        taskDrafts: [{ title: "Fourth", note: "", estimatedMinutes: 20, completionCondition: "Complete", scheduledFor: "2026-08-07", goalTitle: "Should not exist" }], createdAt: stamp(),
      })
      for (let index = 0; index < 3; index += 1) {
        await ctx.db.insert("operatorTasks", {
          legacyId: `existing-${index}`, userId: "user-1", conversationId: "conversation-1", sourceMessageId: "old-proposal", goalId: "old-goal",
          title: `Existing ${index}`, note: "", status: "todo", estimatedMinutes: 20, completionCondition: "Complete", scheduledFor: "2026-08-07",
          position: index, createdAt: stamp(index), updatedAt: stamp(index),
        })
      }
    })
    const result = await t.withIdentity(identity).mutation(api.operator.acceptTasks, { userId: "user-1", conversationId: "conversation-1", messageId: "proposal-1" })
    expect(result.created).toBe(0)
    const goals = await t.run((ctx) => ctx.db.query("operatorGoals").collect())
    expect(goals).toEqual([])
  })

  it("serializes concurrent proposal acceptance without exceeding three tasks", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    await t.run(async (ctx) => {
      for (const messageId of ["proposal-a", "proposal-b"]) {
        await ctx.db.insert("operatorMessages", {
          legacyId: messageId, userId: "user-1", conversationId: "conversation-1", role: "assistant", content: "Proposal", quickReplies: [],
          taskDrafts: [0, 1].map((index) => ({ title: `${messageId}-${index}`, note: "", estimatedMinutes: 20, completionCondition: "Complete", scheduledFor: "2026-08-07", goalTitle: "Shared goal" })),
          createdAt: stamp(),
        })
      }
    })
    const server = t.withIdentity(identity)
    await Promise.all([
      server.mutation(api.operator.acceptTasks, { userId: "user-1", conversationId: "conversation-1", messageId: "proposal-a" }),
      server.mutation(api.operator.acceptTasks, { userId: "user-1", conversationId: "conversation-1", messageId: "proposal-b" }),
    ])
    const tasks = await t.run((ctx) => ctx.db.query("operatorTasks").collect())
    expect(tasks).toHaveLength(3)
  })

  it("makes message submission idempotent and generation completion single-write", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const server = t.withIdentity(identity)
    const first = await server.mutation(api.operator.beginTurn, {
      userId: "user-1", conversationId: "conversation-1", requestId: "request_1234567890", leaseId: "lease_123456789000", rateLimitKey: "a".repeat(64), localDate: "2026-08-07", userMessage: "Please help me focus",
    })
    const duplicate = await server.mutation(api.operator.beginTurn, {
      userId: "user-1", conversationId: "conversation-1", requestId: "request_1234567890", leaseId: "lease_999999999999", rateLimitKey: "a".repeat(64), localDate: "2026-08-07", userMessage: "Please help me focus",
    })
    expect(first.acquired).toBe(true)
    expect(duplicate.acquired).toBe(false)

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const replay = await server.mutation(api.operator.beginTurn, {
        userId: "user-1", conversationId: "conversation-1", requestId: "request_1234567890", leaseId: `lease_replay_${attempt}_123456`, rateLimitKey: "a".repeat(64), localDate: "2026-08-07", userMessage: "Please help me focus",
      })
      expect(replay.acquired).toBe(false)
    }

    const assistant = {
      content: "Let us start with one question.", state: "discovery" as const, quickReplies: [], taskDrafts: [], modelName: "fixture",
      promptVersion: "fixture-v1", latencyMs: 12, generationOutcome: "provider_success",
    }
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await server.mutation(api.operator.completeTurn, {
        userId: "user-1", conversationId: "conversation-1", userMessageId: first.message.id, leaseId: "lease_123456789000", assistant,
      })
    }
    const messages = await t.run((ctx) => ctx.db.query("operatorMessages").collect())
    expect(messages).toHaveLength(2)
  })

  it("persists but does not generate a second simultaneous message for one user", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const server = t.withIdentity(identity)
    const [first, second] = await Promise.all([
      server.mutation(api.operator.beginTurn, {
        userId: "user-1", conversationId: "conversation-1", requestId: "request_concurrent_1", leaseId: "lease_concurrent_111", rateLimitKey: "c".repeat(64), localDate: "2026-08-07", userMessage: "First concurrent message",
      }),
      server.mutation(api.operator.beginTurn, {
        userId: "user-1", conversationId: "conversation-1", requestId: "request_concurrent_2", leaseId: "lease_concurrent_222", rateLimitKey: "c".repeat(64), localDate: "2026-08-07", userMessage: "Second concurrent message",
      }),
    ])
    expect([first.acquired, second.acquired].filter(Boolean)).toHaveLength(1)
    const messages = await t.run((ctx) => ctx.db.query("operatorMessages").collect())
    expect(messages).toHaveLength(2)
    expect(messages.filter((message) => message.generationStatus === "failed" && message.failureCode === "GENERATION_BUSY")).toHaveLength(1)
  })

  it("opens and resets the global provider circuit after consecutive outcomes", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const server = t.withIdentity(backgroundIdentity)
    for (let failure = 1; failure <= 5; failure += 1) {
      const state = await server.mutation(api.operator.recordProviderOutcome, { provider: "gemini", success: false })
      expect(state.consecutiveFailures).toBe(failure)
    }
    let workspace = await t.withIdentity(identity).query(api.operator.getWorkspace, { userId: "user-1", conversationId: "conversation-1" })
    expect(workspace?.providerCircuitOpen).toBe(true)
    await server.mutation(api.operator.recordProviderOutcome, { provider: "gemini", success: true })
    workspace = await t.withIdentity(identity).query(api.operator.getWorkspace, { userId: "user-1", conversationId: "conversation-1" })
    expect(workspace?.providerCircuitOpen).toBe(false)
  })

  it("keeps failed messages retryable", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const server = t.withIdentity(identity)
    const first = await server.mutation(api.operator.beginTurn, {
      userId: "user-1", conversationId: "conversation-1", requestId: "request_retry_1234", leaseId: "lease_retry_123456", rateLimitKey: "b".repeat(64), localDate: "2026-08-07", userMessage: "This should be durable",
    })
    await server.mutation(api.operator.failTurn, {
      userId: "user-1", conversationId: "conversation-1", userMessageId: first.message.id, leaseId: "lease_retry_123456", failureCode: "PROVIDER_DOWN",
    })
    const retry = await server.mutation(api.operator.beginTurn, {
      userId: "user-1", conversationId: "conversation-1", requestId: "request_retry_1234", leaseId: "lease_retry_654321", rateLimitKey: "b".repeat(64), localDate: "2026-08-07", userMessage: "This should be durable",
    })
    expect(retry.acquired).toBe(true)
    expect(retry.message.id).toBe(first.message.id)
  })

  it("snapshots task origins before deleting their conversation", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    await t.run(async (ctx) => {
      await ctx.db.insert("operatorMessages", { legacyId: "source-1", userId: "user-1", conversationId: "conversation-1", role: "assistant", content: "Source", quickReplies: [], taskDrafts: [], createdAt: stamp() })
      await ctx.db.insert("operatorTasks", {
        legacyId: "task-origin", userId: "user-1", conversationId: "conversation-1", sourceMessageId: "source-1", goalId: "goal-1", title: "Retained task", note: "", status: "todo",
        estimatedMinutes: 20, completionCondition: "Complete", scheduledFor: "2026-08-07", position: 0, createdAt: stamp(), updatedAt: stamp(),
      })
    })
    await t.withIdentity(identity).mutation(api.operator.deleteConversation, { userId: "user-1", conversationId: "conversation-1" })
    const task = await t.run((ctx) => ctx.db.query("operatorTasks").withIndex("by_legacy_id", (q) => q.eq("legacyId", "task-origin")).unique())
    expect(task).toMatchObject({ originConversationTitle: "Fixture conversation", originMessageCreatedAt: stamp() })
    expect(task?.conversationId).toBeUndefined()
    expect(task?.sourceMessageId).toBeUndefined()
  })

  it("rejects writes that would create orphaned product records", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const server = t.withIdentity(identity)
    const missingMember = { ...identity, subject: "member:missing-user" }
    await expect(t.withIdentity(missingMember).mutation(api.operator.createConversation, { userId: "missing-user" })).rejects.toThrow("USER_NOT_FOUND")
    await expect(t.withIdentity(missingMember).mutation(api.operator.createGoal, { userId: "missing-user", title: "Orphan goal", description: "Fixture" })).rejects.toThrow("USER_NOT_FOUND")
    await expect(t.withIdentity({ ...billingIdentity, subject: "member:missing-user" }).mutation(api.billing.beginCheckout, { userId: "missing-user", planTier: "pro" })).rejects.toThrow("Account not available")

    await t.run(async (ctx) => {
      await ctx.db.insert("operatorGoals", { legacyId: "goal-with-task", userId: "user-1", title: "Goal with task", description: "Fixture", status: "active", createdAt: stamp(), updatedAt: stamp() })
      await ctx.db.insert("operatorTasks", {
        legacyId: "dependent-task", userId: "user-1", goalId: "goal-with-task", title: "Dependent", note: "", status: "todo", estimatedMinutes: 20,
        completionCondition: "Complete", scheduledFor: "2026-08-07", position: 0, createdAt: stamp(), updatedAt: stamp(),
      })
    })
    await expect(server.mutation(api.operator.deleteGoal, { userId: "user-1", goalId: "goal-with-task" })).rejects.toThrow("GOAL_HAS_TASKS")
    await expect(server.mutation(api.operator.updateTask, {
      userId: "user-1", taskId: "dependent-task", goalId: "missing-goal", title: "Dependent", note: "", estimatedMinutes: 20,
      completionCondition: "Complete", scheduledFor: "2026-08-07",
    })).rejects.toThrow("GOAL_NOT_ACTIVE")
  })
})
