
import UsersTable from "@/components/site-components/admin-components/users-table";

export default function Page() {
  
  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto p-4 md:p-24">
      <h1>Hello, Admin!</h1>
      <UsersTable />
    </div>
  );
}
