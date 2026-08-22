"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";

const TWEET_HTML = `
  <p lang="en" dir="ltr">
    𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝒕𝒐 𝒕𝒉𝒆 𝑪𝒐𝒐𝒈 𝑬𝒔𝒑𝒐𝒓𝒕𝒔 𝑮𝒂𝒎𝒊𝒏𝒈 𝑳𝒂𝒃!<br><br>
    Where:<br>
    📍UH Sugar Land Campus<br>
    🚪AMG BUILDING ROOM 102<br><br>
    Details<br>
    🖥️ 20 HIGH END GAMING PCS<br>
    🎙️ CASTER STATION<br>
    🗓️ Open to students from 8 AM to 5 PM<br>
    🎮 Bookable for events, matches, and scrims!
    <a href="https://t.co/7UjkzEXlgP">pic.twitter.com/7UjkzEXlgP</a>
  </p>
  &mdash; Coog Esports (@coogesports)
  <a href="https://x.com/coogesports/status/1887204956739956825?ref_src=twsrc%5Etfw">
    February 5, 2025
  </a>
`;

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

export default function TwitterEmbed() {
  const tweetRef = useRef<HTMLDivElement>(null);
  const widgetLoadStartedRef = useRef(false);

  const loadTweet = useCallback(() => {
    const container = tweetRef.current;

    if (!container) return;

    if (!container.firstChild) {
      const blockquote = document.createElement("blockquote");
      blockquote.className = "twitter-tweet";
      blockquote.dataset.theme = "dark";
      blockquote.dataset.align = "center";
      blockquote.dataset.dnt = "true";
      blockquote.innerHTML = TWEET_HTML;
      container.appendChild(blockquote);
    }

    if (!window.twttr?.widgets || widgetLoadStartedRef.current) return;

    widgetLoadStartedRef.current = true;
    window.twttr.widgets.load(container);
  }, []);

  useEffect(() => {
    loadTweet();
  }, [loadTweet]);

  return (
    <div className="h-full w-full rounded-xl border border-red-500/30 bg-gray-950/70 p-4 text-white backdrop-blur-lg">
      <h2 className="mb-4 text-xl font-bold">
        Visit The Arena
      </h2>

      <div ref={tweetRef} className="h-[420px] overflow-y-auto rounded-lg" />

      <Script
        id="x-widgets"
        src="https://platform.x.com/widgets.js"
        strategy="afterInteractive"
        onReady={loadTweet}
      />
    </div>
  );
}
