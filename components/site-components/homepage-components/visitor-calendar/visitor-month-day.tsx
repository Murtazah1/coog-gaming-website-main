"use client";

import dayjs, { type Dayjs } from "dayjs";

import { cn } from "@/lib/utils";
import type { Event } from "@/db/schema/events";

import VisitorEventTag from "./visitor-event-tag";

interface VisitorMonthDayProps {
  day: Dayjs;
  currentMonth: Dayjs;
  events: Event[];
  onDayClick: (day: Dayjs) => void;
}

export default function VisitorMonthDay({
  day,
  currentMonth,
  events,
  onDayClick,
}: VisitorMonthDayProps) {
  const isOutsideMonth = day.month() !== currentMonth.month();
  if (isOutsideMonth) {
    return (
      <div className="min-h-[80px] border-b border-r border-gray-800 bg-gray-950/30" />
    );
  }

  const isToday = day.isSame(dayjs(), "day");

  const dayEvents = events.filter((event) =>
    dayjs(event.startDate).isSame(day, "day"),
  );

  return (
    <div
        onClick={() => onDayClick(day)}
      className={cn(
        "max-h-[90px] cursor-pointer overflow-hidden border-b border-r border-gray-800 p-2",
    "bg-gray-900/40 transition-colors hover:bg-red-950/30",
        isOutsideMonth ? "bg-gray-950/50" : "bg-gray-900/40",
      )}
    >
      {/* Day Number */}
      <div className="mb-2 flex justify-end">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center text-sm",
            isOutsideMonth && "text-gray-600",
            !isOutsideMonth && "text-gray-300",
            isToday && "rounded-full bg-red-600 font-semibold text-white",
          )}
        >
          {day.date()}
        </span>
      </div>

      {/* Events */}
      <div className="">
        {dayEvents.map((event) => (
          <VisitorEventTag
            key={event.id}
            event={event}
            
          />
        ))}
      </div>
    </div>
  );
}
