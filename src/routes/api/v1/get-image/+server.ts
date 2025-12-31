import { env } from "$env/dynamic/private";
import { UNSPLASH_APP_ID, UNSPLASH_ACCESS_KEY } from "$env/static/private";
import { images } from "$lib/server/caches/images.js";
import { error, json } from "@sveltejs/kit";
import jwt from "jsonwebtoken";

function verifyToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS512"],
      audience: "supportmail-website",
      issuer: ["supportmail-website/login", "supportmail-website"],
      subject: "img-access",
    });
    return !!decoded;
  } catch (err) {
    return false; // We just assume invalid token on any error
  }
}

export async function GET({ locals, url, cookies, setHeaders }) {
  if (!locals.user || !locals.token) {
    return error(401, { message: "Unauthorized (no user)", status: 401 });
  }

  const token = cookies.get("img_token");
  if (!token) {
    return error(401, { message: "Unauthorized (no token)", status: 401 });
  }

  const isValid = verifyToken(token);
  if (!isValid) {
    return error(401, { message: "Unauthorized (invalid token)", status: 401 });
  }

  const dimensions = url.searchParams.get("dim") || "1920x1080";
  // parse dimensions
  const [widthStr, heightStr] = /\d{3,4}x\d{3,4}/i.test(dimensions)
    ? dimensions.split("x")
    : ["1920", "1080"];
  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);
  let orientation: "landscape" | "portrait" | "squarish" = "landscape";
  if (width > height) {
    orientation = "landscape";
  } else if (height > width) {
    orientation = "portrait";
  } else {
    orientation = "squarish";
  }

  const unsplashRes = await getRandomUnsplashImage(orientation);
  if (unsplashRes.type === "error") {
    return json({
      type: "error",
      message: "Failed to fetch image from Unsplash",
    });
  }

  if (unsplashRes.cache) {
    setHeaders({
      "X-Image-Source": "cache",
      "X-Cache-Status": "HIT",
    });
  } else {
    setHeaders({
      "X-Image-Source": "unsplash",
      "X-Cache-Status": "MISS",
    });
  }

  return json(unsplashRes);
}

/**
 * Generates a "random" search term from a predefined list of terms.
 * Some terms appear multiple times in the list, increasing their probability of being selected.
 * @returns A randomly selected search term string.
 */
function randomSearchTerm(): string {
  const terms = [
    "nature",
    "nature",
    "landscape",
    "landscape",
    "technology",
    "ocean",
    "ocean",
    "mountains",
    "mountains",
    "forest",
    "forest",
    "city",
    "space",
  ];
  return terms[Math.floor(Math.random() * terms.length)];
}

async function getRandomUnsplashImage(
  orientation: "landscape" | "portrait" | "squarish" = "landscape",
): Promise<{ type: "error"; image?: never } | { type: "success"; image: Unsplash.MyImage; cache?: true }> {
  const cacheKey = `unsplash_image_${orientation}`;

  // Check cache first - only fetch once per minute
  const cachedImg = await images.get<Unsplash.MyImage>(cacheKey);
  if (cachedImg) {
    try {
      console.log("Unsplash cache hit", { id: cachedImg.id });
      return { type: "success", image: cachedImg, cache: true };
    } catch {
      // Cache corrupted, continue to fetch fresh
    }
    console.log("Unsplash cache miss due to error");
  }

  // Cache miss - fetch from Unsplash API
  const url = new URL("https://api.unsplash.com/photos/random");
  url.searchParams.set("content_filter", "high");
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("query", randomSearchTerm());

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept-Version": "v1",
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      "User-Agent": `SupportMailBot/1.0 (App ID: ${UNSPLASH_APP_ID})`,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    console.error("Unsplash API error:", res);
    return { type: "error" };
  }
  const data: Unsplash.Image = await res.json();

  // Cache the result for 5 minutes
  const partialImg = {
    id: data.id,
    authorName: data.user.username,
    authorProfileUrl: `https://unsplash.com/@${data.user.username}`,
    htmlUrl: data.links.html,
    url: data.urls.full,
    blurHash: data.blur_hash,
  } satisfies Unsplash.MyImage;
  images.set<Unsplash.MyImage>(cacheKey, partialImg);

  console.log("New Unsplash image fetched and cached", { data: data.id });
  return { type: "success", image: partialImg };
}
