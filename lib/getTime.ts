// this file is used to get the selected month, week, day that the user wants to see in the calendar

import dayjs, {type Dayjs} from "dayjs";

export const isCurrentDay = (day: dayjs.Dayjs) => {
  return day.isSame(dayjs(), "day");
};



export const getMonth = (date: Dayjs = dayjs()) => {
  const month = date.month();
  const year = date.year();

  // Get which weekday the first day of the month falls on
  const firstDayOfMonth = date.startOf("month").day();

  // Negative values roll backward into the previous month
  let dayCounter = -firstDayOfMonth;

  // Create a 6 x 7 calendar grid
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 7 }, () =>
      dayjs(new Date(year, month, ++dayCounter)),
    ),
  );
};

// just creates an array with all the days in that week and defines if a day is today
export const getWeekDays = (date: dayjs.Dayjs) => {
  const startOfWeek = date.startOf("week");
  const weekDates = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = startOfWeek.add(i, "day");
    weekDates.push({
      currentDate,
      today: isCurrentDay(currentDate),
    });
  }
  return weekDates;
};


export const getHours = Array.from({ length: 24 }, (_, i) =>
  dayjs().startOf("day").add(i, "hour"),
);