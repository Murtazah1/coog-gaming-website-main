"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";


// interface to make sure the props get the correct values
interface SearchInputProps {
  placeholder?: string;
}
// i have recently learned that all props are objects
// by doing this {} in the props we can pull the fields we want and then check it
// against our interface
export default function SearchInput({
  placeholder = "Search ...",
}: SearchInputProps) {
  // here we just get the router + our search input + our current pathname as we will be reusing this component a lot
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState("");

  // this makes it so that the state always has the correct url to it, keeping it consistent when say the URL is manually changed due to the user entering in a new value in the search or going back a page
  useEffect(() => {
    setValue(urlSearch);
  }, [urlSearch]);

  // now we can use the debounced hook so we do not need to maintain an internal timer, whenever this value changes we change our useEffect
  const [debouncedSearchValue] = useDebounce(value, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const cleanSearch = debouncedSearchValue.trim();
    const currentSearch = params.get("search") ?? "";
    if (cleanSearch === currentSearch) {
      return;
    }

    if (cleanSearch) {
      params.set("search", cleanSearch);
    } else {
      params.delete("search");
    }

    router.replace(params ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
  }, [debouncedSearchValue, pathname, searchParams, router]);
  return (
    // this nextjs input tag has our value (value) and on change we run setValue
    // which will then trigger our useEffect function
    <Input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="max-w-xs"
    />
  );
}
