const CACHE_NAME = "hissan-puzzle-v109";
const rewardAssetPath = (folder, prefix, count) =>
  Array.from({ length: count }, (_, index) => `./assets/rewards/${folder}/${prefix}${String(index + 1).padStart(3, "0")}.png`);
const backgroundAssetPath = (folder, count) =>
  Array.from({ length: count }, (_, index) => `./assets/backgrounds/${folder}/background${String(index + 1).padStart(3, "0")}.png`);
const REWARD_ASSETS = [
  ...rewardAssetPath("characters", "char", 50),
  ...rewardAssetPath("stickers", "sticker", 24),
  ...rewardAssetPath("titles", "title", 12),
];
const BACKGROUND_ASSETS = [...backgroundAssetPath("quest-v1-16x9", 30)];
const ASSETS = [
  "./",
  "./index.html",
  "./robots.txt",
  "./sitemap.xml",
  "./seo-multiplication.html",
  "./seo-division.html",
  "./seo-kuku-fill.html",
  "./seo-hissan-weak.html",
  "./seo-division-confusing.html",
  "./seo-carry-multiplication.html",
  "./seo-kuku-usable.html",
  "./seo-calculation-mistakes.html",
  "./seo-free-practice.html",
  "./styles.css",
  "./script.js",
  "./manifest.webmanifest?v=103",
  "./assets/characters/character-main.png",
  "./assets/characters/character-happy.png",
  "./assets/characters/character-thinking.png",
  "./assets/characters/character-cheer.png",
  "./assets/stages/stage-forest.png",
  "./assets/stages/stage-river.png",
  "./assets/stages/stage-mountain.png",
  "./assets/stages/stage-cave.png",
  "./assets/stages/stage-castle.png",
  "./assets/stages/stage-starland.png",
  ...REWARD_ASSETS,
  ...BACKGROUND_ASSETS,
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const isLocalAsset = ["script", "style", "image", "font"].includes(request.destination);
  const isVersionedAsset = url.searchParams.has("v");
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html") || isVersionedAsset) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html"))),
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (isLocalAsset) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
