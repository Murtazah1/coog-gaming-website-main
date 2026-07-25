
import UsersTable from "@/components/site-components/admin-components/users-table";

interface AdminUserPageProps{
  searchParams: Promise<{search?: string | string[]}>
}

export default async function Page({ searchParams }: AdminUserPageProps) {
    const params = await searchParams

    const search = Array.isArray(params.search) ? params.search[0] : params.search

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto p-4 md:p-24">
      <UsersTable search={search}/>
    </div>
  );
}
