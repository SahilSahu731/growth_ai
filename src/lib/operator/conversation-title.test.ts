import { describe, expect, it } from "vitest"
import { conversationTitle } from "../../../convex/lib/conversationTitle"

describe("conversationTitle", () => {
  it("turns common first messages into useful concise titles", () => {
    expect(conversationTitle("I feel stuck but don't know why")).toBe("Finding Direction When Feeling Stuck")
    expect(conversationTitle("I know what I want but cannot stay consistent")).toBe("Building Better Consistency")
  })

  it("removes conversational filler and limits long titles", () => {
    expect(conversationTitle("Hey, now I want you to help me build a realistic plan for changing careers this year")).toBe("Build a Realistic Plan for Changing Careers")
    expect(conversationTitle("Can you organize my goals and tasks? I have too much going on.")).toBe("Organize My Goals and Tasks")
  })
})
