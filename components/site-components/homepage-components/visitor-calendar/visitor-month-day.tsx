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
      <div className="min-h-[96px] border-b border-r border-gray-800 bg-black/95" />
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
        "min-h-[96px] max-h-[112px] cursor-pointer overflow-hidden border-b border-r border-gray-800 p-2.5",
        "bg-black/85 transition-colors hover:bg-red-950/75",
        isOutsideMonth ? "bg-black/95" : "bg-black/85",
      )}
    >
      {/* Day Number */}
      <div className="mb-2 flex justify-end">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center text-base font-medium",
            isOutsideMonth && "text-gray-400",
            !isOutsideMonth && "text-gray-100",
            isToday && "rounded-full bg-red-600 font-semibold text-white",
          )}
        >
          {day.date()}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-1">
        {dayEvents.map((event) => (
          <VisitorEventTag key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
