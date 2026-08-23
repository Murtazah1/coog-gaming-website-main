"use client";

import dayjs, { type Dayjs } from "dayjs";
import { ChevronDown, Clock, MapPin, X } from "lucide-react";

import type { Event } from "@/db/schema/events";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VisitorEventSidebarProps {
  date: Dayjs;
  events: Event[];
  expandedEventId: string | null;
  onToggleEvent: (eventId: string) => void;
  onClose: () => void;
}

export default function VisitorEventSidebar({
  date,
  events,
  expandedEventId,
  onToggleEvent,
  onClose,
}: VisitorEventSidebarProps) {
  return (
    <aside
      className="
        w-full
        self-stretch
        shrink-0
        border-b
        border-red-500/40
        bg-gradient-to-br
        from-black/95
        via-red-950/60
        to-black/95
        p-5
        text-white
        backdrop-blur-xl
        lg:w-80
        lg:border-b-0
        lg:border-r
      "
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-base font-medium text-gray-100">Events</p>

          <h3 className="text-xl font-semibold text-white">
            {date.format("dddd, MMMM D")}
          </h3>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-200 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Event List */}
      <div className="space-y-3">
        {events.map((event) => {
          const expanded = expandedEventId === event.id;

          return (
            <div
              key={event.id}
              className="
                overflow-hidden
                rounded-lg
                border
                border-gray-700
                bg-black/85
              "
            >
              {/* Event Button */}
              <button
                type="button"
                onClick={() => onToggleEvent(event.id)}
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-3
                  p-3
                  text-left
                  transition
                  hover:bg-red-950/70
                "
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">
                    {event.title}
                  </p>

                  <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-100">
                    <Clock className="h-4 w-4" />

                    {dayjs(event.startDate).format("h:mm A")}

                    {" - "}

                    {dayjs(event.endDate).format("h:mm A")}
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>

              {/* Expanded Information */}
              {expanded && (
                <div className="space-y-4 border-t border-gray-700 p-4">
                  {/* Location */}
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                    <div>
                      <p className="text-sm font-semibold text-gray-100">
                        Location
                      </p>

                      <p className="text-base text-white">{event.location}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="mb-1 text-sm font-semibold text-gray-100">
                      Description
                    </p>

                    <p className="text-base leading-relaxed text-white">
                      {event.description || "No description provided."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
