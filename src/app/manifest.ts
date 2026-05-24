import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EchoHire — AI-powered recruitment",
    short_name: "EchoHire",
    description:
      "An AI-native applicant tracking system. Turn CVs into structured signal, match candidates to roles, run interview prep — powered by Claude.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    categories: ["business", "productivity", "developer-tools"],
  };
}
