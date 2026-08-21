"use client";

import dayjs from "dayjs";

import type { Event } from "@/db/schema/events";
import EventCard from "./event-card";

interface EventRendererProps {
  date: dayjs.Dayjs;
  view: "month" | "week" | "day";
  events: Event[];
}

export default function EventRenderer({
  date,
  view,
  events,
}: EventRendererProps) {
  const filteredEvents = events.filter((event) => {
    const eventDate = dayjs(event.startDate);

    // MONTH:
    // just care whether event happens on this day
    if (view === "month") {
      return eventDate.isSame(date, "day");
    }

    // WEEK / DAY:
    // care about the date AND hour
    return eventDate.isSame(date, "day") && eventDate.hour() === date.hour();
  });

  return (
    <div className="flex w-full flex-col items-center gap-1 p-1">
      {filteredEvents.map((event) => (
        <EventCard key={event.id} event={event} view={view} />
      ))}
    </div>
  );
}
