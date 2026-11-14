import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Rylix Hub", short_name: "Hub", start_url: "/chat", display: "standalone", background_color: "#ffffff", theme_color: "#4f46e5" };
}
