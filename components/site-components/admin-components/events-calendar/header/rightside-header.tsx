"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDateStore, useEventDialogStore, useViewStore } from "@/lib/store";

export default function Rightside() {

  const { selectedView, setView } = useViewStore();
  const { userSelectedDate } = useDateStore();
  const { openCreate } = useEventDialogStore();
  function handleCreateEvent() {
    openCreate(userSelectedDate);
  }
  return (
    <div className="flex items-center space-x-4">
      <Button
        type="button"
        className="p-4"
        onClick={handleCreateEvent}
        aria-label="Create event"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Select onValueChange={(v) => setView(v)}>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      
    </div>
  );
}
