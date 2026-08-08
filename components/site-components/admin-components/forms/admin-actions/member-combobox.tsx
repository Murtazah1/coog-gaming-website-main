"use client";

import { useState } from "react";

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";

import { Check, ChevronsUpDown } from "lucide-react";

import type { AdminMember } from "@/db/schema";

interface MemberComboBoxProps {
  members: AdminMember[];
  value: AdminMember | null;
  onChange: (member: AdminMember | null) => void;
  disabled?: boolean;
}

function getMemberLabel(member: AdminMember) {
  const fullName = [member.firstName, member.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName ? `${fullName} - ${member.discordName}` : member.email;
}

export default function MemberComboBox({
  members,
  value,
  onChange,
  disabled = false,
}: MemberComboBoxProps) {
  const [query, setQuery] = useState("");

  const cleanQuery = query.trim().toLowerCase();

  const filteredMembers =
    cleanQuery === ""
      ? members
      : members.filter((member) =>
          getMemberLabel(member).toLowerCase().includes(cleanQuery),
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
            aria-label="Select a member"
            placeholder="Search by name or email"
            displayValue={(member: AdminMember | null) =>
              member ? getMemberLabel(member) : ""
            }
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            className="
              flex h-10 w-full
              rounded-md border
              border-input bg-background
              px-3 py-2 pr-10 text-sm
              ring-offset-background
              placeholder:text-muted-foreground
              focus:outline-none
              focus:ring-2
              focus:ring-ring
              focus:ring-offset-2
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          />

          <ComboboxButton
            className="
              absolute inset-y-0
              right-0 flex items-center
              px-3
              text-muted-foreground
            "
          >
            <ChevronsUpDown className="h-4 w-4" />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          className="
            absolute left-0 top-full
            z-50 mt-1 max-h-60
            w-full overflow-auto
            rounded-md border
            bg-popover p-1
            text-popover-foreground
            shadow-md
          "
        >
          {filteredMembers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No available members found.
            </div>
          ) : (
            filteredMembers.map((member) => (
              <ComboboxOption
                key={member.id}
                value={member}
                className="
                    group flex
                    cursor-default
                    select-none
                    items-center
                    justify-between
                    rounded-sm px-3
                    py-2 outline-none
                    data-focus:bg-accent
                    data-focus:text-accent-foreground
                  "
              >
                <p className="truncate text-sm font-medium">
                  {getMemberLabel(member)}
                </p>

                <Check
                  className="
                      invisible ml-3
                      h-4 w-4 shrink-0
                      group-data-selected:visible
                    "
                />
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
