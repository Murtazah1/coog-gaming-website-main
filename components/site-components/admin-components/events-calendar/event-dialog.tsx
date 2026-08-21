"use client";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEventDialogStore } from "@/lib/store";

import EventForm, {
  type EventAdminOption,
} from "./event-form";

interface EventDialogProps {
  admins: EventAdminOption[];
}

export default function EventDialog({
  admins,
}: EventDialogProps) {
  const {
    open,
    mode,
    selectedEvent,
    selectedStartDate,
    closeDialog,
  } = useEventDialogStore();

  const router = useRouter();

  // called after successfully creating/updating an event
  function handleSuccess() {
    // close the dialog
    closeDialog();

    // refresh the server components so the
    // calendar gets the newest event data
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // shadcn calls this when the user:
        // - clicks outside the dialog
        // - presses escape
        // - clicks the X button
        if (!isOpen) {
          closeDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Create Event"
              : "Edit Event"}
          </DialogTitle>
        </DialogHeader>

        {/* CREATE EVENT */}

        {mode === "create" &&
          selectedStartDate && (
            <EventForm
              mode="create"
              initialDate={
                selectedStartDate
              }
              admins={admins}
              onSuccess={handleSuccess}
              onCancel={closeDialog}
            />
          )}

        {/* EDIT EVENT */}

        {mode === "edit" &&
          selectedEvent && (
            <EventForm
              mode="edit"
              event={selectedEvent}
              admins={admins}
              onSuccess={handleSuccess}
              onCancel={closeDialog}
            />
          )}
      </DialogContent>
    </Dialog>
  );
}