import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/analysis/"],
      },
    ],
    sitemap: "https://contractear.com/sitemap.xml",
  };
}
