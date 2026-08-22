"use client";

import dayjs from "dayjs";

import type { Event } from "@/db/schema/events";

interface VisitorEventTagProps {
  event: Event;
  
}

export default function VisitorEventTag({
  event,
  
}: VisitorEventTagProps) {
  return (
    <div
      className="
        w-full
        truncate
        rounded
        bg-red-600/80
        px-1.5
        py-0.5
        text-left
        text-[10px]
        font-medium
        text-white
      "
    >
      {event.title}
    </div>
  );
}