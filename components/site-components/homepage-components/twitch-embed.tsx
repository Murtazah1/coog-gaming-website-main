export default function TwitchEmbed() {
    const parent = process.env.NEXT_PUBLIC_TWITCH_PARENT ?? "localhost"
  return (
    <section className="h-full w-full rounded-xl border border-red-500/30 bg-gray-950/90 p-4 text-white backdrop-blur-lg">
        <h2 className="mb-4 text-xl font-bold">
        Coog Esports Live
      </h2>
        <div className="h-[420px] w-full overflow-hidden rounded-lg border border-red-500/20">
            <iframe
            src={`https://player.twitch.tv/?channel=coogesports&parent=${parent}&autoplay=false`}
            title="coog esports stream"
            allowFullScreen
            className="h-full w-full" />

        </div>


    </section>
  )
}
