"use client";

import type { Event } from "@/db/schema/events";

interface VisitorEventTagProps {
  event: Event;
}

export default function VisitorEventTag({ event }: VisitorEventTagProps) {
  return (
    <div
      className="
        w-full
        truncate
        rounded
        bg-red-700/90
        px-2
        py-1
        text-left
        text-sm
        font-semibold
        text-white
      "
    >
      {event.title}
    </div>
  );
}
