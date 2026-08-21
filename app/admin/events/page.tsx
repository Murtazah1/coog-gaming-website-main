import Header from "@/components/site-components/admin-components/events-calendar/header/header";
import MainView from "@/components/site-components/admin-components/events-calendar/body/main-view";
import { getEvents } from "@/server/events";
import { getAdmins } from "@/server/admins";

export default async function page() {
  const { data: events } = await getEvents();
  const adminsResult = await getAdmins()
  const adminOptions =
  adminsResult.data?.map(({ admin, member }) => ({
    id: admin.id,
    firstName: member.firstName,
    lastName: member.lastName,
  })) ?? [];

  return (
    <div>
      <Header />
      <MainView events={events ?? []} admins={adminOptions}/>
    </div>
  );
}
