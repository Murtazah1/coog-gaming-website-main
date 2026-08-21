"use client";

import { Fragment } from "react";
import MonthViewBox from "./month-view-box";
import { useDateStore } from "@/lib/store";
import type { Event } from "@/db/schema/events";

interface MonthViewProps{
  events: Event[]
}


export default function MonthView({events}: MonthViewProps) {
  
  const { twoDMonthArray } = useDateStore();
  return (
    <section className="grid grid-cols-7 grid-rows-6 lg:h-[80vh]">
      {twoDMonthArray.map((row, i) => (
        <Fragment key={i}>
          {row.map((day, index) => (
            <MonthViewBox key={index} day={day} rowIndex={i} events={events} />
          ))}
        </Fragment>
      ))}
    </section>
  );
}
