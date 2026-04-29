import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

const f = createUploadthing()

export const ourFileRouter = {
  comparisonEvidence: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    image: { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions)
      if (!session?.user) throw new UploadThingError("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Upload complete for userId: ${metadata.userId}`)
      console.log(`File name: ${file.name}, size: ${file.size}, url: ${file.url}`)
      return { uploadedBy: metadata.userId, fileKey: file.key }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
