"use client";

import { Fragment } from "react";
import type { Dayjs } from "dayjs";

import type { Event } from "@/db/schema/events";
import { getMonth } from "@/lib/getTime";

import VisitorMonthDay from "./visitor-month-day";

interface VisitorMonthViewProps {
  month: Dayjs;
  events: Event[];
  onDayClick: (day: Dayjs) => void;
}

const weekDays = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];

export default function VisitorMonthView({
  month,
  events,
  onDayClick,
}: VisitorMonthViewProps) {
  const monthArray = getMonth(month);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">

        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b border-gray-700">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-xs font-semibold text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar */}
        <section className="grid grid-cols-7 grid-rows-6">
          {monthArray.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              {row.map((day) => (
                <VisitorMonthDay
                  key={day.format("YYYY-MM-DD")}
                  day={day}
                  currentMonth={month}
                  events={events}
                  onDayClick={onDayClick}
                />
              ))}
            </Fragment>
          ))}
        </section>
      </div>
    </div>
  );
}