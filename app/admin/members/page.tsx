
import MembersTable from "@/components/site-components/admin-components/members-table"


interface AdminMemberPageProps{
  searchParams: Promise<{search?: string | string[]}>
}

export default async function Page({ searchParams }: AdminMemberPageProps) {
 
    const params = await searchParams
    const search = Array.isArray(params.search) ? params.search[0] : params.search

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto p-4 md:p-24">
     
      <MembersTable search={search}/>
    </div>
  );
}
