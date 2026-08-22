import VisitorCalendar from "@/components/site-components/visitor-calendar/visitor-calendar";
import { getEvents } from "@/server/events";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TwitchEmbed from "@/components/site-components/homepage-components/twitch-embed";
import TwitterEmbed from "@/components/site-components/homepage-components/twitter-embed";

export default async function Page() {
  const { data: events, error } = await getEvents();
  return (
    <main className="min-h-screen bg-[url('/uh-site-background.png')] bg-cover bg-center bg-no-repeat bg-fixed flex flex-col items-center gap-8 pt-16 pb-12 md:pb-16">
      <div className="w-[60%] rounded-xl border border-red-500/30 bg-gradient-to-br from-gray-950/70 via-red-950/90 to-gray-900/60 p-6 text-center font-bold text-white shadow-xl backdrop-blur-lg">
        <h1>Welcome to COOG Gaming</h1>
        <p>UH premier Gaming Org!</p>
      </div>

      <div>
        <VisitorCalendar events={events ?? []} />
      </div>

      <div className="mx-auto grid w-[90%] max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-2">
        <TwitterEmbed />
        <TwitchEmbed />
      </div>
      <div className="relative mx-auto grid w-[90%] max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="w-full rounded-xl border border-white/20 bg-gray-900/60 p-4 text-center text-white shadow-lg backdrop-blur-md">
          <h1>Learn More About Us!</h1>
          <Button asChild>
            <Link
              className="
              mt-4
              border
              border-red-500/50
              bg-red-950/30
              text-white
              backdrop-blur-md
              transition
              hover:border-red-400
              hover:bg-red-900/50
              hover:text-white
            "
              href="/about"
            >
              About Us
            </Link>
          </Button>
        </div>

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 z-10 h-px w-24 -translate-x-1/2 -translate-y-1/2 bg-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.6)] lg:h-24 lg:w-px"
        />

        <div className="w-full rounded-xl border border-white/20 bg-gray-900/60 p-4 text-center text-white shadow-lg backdrop-blur-md">
          <h1>Check out the Teams!</h1>
          <Button asChild>
            <Link
              className="
              mt-4
              border
              border-red-500/50
              bg-red-950/30
              text-white
              backdrop-blur-md
              transition
              hover:border-red-400
              hover:bg-red-900/50
              hover:text-white
            "
              href="/teams"
            >
              Teams
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
