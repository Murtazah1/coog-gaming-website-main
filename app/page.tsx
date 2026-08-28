import VisitorCalendar from "@/components/site-components/homepage-components/visitor-calendar/visitor-calendar";
import { getEvents } from "@/server/events";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TwitchEmbed from "@/components/site-components/homepage-components/twitch-embed";
import TwitterEmbed from "@/components/site-components/homepage-components/twitter-embed";

export default async function Page() {
  const { data: events } = await getEvents();
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-black/25 bg-[url('/uh-site-background.png')] bg-cover bg-center bg-fixed bg-no-repeat bg-blend-multiply pb-12 pt-16 md:pb-16">
      <div className="w-[90%] max-w-5xl rounded-xl border border-red-500/30 bg-gradient-to-br from-gray-950/95 via-red-950/95 to-gray-900/90 p-6 text-center font-bold text-white shadow-xl backdrop-blur-lg sm:w-[80%] lg:w-[60%]">
        <h1 className="text-3xl sm:text-4xl">Welcome to COOG Gaming</h1>
        <p className="mt-2 text-base text-gray-100">UH premier Gaming Org!</p>
      </div>

      <div className="w-[90%] max-w-[1600px] overflow-hidden">
        <VisitorCalendar events={events ?? []} />
      </div>

      <div className="mx-auto grid w-[90%] max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-2">
        <TwitterEmbed />
        <TwitchEmbed />
      </div>
      <div className="relative mx-auto grid w-[90%] max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="w-full rounded-xl border border-white/20 bg-gray-950/90 p-4 text-center text-white shadow-lg backdrop-blur-md">
          <h2 className="text-2xl sm:text-3xl">Learn More About Us!</h2>
          <Button
            asChild
            size="lg"
            className="h-14 px-10 text-xl font-bold"
          >
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

        <div className="w-full rounded-xl border border-white/20 bg-gray-950/90 p-4 text-center text-white shadow-lg backdrop-blur-md">
          <h2 className="text-2xl sm:text-3xl">Check out the Teams!</h2>
          <Button
            asChild
            size="lg"
            className="h-14 px-10 text-xl font-bold"
          >
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
