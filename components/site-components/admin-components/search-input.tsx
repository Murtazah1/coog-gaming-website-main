"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

export default function SearchInput() {
    // import router to change the url
  const router = useRouter();
  // import useSearchParams to read query paramets in the url, whatever comes after the ?
  const searchParams = useSearchParams();
  // pathname just gets the current pathname (such as /admin)
  const pathname = usePathname();
  // in here whatever search is equal to we get in this example /admin?search=alice we get alice
  const [value, setValue] = useState(searchParams.get("search") ?? "");
    // this changes whenever value (for search) changes or when the url changes
    // remember value is the value that the user enters in for their search
  useEffect(() => {
    const timeout = setTimeout(() => {
        // create a copy of the searchParams url for editing
      const params = new URLSearchParams(searchParams.toString());
    // trim allows us to get the users search in a clean format
      const newsearch = value.trim();
      // this gets the current search value
      const currentsearch = params.get("search") ?? "";
        // if they are the same then we do not need to run this function again
      if (newsearch === currentsearch) {
        return;
      }
      // if we have a newsearch then we set the params as the new search value
      if (newsearch) {
        params.set("search", value.trim());
        // and if the user enters in nothing then no search word appears in the url
      } else {
        params.delete("search");
      }
      // this converts the paramters the user entered into the proper url search paramter
      const queryString = params.toString();
      // if we have parameters then we have the pathname (something like /admin or /admin/users)+ ? + querystring (this will be something like search=alice)
      // and if there is nothing then just keep the pathname
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    }, 300); // run this function after a 300 milsec timeout
    return () => clearTimeout(timeout); // this cleans up the old timer if the user enters in another character while the timer is still going
  }, [value, pathname, router, searchParams]); // this is called the dependency array, because these values decide if we run our useEffect function

  return (
    // this nextjs input tag has our value (value) and on change we run setValue
    // which will then trigger our useEffect function
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search by email"
      className="max-w-xs"
    />
  );
}
