<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import dayjs from "dayjs";

  interface Props {
    fallback?: {
      url: string;
      authorName: string;
      authorUrl: string;
      imageUrl: string;
    };
    apiEndpoint?: string;
    cacheKey?: string;
    maxCachedImages?: number;
    cacheExpiryMinutes?: number;
  }

  let {
    fallback = $bindable({
      url: "/johannes-plenio-bhCdwWNmXw8-unsplash.jpg",
      authorName: "Johannes Plenio",
      authorUrl:
        "https://unsplash.com/de/@jplenio?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
      imageUrl:
        "https://unsplash.com/de/fotos/grune-baume-in-der-nahe-von-gewassern-wahrend-des-tages-bhCdwWNmXw8?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText",
    }),
    apiEndpoint = "/api/v1/get-image",
    cacheKey = "cached_background_images",
    maxCachedImages = 10,
    cacheExpiryMinutes = 5,
  }: Props = $props();

  let bgImage: HTMLDivElement | null = $state(null);
  let blurCanvas: HTMLCanvasElement | null = $state(null);
  let imageLoaded = $state(false);
  let imageData = $state<Unsplash.MyImage | null>(null);
  let usingFallback = $state(false);
  let screenDimensions = $state<{ width: number | null; height: number | null }>({
    width: null,
    height: null,
  });

  interface CachedImage {
    id: string;
    url: string;
    authorName: string;
    authorProfileUrl: string;
    htmlUrl: string;
    blurHash: string;
    timestamp: string;
  }

  function decodeBlurHash(
    hash: string,
    width: number,
    height: number,
    punch: number = 1,
  ): Uint8ClampedArray | null {
    const digitCharacters =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~";

    const decode83 = (str: string): number => {
      let value = 0;
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        const digit = digitCharacters.indexOf(c);
        value = value * 83 + digit;
      }
      return value;
    };

    const sRGBToLinear = (value: number): number => {
      const v = value / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    const linearToSRGB = (value: number): number => {
      const v = Math.max(0, Math.min(1, value));
      return v <= 0.0031308
        ? Math.round(v * 12.92 * 255 + 0.5)
        : Math.round((1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5);
    };

    const signPow = (base: number, exp: number): number => Math.sign(base) * Math.pow(Math.abs(base), exp);

    const decodeDC = (value: number): [number, number, number] => {
      const intR = value >> 16;
      const intG = (value >> 8) & 255;
      const intB = value & 255;
      return [sRGBToLinear(intR), sRGBToLinear(intG), sRGBToLinear(intB)];
    };

    const decodeAC = (value: number, maxVal: number): [number, number, number] => {
      const quantR = Math.floor(value / (19 * 19));
      const quantG = Math.floor(value / 19) % 19;
      const quantB = value % 19;
      return [
        signPow((quantR - 9) / 9, 2.0) * maxVal,
        signPow((quantG - 9) / 9, 2.0) * maxVal,
        signPow((quantB - 9) / 9, 2.0) * maxVal,
      ];
    };

    if (!hash || hash.length < 6) return null;

    const sizeFlag = decode83(hash[0]);
    const numY = Math.floor(sizeFlag / 9) + 1;
    const numX = (sizeFlag % 9) + 1;

    const quantisedMaxVal = decode83(hash[1]);
    const maxVal = (quantisedMaxVal + 1) / 166;

    const colors: [number, number, number][] = new Array(numX * numY);
    colors[0] = decodeDC(decode83(hash.substring(2, 6)));

    for (let i = 1; i < numX * numY; i++) {
      colors[i] = decodeAC(decode83(hash.substring(4 + i * 2, 6 + i * 2)), maxVal * punch);
    }

    const pixels = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;
        for (let j = 0; j < numY; j++) {
          for (let i = 0; i < numX; i++) {
            const basis = Math.cos((Math.PI * x * i) / width) * Math.cos((Math.PI * y * j) / height);
            const color = colors[i + j * numX];
            r += color[0] * basis;
            g += color[1] * basis;
            b += color[2] * basis;
          }
        }
        const idx = 4 * (x + y * width);
        pixels[idx] = linearToSRGB(r);
        pixels[idx + 1] = linearToSRGB(g);
        pixels[idx + 2] = linearToSRGB(b);
        pixels[idx + 3] = 255;
      }
    }
    return pixels;
  }

  function renderBlurHash(canvas: HTMLCanvasElement, hash: string, width: number, height: number) {
    const pixels = decodeBlurHash(hash, width, height);
    if (!pixels) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    const imgData = ctx.createImageData(width, height);
    imgData.data.set(pixels);
    ctx.putImageData(imgData, 0, 0);
  }

  function getCachedImages(): CachedImage[] {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return [];
      return JSON.parse(cached) as CachedImage[];
    } catch {
      return [];
    }
  }

  function cacheImage(image: CachedImage) {
    try {
      const cached = getCachedImages();
      if (cached.some((img) => img.id === image.id)) return;

      cached.push(image);
      while (cached.length > maxCachedImages) {
        cached.shift();
      }
      localStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch (e) {
      console.warn("Failed to cache image:", e);
    }
  }

  function getRandomCachedImage(): CachedImage | null {
    const cached = getCachedImages();
    if (cached.length === 0) return null;
    return cached[Math.floor(Math.random() * cached.length)];
  }

  function useFallbackImage() {
    const img = new Image();
    img.onload = () => {
      imageLoaded = true;
      if (bgImage) {
        bgImage.style.backgroundImage = `url(${fallback.url!})`;
      }
    };
    img.src = fallback.url!;
    usingFallback = true;
  }

  function useCachedImage(cached: CachedImage) {
    imageData = {
      id: cached.id,
      url: cached.url,
      authorName: cached.authorName,
      authorProfileUrl: cached.authorProfileUrl,
      htmlUrl: cached.htmlUrl,
      blurHash: cached.blurHash,
    };

    if (blurCanvas && cached.blurHash) {
      renderBlurHash(blurCanvas, cached.blurHash, 32, 32);
    }

    const img = new Image();
    img.onload = () => {
      imageLoaded = true;
      if (bgImage) {
        bgImage.style.backgroundImage = `url(${cached.url})`;
      }
    };
    img.onerror = () => {
      console.warn("Failed to load cached image, using fallback");
      useFallbackImage();
    };
    img.src = cached.url;
  }

  async function fetchBackgroundImage(width: number, height: number) {
    try {
      const res = await fetch(`${apiEndpoint}?dim=${width}x${height}`, {
        credentials: "same-origin",
      });

      if (!res.ok) {
        if (res.status === 429) {
          console.warn("Rate limited, using cached image");
          const cached = getRandomCachedImage();
          if (cached) {
            useCachedImage(cached);
            return;
          }
        }
        console.warn("Image API returned error, using fallback");
        useFallbackImage();
        return;
      }

      const data = (await res.json()) as Unsplash.GetImageRes;

      if (data.type === "success" && blurCanvas) {
        imageData = {
          id: data.image.id,
          url: data.image.url,
          authorName: data.image.authorName,
          authorProfileUrl: `https://unsplash.com/@${data.image.authorName}?utm_source=supportmail&utm_medium=referral`,
          htmlUrl: `${data.image.htmlUrl}?utm_source=supportmail&utm_medium=referral`,
          blurHash: data.image.blurHash,
        };

        cacheImage({
          id: data.image.id,
          url: data.image.url,
          authorName: data.image.authorName,
          authorProfileUrl: `https://unsplash.com/@${data.image.authorName}?utm_source=supportmail&utm_medium=referral`,
          htmlUrl: `${data.image.htmlUrl}?utm_source=supportmail&utm_medium=referral`,
          blurHash: data.image.blurHash,
          timestamp: new Date().toISOString(),
        });

        renderBlurHash(blurCanvas, data.image.blurHash, 32, 32);

        const img = new Image();
        img.onload = () => {
          imageLoaded = true;
          if (bgImage) {
            bgImage.style.backgroundImage = `url(${data.image.url})`;
          }
        };
        img.onerror = () => {
          console.warn("Failed to load Unsplash image, using fallback");
          useFallbackImage();
        };
        img.src = data.image.url;
      } else if (data.type === "error") {
        console.warn("Image API returned error response, using fallback");
        const cached = getRandomCachedImage();
        if (cached) {
          useCachedImage(cached);
        } else {
          useFallbackImage();
        }
      }
    } catch (e) {
      console.error("Failed to fetch background image:", e);
      const cached = getRandomCachedImage();
      if (cached) {
        useCachedImage(cached);
      } else {
        useFallbackImage();
      }
    }
  }

  onMount(async () => {
    if (browser && screenDimensions.width && screenDimensions.height && !imageData && !usingFallback) {
      const cached = getRandomCachedImage();
      if (
        cached &&
        dayjs(cached.timestamp).isValid() &&
        dayjs().diff(dayjs(cached.timestamp), "minutes") < cacheExpiryMinutes
      ) {
        useCachedImage(cached);
        return;
      }
      await fetchBackgroundImage(screenDimensions.width, screenDimensions.height);
    }
  });
</script>

<svelte:window
  {@attach (w) => {
    screenDimensions = {
      width: w.innerWidth,
      height: w.innerHeight,
    };
  }}
/>

<div id="bg-blur" class:loaded={imageLoaded}>
  <canvas bind:this={blurCanvas}></canvas>
</div>
<div id="bg-image" bind:this={bgImage} class:loaded={imageLoaded}></div>
<p class="text-muted-foreground absolute right-3 bottom-3 z-50 text-[10px] hover:text-blue-500">
  {#if imageData}
    Photo by <a href={imageData.authorProfileUrl ?? fallback.authorUrl} target="_blank"
      >{imageData.authorName ?? fallback.authorName}</a
    >
    on
    <a href={imageData.htmlUrl ?? fallback.imageUrl} target="_blank">Unsplash</a>
  {/if}
</p>

<style>
  #bg-blur {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -2;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
    overflow: hidden;
  }

  #bg-blur.loaded {
    opacity: 1;
  }

  #bg-blur canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(40px);
    transform: scale(1.5);
  }

  #bg-image {
    width: 100%;
    height: 100%;
    position: absolute;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    object-fit: cover;
    backdrop-filter: blur(0.75vh);
    filter: blur(0.75vh);
    -webkit-filter: blur(0.75vh);
    box-shadow: 0 0 200px rgba(0, 0, 0, 0.3) inset;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
  }

  #bg-image.loaded {
    opacity: 1;
  }
</style>
