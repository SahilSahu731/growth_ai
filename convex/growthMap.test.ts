/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")
const identity = { tokenIdentifier: "test|member", subject: "member:user-1", role: "member", scope: "operator:member" }

async function seedAccount(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    const timestamp = new Date().toISOString()
    await ctx.db.insert("users", { legacyId: "user-1", name: "Map Tester", email: "map@example.test", authProvider: "google", providerAccountId: "map-fixture", emailVerifiedAt: timestamp, planTier: "free", createdAt: timestamp, updatedAt: timestamp })
  })
}

describe("growth roadmaps", () => {
  it("creates dependency-aware milestones and unlocks the next one", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const server = t.withIdentity(identity)
    const map = await server.mutation(api.growthMap.createRoadmap, {
      userId: "user-1", title: "DSA interview map", topic: "DSA", outcome: "Solve medium interview problems independently", source: "manual",
      nodes: [
        { key: "complexity", title: "Complexity analysis", description: "Analyze runtime and memory", stage: 1, type: "foundation", estimatedHours: 8, parentKeys: [] },
        { key: "arrays", title: "Arrays and hashing", description: "Solve common array patterns", stage: 2, type: "core", estimatedHours: 12, parentKeys: ["complexity"] },
      ],
    })
    const initial = await server.query(api.growthMap.getRoadmaps, { userId: "user-1" })
    const first = initial.nodes.find((node) => node.title === "Complexity analysis")
    const second = initial.nodes.find((node) => node.title === "Arrays and hashing")
    expect(map.title).toBe("DSA interview map")
    expect(first?.status).toBe("available")
    expect(second?.status).toBe("locked")
    await server.mutation(api.growthMap.setRoadmapNodeStatus, { userId: "user-1", nodeId: first!.id, status: "completed" })
    const updated = await server.query(api.growthMap.getRoadmaps, { userId: "user-1" })
    expect(updated.nodes.find((node) => node.id === second!.id)?.status).toBe("available")
  })

  it("prevents starting a milestone before its prerequisites", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t)
    const server = t.withIdentity(identity)
    await server.mutation(api.growthMap.createRoadmap, {
      userId: "user-1", title: "Web development", topic: "Web development", outcome: "Deploy a full-stack application", source: "ai",
      nodes: [
        { key: "html", title: "Semantic HTML", description: "Build accessible pages", stage: 1, type: "foundation", estimatedHours: 6, parentKeys: [] },
        { key: "react", title: "React", description: "Build interactive interfaces", stage: 2, type: "core", estimatedHours: 20, parentKeys: ["html"] },
      ],
    })
    const data = await server.query(api.growthMap.getRoadmaps, { userId: "user-1" })
    const locked = data.nodes.find((node) => node.title === "React")!
    await expect(server.mutation(api.growthMap.setRoadmapNodeStatus, { userId: "user-1", nodeId: locked.id, status: "in_progress" })).rejects.toThrow("ROADMAP_NODE_LOCKED")
  })
})
