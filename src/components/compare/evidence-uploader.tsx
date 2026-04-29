"use client"

import { useState } from "react"
import { UploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, FileUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface UploadedFile {
  id: string
  name: string
  type: "pdf" | "image" | "screenshot"
  url: string
  fileKey: string
  uploadedAt: string
}

interface EvidenceUploaderProps {
  comparisonId: string
  onFilesUploaded: (files: UploadedFile[]) => void
  existingFiles?: UploadedFile[]
  maxFiles?: number
}

export function EvidenceUploader({
  onFilesUploaded,
  existingFiles = [],
  maxFiles = 10,
}: EvidenceUploaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const remainingSlots = maxFiles - existingFiles.length

  if (remainingSlots <= 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Maximum file limit ({maxFiles}) reached. Remove files to add more.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-100">Upload Evidence</h3>
          <p className="text-sm text-zinc-400">
            {remainingSlots} of {maxFiles} slots available
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isOpen ? (
        <Card className="border-dashed border-2 border-zinc-700 bg-zinc-950/50 p-6">
          <UploadDropzone<OurFileRouter, "comparisonEvidence">
            endpoint="comparisonEvidence"
            onClientUploadComplete={(res) => {
              const uploadedFiles: UploadedFile[] = res.map((r) => ({
                id: crypto.randomUUID(),
                name: r.name ?? "Uploaded file",
                type: r.name?.toLowerCase().includes(".pdf") ? "pdf" : "image",
                url: r.url,
                fileKey: r.key ?? "",
                uploadedAt: new Date().toISOString(),
              }))
              
              onFilesUploaded(uploadedFiles)
              setIsOpen(false)
              setError(null)
            }}
            onUploadError={(error: Error) => {
              setError(error.message || "Upload failed")
            }}
            onUploadBegin={() => {
              setIsLoading(true)
            }}
          />
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
          disabled={isLoading || remainingSlots <= 0}
        >
          <FileUp className="mr-2 h-4 w-4" />
          {isLoading ? "Uploading..." : "Click to Upload or Drag & Drop"}
        </Button>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-300">Uploaded Files</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {existingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-900/50 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
