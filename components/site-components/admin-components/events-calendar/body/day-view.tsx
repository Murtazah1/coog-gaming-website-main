import { useDateStore, useEventDialogStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getHours } from "@/lib/getTime";
import type { Event } from "@/db/schema/events";
import EventRenderer from "../event-renderer";

interface DayViewProps {
  events: Event[];
}

export default function DayView({ events }: DayViewProps) {
  const { userSelectedDate, setDate } = useDateStore();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { openCreate } = useEventDialogStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const isToday =
    userSelectedDate.format("DD-MM-YY") === dayjs().format("DD-MM-YY");

  return (
    <>
      {/* this part of the code just defines which day the user selected and if its today makes the day have the red circle on it */}
      <div className="grid grid-cols-[auto_auto_1fr] px-4">
        <div className="w-16 border-r border-gray-300 text-xs">CST</div>
        <div className="flex w-16 flex-col items-center">
          <div className={cn("text-xs", isToday && "text-red-600")}>
            {userSelectedDate.format("ddd")}
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-full p-2 text-2xl",
              isToday && "bg-red-600 text-white",
            )}
          >
            {userSelectedDate.format("DD")}
          </div>
        </div>
      </div>
      <ScrollArea className="h-[70vh]">
        <div className="grid grid-cols-[auto_1fr] p-4">
          <div className="w-16 border-r border-gray-300">
            {/* we get hours here, all 24, then loop divs to have them show up in the side */}
            {getHours.map((hour, index) => (
              <div key={index} className="relative h-16">
                <div className="absolute -top-2 text-xs text-gray-600">
                  {hour.format("hh:mm A")}
                </div>
              </div>
            ))}
          </div>
          {/* this part of the code makes the boxes for every hour of the day */}
          <div className="relative border-r border-gray-300">
            {getHours.map((hours, i) => {
              const selectedDateTime = userSelectedDate.hour(hours.hour());
              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex h-16 cursor-pointer flex-col items-center gap-y-2 border-b border-gray-300 hover:bg-gray-100",
                    isToday &&
                      currentTime.hour() === hours.hour() &&
                      "bg-red-200",
                  )}
                  onClick={() => {
                    setDate(selectedDateTime);
                    
                  }}
                  onDoubleClick={() =>{
                    setDate(selectedDateTime);
                    openCreate(selectedDateTime);
                  }}
                >
                  <div className="max-h-10 w-full overflow-y-auto">
                    <EventRenderer
                      date={selectedDateTime}
                      view="day"
                      events={events}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
