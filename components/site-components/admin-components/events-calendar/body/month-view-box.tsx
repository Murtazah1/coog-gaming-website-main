"use client";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useDateStore, useEventDialogStore } from "@/lib/store";
import { Event } from "@/db/schema";
import EventRenderer from "../event-renderer";

interface MonthViewBoxProps {
  day: dayjs.Dayjs | null;
  rowIndex: number;
  events: Event[]
}

export default function MonthViewBox({ day, rowIndex, events }: MonthViewBoxProps) {
  const { setDate, selectedMonthIndex } = useDateStore();
  const { openCreate } = useEventDialogStore();

  if (!day) {
    return <div>no days sry</div>;
  }

  const isFirstDayOfMonth = day.date() === 1;
  const isToday = day.format("DD-MM-YY") === dayjs().format("DD-MM-YY");
  const isOutsideMonth = day.month() !== selectedMonthIndex;

  const handleClick = () => {
    // i wanna add always have setDate before openCreate because they access the same day state
    setDate(day);
    
  };

  const handleDoubleClick = () => {
    setDate(day);
    openCreate(day);
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center gap-y-1 border",
        "transition-all hover:bg-violet-50",
        isOutsideMonth && "bg-zinc-300",
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* this builds out our days */}
      <div className="flex flex-col items-center">
        {rowIndex === 0 && (
          <h4 className="text-xs text-grey-500">
            {day.format("ddd").toUpperCase()}
          </h4>
        )}
        {/* this is specical css for the first day of the month and current day */}
        <h4
          className={cn(
            "text-center text-sm",
            isOutsideMonth && "text-gray-400",
            isToday &&
              "flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white",
          )}
        >
          {isFirstDayOfMonth ? day.format("MMM D") : day.format("D")}
        </h4>
      </div>
      <div className="min-h-0 w-full flex-1 overflow-y-auto">
        <EventRenderer date={day} view="month" events={events}/>
      </div>
    </div>
  );
}
