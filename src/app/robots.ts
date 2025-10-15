import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/", // Cấm mọi trang
      },
    ],
    sitemap: undefined,
  };
}
