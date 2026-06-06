/**
 * Génère un script de vidéo TikTok "création de site web pour artisan".
 *
 * ⚠️ Le moteur short-video-maker (Kokoro TTS) ne supporte QUE l'anglais.
 * Stratégie : narration EN courte + sous-titres FR overlay côté Remotion
 * (déjà géré par captionPosition). Audience cible TikTok FR comprend
 * l'anglais basique, et le contenu visuel parle de lui-même.
 *
 * Alternative : passer en FR via ElevenLabs ou XTTS-v2 (voir doc).
 */

import type { FakeBusiness } from "./fake-business";

export interface VideoScene {
  text: string;          // narration EN (Kokoro)
  searchTerms: string[]; // mots-clés Pexels pour vidéo de fond
}

export interface VideoScript {
  scenes: VideoScene[];
  config: {
    paddingBack: number;
    music: string;
    captionPosition: "top" | "center" | "bottom";
    captionBackgroundColor: string;
    voice: string;
    orientation: "portrait" | "landscape";
    musicVolume: "muted" | "low" | "medium" | "high";
  };
}

const TYPE_VISUALS: Record<string, string[]> = {
  plombier:    ["plumber tools", "pipes work", "wrench bathroom", "modern bathroom"],
  boulangerie: ["bakery bread", "croissant", "french bakery", "fresh bread"],
  menuisier:   ["woodworking", "carpenter workshop", "wood plank", "handcraft wood"],
  coiffeur:    ["hair salon", "barber shop", "stylist", "modern hair"],
  restaurant:  ["french restaurant", "chef cooking", "plated dish", "cozy dining"],
  fleuriste:   ["flowers shop", "bouquet", "florist hands", "rose closeup"],
};

const WEBSITE_VISUALS = [
  "laptop typing", "web design", "modern website", "responsive design",
  "phone website", "code screen", "ui interface",
];

/**
 * Script "Day in the life — building a site for [biz] in 60 seconds".
 * Format : 5 scènes de ~12 sec = 60 sec total. Idéal TikTok feed.
 */
export function buildVideoScript(biz: FakeBusiness, niche: "creation" | "transformation" = "creation"): VideoScript {
  const visuals = TYPE_VISUALS[biz.type] || ["small business", "shop french"];

  const scenes: VideoScene[] = niche === "creation" ? [
    {
      text: `Meet ${biz.name}, a ${biz.typeFr.replace(/é/g, "e")} in ${biz.city}. They ${biz.story.replace(/é/g, "e")}.`,
      searchTerms: [visuals[0], "french town"],
    },
    {
      text: `Problem? No website. Every customer asks the same questions. Hours, prices, location.`,
      searchTerms: ["phone call frustration", "missed call"],
    },
    {
      text: `Let's fix that. One clean page. Hero photo, services, opening hours, click to call.`,
      searchTerms: [WEBSITE_VISUALS[0], visuals[1]],
    },
    {
      text: `Mobile first, because seventy percent of searches are on phones. SEO ready, fast loading.`,
      searchTerms: [WEBSITE_VISUALS[2], "mobile phone hand"],
    },
    {
      text: `Total time, three hours. Cost? Zero with our hosting plan. Follow for more local business glow-ups.`,
      searchTerms: ["thumbs up", "success", visuals[2] || "small shop"],
    },
  ] : [
    {
      text: `${biz.name} had an old website from 2014. Pop-ups, broken images, no mobile version.`,
      searchTerms: ["old website", "broken design"],
    },
    {
      text: `Forty seconds load time on phone. Google ranks them on page seven. Zero new clients.`,
      searchTerms: ["slow loading", "frustrated customer"],
    },
    {
      text: `One rebuild, modern style. Big photo, clear call to action, working contact form.`,
      searchTerms: [visuals[0], WEBSITE_VISUALS[1]],
    },
    {
      text: `Lighthouse score: ninety eight. Mobile? Perfect. Calls from Google up two hundred percent in thirty days.`,
      searchTerms: [WEBSITE_VISUALS[3], "phone ringing happy"],
    },
    {
      text: `Cost for them: zero euros with our hosting. Want yours? Link in bio.`,
      searchTerms: [visuals[1] || "happy business owner", "success celebrate"],
    },
  ];

  return {
    scenes,
    config: {
      paddingBack: 1000,
      music: "chill",
      captionPosition: "center",
      captionBackgroundColor: "#000000aa",
      voice: "am_adam", // voix masculine claire — proche du "ton" de Tom
      orientation: "portrait", // 9:16 TikTok
      musicVolume: "low",
    },
  };
}
