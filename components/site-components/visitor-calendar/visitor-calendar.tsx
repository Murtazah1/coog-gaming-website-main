"use client";

import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Event } from "@/db/schema/events";
import VisitorMonthView from "./visitor-month-view";
import VisitorEventSidebar from "./visitor-event-sidebar";

interface VisitorCalendarProps {
  events: Event[];
}

export default function VisitorCalendar({ events }: VisitorCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  function handlePreviousMonth() {
    setCurrentMonth((month) => month.subtract(1, "month"));
  }

  function handleNextMonth() {
    setCurrentMonth((month) => month.add(1, "month"));
  }

  function handleToday() {
    setCurrentMonth(dayjs());
  }

  function handleDayClick(day: Dayjs) {
    setSelectedDate(day);
    setExpandedEventId(null);
  }

  const selectedDayEvents = selectedDate
    ? events.filter((event) =>
        dayjs(event.startDate).isSame(selectedDate, "day"),
      )
    : [];

  return (
    <div className="overflow-hidden rounded-xl border border-red-500/30 bg-gray-950/70 backdrop-blur-lg">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-red-500/30 p-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleToday}
            className="border border-red-500/40 bg-gray-900 text-white hover:bg-red-950"
          >
            Today
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="text-white hover:bg-red-950 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="text-white hover:bg-red-950 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <h2 className="text-xl font-bold text-white">
          {currentMonth.format("MMMM YYYY")}
        </h2>
      </div>

      {/* Sidebar + Calendar */}
      <div className="flex flex-col items-stretch lg:flex-row">
        {/* LEFT SIDEBAR */}
        {selectedDate && (
          <VisitorEventSidebar
            date={selectedDate}
            events={selectedDayEvents}
            expandedEventId={expandedEventId}
            onToggleEvent={(eventId) =>
              setExpandedEventId((current) =>
                current === eventId ? null : eventId,
              )
            }
            onClose={() => {
              setSelectedDate(null);
              setExpandedEventId(null);
            }}
          />
        )}

        {/* MONTH CALENDAR */}
        <div
          className={cn(
            "min-w-0 flex-1",
            selectedDate ? "rounded-r-xl border-l-0" : "rounded-xl",
          )}
        >
          <VisitorMonthView
            month={currentMonth}
            events={events}
            onDayClick={handleDayClick}
          />
        </div>
      </div>
    </div>
  );
}
