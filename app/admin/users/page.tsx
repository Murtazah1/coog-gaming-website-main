
import UsersTable from "@/components/site-components/admin-components/users-table";

// interface for the props, we use the searchParams prop here for the search functionality
// this is a promise given to us by nextjs so we wrap it in the promise tag
// generally searchParams gives us an object that contains what the user searched for
// in our case that search value is literally search
interface AdminUserPageProps{
  searchParams: Promise<{search?: string | string[]}>
}

export default async function Page({ searchParams }: AdminUserPageProps) {
  // we get the searchParams after the promise is finished
    const params = await searchParams
// there is a possibility we can get multiple searches in an array, if it is we just want the first search value
// and if there is no multiple search params/ the search params are set up in an array style then we just get the first value
    const search = Array.isArray(params.search) ? params.search[0] : params.search

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto p-4 md:p-24">
      {/* and then we send that value to our table */}
      <UsersTable search={search}/>
    </div>
  );
}
