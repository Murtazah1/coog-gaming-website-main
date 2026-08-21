"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDateStore, useViewStore } from "@/lib/store";
import dayjs from "dayjs";
import { useRef } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Leftside() {
  const todaysDate = dayjs();
  // as we will be moving around the dates with our chevron left and right arrows, we need to get useDateStore to influence the state whenever we click on the arrows
  const { userSelectedDate, setDate, setMonth, selectedMonthIndex } =
    useDateStore();
  const { selectedView } = useViewStore();
  

  // simple function that depending on which view we have, it will set that view to 'today'
  // in the case of month today is the current month
  // in the case of week today is the current week
  // in the case of day today is today
  const handleTodayClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(todaysDate);
        break;
      case "week":
        setDate(todaysDate);
        break;
      case "day":
        setDate(todaysDate);
        setMonth(todaysDate);
        break;
      default:
        break;
    }
  };

  // just handles what happens when u click chevron left
  // as you can see, we change the date state to be -1 from before
  // and in the case of month the month is now -1 from before
  const handlePrevClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(userSelectedDate.subtract(1, "month"));
        break;
      case "week":
        setDate(userSelectedDate.subtract(1, "week"));
        break;
      case "day":
        setDate(userSelectedDate.subtract(1, "day"));
        break;
      default:
        break;
    }
  };

  const handleNextClick = () => {
    switch (selectedView) {
      case "month":
        setMonth(userSelectedDate.add(1, "month"));
        break;
      case "week":
        setDate(userSelectedDate.add(1, "week"));
        break;
      case "day":
        setDate(userSelectedDate.add(1, "day"));
        break;
      default:
        break;
    }
  };

  // this is code to handle the month change button
   const handleMonthChange = (month: string) => {
    const newDate = userSelectedDate.month(
      Number(month),
    );

    setMonth(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = userSelectedDate.year(
      Number(year),
    );

    setMonth(newDate);
  };
  
  const currentYear = dayjs().year();

  const years = Array.from(
    { length: 21 },
    (_, index) => currentYear - 10 + index,
  );

  return (
    <div className="flex items-center gap-3">
      {/* today button */}
      <Button variant="outline" onClick={handleTodayClick}>
        Today
      </Button>

      {/* navigation buttons */}
      <div className="flex items-center gap-3">
        <ChevronLeft
          className="size-6 cursor-pointer"
          onClick={handlePrevClick}
        />
        <ChevronRight
          className="size-6 cursor-pointer"
          onClick={handleNextClick}
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="text-lg font-semibold"
          >
            {userSelectedDate.format("MMMM YYYY")}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72">
          <div className="flex gap-2">
            {/* Month */}
            <Select
              value={userSelectedDate
                .month()
                .toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem
                    key={month}
                    value={index.toString()}
                  >
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year */}
            <Select
              value={userSelectedDate
                .year()
                .toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
