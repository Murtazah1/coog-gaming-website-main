"use client";
import { cn } from "@/lib/utils";
import { getWeekDays, getHours } from "@/lib/getTime";
import { useDateStore, useEventDialogStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type { Event } from "@/db/schema/events";
import EventRenderer from "../event-renderer";

interface WeekViewProps {
  events: Event[];
}

export default function WeekView({ events }: WeekViewProps) {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { userSelectedDate, setDate } = useDateStore();
  const { openCreate } = useEventDialogStore();

  // function to make sure our current time is always consistent with the actual current time of the world, it auto updates every minute

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] place-items-center px-4 py-2">
        <div className="w-16 border-r border-gray-300">
          <div className="relative h-16">
            <div className="absolute top-2 text-xs text-gray-600">CST</div>
          </div>
        </div>

        {/* This is the header for the week view, it displays the days and the day of the month using the getWeekDays function in getTime.ts */}

        {getWeekDays(userSelectedDate).map(({ currentDate, today }, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={cn("text-xs", today && "text-red-600")}>
              {currentDate.format("ddd")}
            </div>
            <div
              className={cn(
                "h-12 w-12 rounded-full p-2 text-2xl",
                today && "bg-red-600 text-white",
              )}
            >
              {currentDate.format("DD")}
            </div>
          </div>
        ))}
      </div>
      {/* this is the scroll area in which we can scroll through the hours and see what we have */}
      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2">
          <div className="w-16 border-r border-gray-300">
            {/* here we map the hours to the side, in AM/PM format */}
            {getHours.map((hour, index) => (
              <div key={index} className="relative h-16">
                <div className="absolute -top-2 text-xs text-gray-600">
                  {hour.format("hh:mm A")}
                </div>
              </div>
            ))}
          </div>
          {/* so for every hour in our weekday, we make a light grey div
          and if that hour is the current hour we make that div light red  */}
          {getWeekDays(userSelectedDate).map(({ today }, index) => {
            const dayDate = userSelectedDate.startOf("week").add(index, "day");
            return (
              <div key={index} className="relative border-r border-gray-300">
                {getHours.map((hour, i) => {
                  const selectedDateTime = dayDate.hour(hour.hour());
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative flex h-16 cursor-pointer flex-col items-center gap-y-2 border-b border-gray-300 hover:bg-gray-100",
                        today &&
                          currentTime.hour() === hour.hour() &&
                          "bg-red-200",
                      )}
                      onClick={() => {
                        setDate(selectedDateTime);
                      }}
                      onDoubleClick={() => {
                        setDate(selectedDateTime);
                        openCreate(selectedDateTime);
                      }}
                    >
                      <div className="max-h-10 w-full overflow-y-auto">
                        <EventRenderer
                          date={selectedDateTime}
                          view="week"
                          events={events}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}
