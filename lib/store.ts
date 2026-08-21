// this is a zustand hook to manage the state for the calendar

import { create } from "zustand";
// devtools allows for debugging while persist lets us persist the selected view even after refreshes
import { devtools, persist } from "zustand/middleware";
import dayjs, { Dayjs } from "dayjs";
import { getMonth } from "./getTime";
import type { Event } from "@/db/schema/events";

interface ViewStoreType {
  selectedView: string;
  setView: (value: string) => void;
}

interface DateStoreType {
  userSelectedDate: Dayjs;
  setDate: (value: Dayjs) => void;
  twoDMonthArray: dayjs.Dayjs[][];
  selectedMonthIndex: number;
  setMonth: (date: Dayjs) => void;
}

interface EventDialogStore {
  open: boolean;
  mode: "create" | "edit";
  selectedEvent: Event | null;
  selectedStartDate: Dayjs | null;
  openCreate: (date: Dayjs) => void;
  openEdit: (event: Event) => void;
  closeDialog: () => void;
}

// this function sets and stores the view for the calendar prop, when changing the view this function is called to set and store the view
export const useViewStore = create<ViewStoreType>()(
  devtools(
    persist(
      // set sets the state
      (set) => ({
        // initial state is month
        selectedView: "month",
        // and this sets the state to whatever we give to setView
        setView: (value: string) => {
          set({ selectedView: value });
        },
      }),
      { name: "calendar_view", skipHydration: true },
    ),
  ),
);

// this allows us to skip around months/days in our views
// as it saves the date set in other views and transfers them over to the view the user wants to see
// for instance if the user clicks on a date in the middle of september in month view, when going to day view it shows that week as the date is stored here
export const useDateStore = create<DateStoreType>()(
  devtools(
    persist(
      (set) => ({
        userSelectedDate: dayjs(),
        twoDMonthArray: getMonth(),
        selectedMonthIndex: dayjs().month(),
        // this just sets the date to whatever the user selected
        setDate: (value: Dayjs) => {
          set({ userSelectedDate: value });
        },
        // so this makes it so the month that is on display is the month the user wants
        // and that we store which month the user selected with selectedMonthIndex
        setMonth: (date: Dayjs) => {
          set({
            userSelectedDate: date,
            twoDMonthArray: getMonth(date),
            selectedMonthIndex: date.month(),
          });
        },
      }),
      { name: "date_data", skipHydration: true },
    ),
  ),
);

// since the different views all need to use the same event creation/edit dialog we should make a zustand store for the event creation dialog
// everytime one of the blocks are clicked, this event is called and set to true
export const useEventDialogStore = create<EventDialogStore>((set) => ({
  open: false,
  mode: "create",
  selectedEvent: null,
  selectedStartDate: null,
  // opencreate and openedit r the state managers for editing and creating respectively
  openCreate: (date) =>
    set({
      open: true,
      mode: "create",
      selectedEvent: null,
      selectedStartDate: date,
    }),
  openEdit: (event) =>
    set({
      open: true,
      mode: "edit",
      selectedEvent: event,
      selectedStartDate: null,
    }),
  closeDialog: () =>
    set({
      open: false,
      selectedEvent: null,
      selectedStartDate: null,
    }),
}));
