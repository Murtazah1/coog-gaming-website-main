"use client";

import dayjs from "dayjs";
import { Pen, Trash2 } from "lucide-react";
import { useEventDialogStore } from "@/lib/store";
import { deleteEvent } from "@/server/events";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { Event } from "@/db/schema/events";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  view: "month" | "week" | "day";
}

export default function EventCard({ event, view }: EventCardProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    if (!confirm(`Delete event ${event.title}?`)) return;
    setDeleting(true);
    try {
      const { error } = await deleteEvent(event.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Event Deleted");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const { openEdit } = useEventDialogStore();
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-sm bg-red-600 p-1 text-sm text-white w-[85%]"
      )}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="min-w-0">
        <p className="truncate">{event.title}</p>

        {view !== "month" && (
          <p className="text-xs">
            {dayjs(event.startDate).format("h:mm A")}
            {" - "}
            {dayjs(event.endDate).format("h:mm A")}
          </p>
        )}
      </div>

      <div className="flex">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label={`Edit ${event.title}`}
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            openEdit(event);
          }}
        >
          <Pen className="h-3 w-3" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label={`Delete ${event.title}`}
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
