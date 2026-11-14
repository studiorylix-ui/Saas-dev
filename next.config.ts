import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fichiers SQL de migration lisibles depuis le tableau de bord Supabase (retirés une fois exécutés).
  async headers() {
    return [{ source: "/sql/:file*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] }];
  },
};

export default nextConfig;
