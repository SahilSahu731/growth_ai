/* eslint-disable @typescript-eslint/no-explicit-any */
import { internalMutationGeneric as internalMutation } from "convex/server"
import { v } from "convex/values"

const DAY = 24 * 60 * 60 * 1000

function isoDate(offset: number) {
  return new Date(Date.now() + offset * DAY).toISOString().slice(0, 10)
}

export const workspace = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", userId)).unique()
    if (!user) throw new Error("User not found")
    const timestamp = new Date().toISOString()
    let conversation = await ctx.db.query("operatorConversations").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).order("desc").first()
    if (!conversation) {
      const legacyId = crypto.randomUUID()
      const documentId = await ctx.db.insert("operatorConversations", {
        legacyId, userId, title: "Build a life that feels intentional", state: "daily_execution", createdAt: timestamp, updatedAt: timestamp,
      })
      conversation = await ctx.db.get(documentId)
    }
    if (!conversation) throw new Error("Could not create conversation")

    const goalSeeds = [
      { title: "Career momentum", description: "Create visible evidence of useful work and make steady progress toward better opportunities." },
      { title: "Health and energy", description: "Build enough daily energy to do meaningful work without burning out." },
      { title: "Focused learning", description: "Turn learning into small finished outputs instead of collecting more resources." },
    ]
    const existingGoals = await ctx.db.query("operatorGoals").withIndex("by_user_status", (q: any) => q.eq("userId", userId).eq("status", "active")).collect()
    const goals = [...existingGoals]
    for (const seed of goalSeeds) {
      if (goals.length >= 3) break
      if (goals.some((goal: any) => goal.title.toLowerCase() === seed.title.toLowerCase())) continue
      const legacyId = crypto.randomUUID()
      const documentId = await ctx.db.insert("operatorGoals", {
        legacyId, userId, ...seed, status: "active", createdAt: timestamp, updatedAt: timestamp,
      })
      const goal = await ctx.db.get(documentId)
      if (goal) goals.push(goal)
    }
    if (!goals.length) throw new Error("Could not create goals")

    const allTasks = await ctx.db.query("operatorTasks").filter((q: any) => q.eq(q.field("userId"), userId)).collect()
    let migrated = 0
    for (const task of allTasks) {
      if (task.goalId) continue
      await ctx.db.patch(task._id, { goalId: goals[0].legacyId, updatedAt: timestamp })
      migrated += 1
    }

    const taskSeeds = [
      { goalTitle: "Career momentum", title: "Write this week’s one career outcome", note: "Choose one result that would make the week meaningfully better.", estimatedMinutes: 15, completionCondition: "One specific outcome is written in a sentence." },
      { goalTitle: "Health and energy", title: "Schedule one realistic energy reset", note: "Pick a walk, workout, earlier bedtime, or screen-free break that fits your actual day.", estimatedMinutes: 10, completionCondition: "The reset has a time and place on the calendar." },
      { goalTitle: "Focused learning", title: "Finish one small learning output", note: "Build, explain, or solve something that proves what you understood.", estimatedMinutes: 35, completionCondition: "A visible note, solution, or working example exists." },
    ]
    let tasksCreated = 0
    const refreshedTasks = await ctx.db.query("operatorTasks").filter((q: any) => q.eq(q.field("userId"), userId)).collect()
    for (const [index, seed] of taskSeeds.entries()) {
      if (refreshedTasks.some((task: any) => task.title === seed.title)) continue
      const goal = goals.find((item: any) => item.title === seed.goalTitle) ?? goals[index % goals.length]
      await ctx.db.insert("operatorTasks", {
        legacyId: crypto.randomUUID(), userId, conversationId: conversation.legacyId, sourceMessageId: "seed",
        goalId: goal.legacyId, title: seed.title, note: seed.note, status: "todo", estimatedMinutes: seed.estimatedMinutes,
        completionCondition: seed.completionCondition, scheduledFor: isoDate(index), position: index,
        createdAt: timestamp, updatedAt: timestamp,
      })
      tasksCreated += 1
    }

    return { goals: goals.length, tasksCreated, migrated }
  },
})

export const migrateAllTaskGoals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("operatorTasks").collect()
    const missing = tasks.filter((task: any) => !task.goalId)
    let updated = 0
    for (const task of missing) {
      let goal = await ctx.db.query("operatorGoals").withIndex("by_user_status", (q: any) => q.eq("userId", task.userId).eq("status", "active")).first()
      if (!goal) {
        const timestamp = new Date().toISOString()
        const documentId = await ctx.db.insert("operatorGoals", {
          legacyId: crypto.randomUUID(), userId: task.userId, title: "Personal growth",
          description: "A home for tasks created before goals were enabled.", status: "active",
          createdAt: timestamp, updatedAt: timestamp,
        })
        goal = await ctx.db.get(documentId)
      }
      if (!goal) throw new Error(`Could not create a goal for ${task.userId}`)
      await ctx.db.patch(task._id, { goalId: goal.legacyId, updatedAt: new Date().toISOString() })
      updated += 1
    }
    return { scanned: tasks.length, updated }
  },
})
