"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useCallback, useState, useTransition } from "react"
import { MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react"

import {
  deleteConversationAction,
  renameConversationAction,
  toggleConversationPinAction,
  type ConversationActionState,
} from "@/app/(user)/conversation-actions"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ConversationHistoryItemProps = {
  conversation: { id: string; title: string; pinned: boolean }
  active: boolean
}

export function ConversationHistoryItem({ conversation, active }: ConversationHistoryItemProps) {
  const router = useRouter()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [, startPinTransition] = useTransition()
  const [deleteTransitionPending, startDeleteTransition] = useTransition()
  const submitRename = useCallback(async (previous: ConversationActionState, formData: FormData) => {
    const result = await renameConversationAction(previous, formData)
    if (result.success) setRenameOpen(false)
    return result
  }, [])
  const submitDelete = useCallback(async (previous: ConversationActionState, formData: FormData) => {
    const result = await deleteConversationAction(previous, formData)
    if (result.success) {
      setDeleteOpen(false)
      if (active) router.replace("/chat?new=1")
      else router.refresh()
    }
    return result
  }, [active, router])
  const [renameState, renameAction, renamePending] = useActionState(submitRename, {} as ConversationActionState)
  const [pinState, pinAction, pinPending] = useActionState(toggleConversationPinAction, {} as ConversationActionState)
  const [deleteState, deleteAction, deletePending] = useActionState(submitDelete, {} as ConversationActionState)

  function togglePin() {
    const formData = new FormData()
    formData.set("conversationId", conversation.id)
    formData.set("pinned", String(!conversation.pinned))
    startPinTransition(() => pinAction(formData))
  }

  function deleteConversation() {
    const formData = new FormData()
    formData.set("conversationId", conversation.id)
    startDeleteTransition(() => deleteAction(formData))
  }

  const deleting = deletePending || deleteTransitionPending

  return (
    <>
      <div className={cn("group/chat relative flex items-center rounded-lg transition hover:bg-neutral-800", active && "bg-neutral-100")}>
        <Link
          href={`/chat?conversation=${encodeURIComponent(conversation.id)}`}
          className={cn("min-w-0 flex-1 truncate py-2 pl-2 pr-8 text-xs text-neutral-500 transition group-hover/chat:text-neutral-950", active && "font-semibold text-neutral-950")}
          title={conversation.title}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {conversation.pinned ? <Pin className="size-3 shrink-0 text-primary" fill="currentColor" /> : null}
            <span className="truncate">{conversation.title}</span>
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${conversation.title}`}
              className="absolute right-1 flex size-7 items-center justify-center rounded-md text-neutral-400 opacity-60 transition hover:bg-neutral-700 cursor-pointer hover:text-neutral-900 focus-visible:opacity-100 focus-visible:outline-none sm:opacity-0 sm:group-hover/chat:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-40">
            <DropdownMenuItem disabled={pinPending} onSelect={togglePin} className="cursor-pointer">
              {conversation.pinned ? <PinOff /> : <Pin />}{conversation.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setRenameOpen(true)} className="cursor-pointer"><Pencil />Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)} className="cursor-pointer"><Trash2 />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {pinState.error ? <p role="alert" className="px-2 pb-1 text-[11px] leading-4 text-red-500">{pinState.error}</p> : null}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>Choose a short title that will be easy to recognize later.</DialogDescription>
          </DialogHeader>
          <form action={renameAction} className="space-y-4">
            <input type="hidden" name="conversationId" value={conversation.id} />
            <Input name="title" defaultValue={conversation.title} minLength={2} maxLength={64} autoFocus required />
            {renameState.error ? <p className="text-xs text-red-600">{renameState.error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
              <Button disabled={renamePending}>{renamePending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>The conversation and its messages will be permanently removed. Tasks you already approved will stay in Tasks.</AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            {deleteState.error ? <p role="alert" className="mb-3 text-sm text-red-500">{deleteState.error}</p> : null}
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={deleting}>Cancel</AlertDialogCancel>
              <Button type="button" variant="destructive" disabled={deleting} onClick={deleteConversation}>
                {deleting ? "Deleting…" : "Delete chat"}
              </Button>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
