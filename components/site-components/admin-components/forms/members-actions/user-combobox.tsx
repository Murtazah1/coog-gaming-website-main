"use client";

// in our current flow I want the admin to only select from existing users when making a new member
// Combo box is great for this, users can be selected and queried from a drop down


import { useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { User } from "@/db/schema";

type NonMember = Pick<User, "id" | "email" | "firstName" | "lastName">;

// so we pass in preloaded users in the users prop, this was actually preloaded all the way from the table prop to here
// the value prop starts off null and when we select a user it is given back to the parent, add-member-button
// for onChange we gave it the setSelectedUser function we have in the add member button page, so when a user is selected we update the state in the parent component
interface UserComboBoxProps {
  users: NonMember[];
  value: NonMember | null;
  onChange: (user: NonMember | null) => void;
  disabled?: boolean;
}

// this just makes a label that will display this information for every combobox option, and used as a filter too
function getUserLabel(user: NonMember) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return fullName ? `${fullName} - ${user.email}` : user.email;
}

export default function UserComboBox({
  users,
  value,
  onChange,
  disabled = false,
}: UserComboBoxProps) {
  // state for the query
  const [query, setQuery] = useState("");
  const cleanQuery = query.trim().toLowerCase();

  // filters our array to match up with the query
  const filteredUsers =
    cleanQuery === ""
      ? users
      : users.filter((user) =>
          getUserLabel(user).toLowerCase().includes(cleanQuery),
        );

  return (
    <Combobox
      value={value}
      by="id"
      onChange={onChange}
      onClose={() => setQuery("")}
      disabled={disabled}
    >
      <div className="relative">
        <div className="relative">
          <ComboboxInput
            aria-label="Select a user"
            placeholder="Search by name or email"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            className="
              flex h-10 w-full rounded-md border border-input
              bg-background px-3 py-2 pr-10 text-sm
              ring-offset-background
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2
              focus:ring-ring focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
            "
          />

          <ComboboxButton
            className="
              absolute inset-y-0 right-0
              flex items-center px-3
              text-muted-foreground
            "
          >
            {/* this button lets us see the users we have without typing anything */}
            <ChevronsUpDown className="h-4 w-4" />
          </ComboboxButton>
        </div>

        <ComboboxOptions className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md empty:invisible">
          {filteredUsers.map((user) => (
            <ComboboxOption
              key={user.id}
              value={user}
              className="
                  group flex cursor-default
                  select-none items-center
                  justify-between rounded-sm
                  px-3 py-2 outline-none
                  data-focus:bg-accent
                  data-focus:text-accent-foreground
                "
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {getUserLabel(user)}
                </p>
              </div>
              <Check
                className="
                    invisible ml-3 h-4 w-4
                    shrink-0
                    group-data-selected:visible
                  "
              />
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
