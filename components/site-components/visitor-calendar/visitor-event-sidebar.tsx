"use client";

import dayjs, { type Dayjs } from "dayjs";
import {
  ChevronDown,
  Clock,
  MapPin,
  X,
} from "lucide-react";

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
        w-72
    self-stretch
    shrink-0
    border-r
    border-red-500/30
    bg-gradient-to-br
    from-gray-950/90
    via-red-950/30
    to-gray-900/90
    p-4
    text-white
    backdrop-blur-xl
      "
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">
            Events
          </p>

          <h3 className="text-lg font-semibold">
            {date.format("dddd, MMMM D")}
          </h3>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Event List */}
      <div className="space-y-3">
        {events.map((event) => {
          const expanded =
            expandedEventId === event.id;

          return (
            <div
              key={event.id}
              className="
                overflow-hidden
                rounded-lg
                border
                border-gray-700
                bg-gray-900/70
              "
            >
              {/* Event Button */}
              <button
                type="button"
                onClick={() =>
                  onToggleEvent(event.id)
                }
                className="
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-3
                  p-3
                  text-left
                  transition
                  hover:bg-gray-800
                "
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {event.title}
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />

                    {dayjs(event.startDate).format(
                      "h:mm A"
                    )}

                    {" - "}

                    {dayjs(event.endDate).format(
                      "h:mm A"
                    )}
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              </button>

              {/* Expanded Information */}
              {expanded && (
                <div className="space-y-4 border-t border-gray-700 p-3">

                  {/* Location */}
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                    <div>
                      <p className="text-xs font-medium text-gray-400">
                        Location
                      </p>

                      <p className="text-sm">
                        {event.location}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-400">
                      Description
                    </p>

                    <p className="text-sm leading-relaxed text-gray-300">
                      {event.description ||
                        "No description provided."}
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