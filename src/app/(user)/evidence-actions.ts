"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { addComparisonEvidence } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { EvidenceType } from "@/lib/db"

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function uploadEvidenceAction(input: {
  comparisonId: string
  fileName: string
  fileType: "pdf" | "image"
  fileUrl: string
  fileKey: string
}): Promise<{ success: boolean; error?: string; evidenceId?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    // Extract text from the uploaded file using Gemini vision
    let extractedText = ""
    try {
      const response = await fetch(input.fileUrl)
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")

      const model = client.getGenerativeModel({ model: "gemini-2.0-flash" })

      const mimeType =
        input.fileType === "pdf" ? "application/pdf" : "image/jpeg"

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64,
            mimeType: mimeType,
          },
        },
        {
          text: "Extract and summarize all text and relevant information from this document or image. Focus on facts, prices, specifications, reviews, and any important details.",
        },
      ])

      extractedText =
        result.response.text() ||
        "Unable to extract text from this file automatically."
    } catch (error) {
      console.error("Error extracting text:", error)
      extractedText = "Text extraction failed - file may not contain readable text"
    }

    // Save to database
    const evidence = await addComparisonEvidence({
      comparisonId: input.comparisonId,
      userId: session.user.id,
      fileName: input.fileName,
      fileType: (input.fileType === "pdf" ? "pdf" : "image") as EvidenceType,
      fileUrl: input.fileUrl,
      fileKey: input.fileKey,
      extractedText,
      evidenceSummary: extractedText.slice(0, 500), // First 500 chars as summary
    })

    if (!evidence) {
      return { success: false, error: "Failed to save evidence to database" }
    }

    return { success: true, evidenceId: evidence.id }
  } catch (error) {
    console.error("Error uploading evidence:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
