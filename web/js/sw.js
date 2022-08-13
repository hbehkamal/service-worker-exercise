"use strict";

const version = 4; // All resources are an atomic package which might get updated

var isOnline = true;
var isLoggedIn = false;
// 1.0
var cacheName = `cache-v${version}`

// 1.1 list the URLs we want to cache
var urlsToCache = {
  loggoutOut: [
    "/",
    "/about",
    "/contact",
    "/login",
    "/404",
    "/offline",
    "/js/add-post.js",
    "/js/blog.js",
    "/js/home.js",
    "/js/login.js",
    "/css/style.css",
    "/images/logo.gif",
    "/images/offline.png",

  ]
}

self.addEventListener("install", onInstall);
self.addEventListener("activate", onActivate);
self.addEventListener("message", onMessage);

// ********************************************

// Main runner
main().catch(console.error());

// ********************************************

async function main() {
  await sendMessage({ requestStatusUpdate: true })
  // 2.0 cache URLs even unless they are already cached
  await cacheLoggedOutFiles();
}

async function onInstall(evt) {
  console.log(`Service Worker version ${version} installed`);
  self.skipWaiting();
}

// 2.0 : send message to page
async function sendMessage(msg) {
  var allClients = await clients.matchAll({
    includeUncontrolled: true
  });

  return Promise.all(
    allClients.map(function clientMsg(client) {
      var chan = new MessageChannel();
      chan.port1.onmessage = onMessage;
      return client.postMessage(msg, [chan.port2]);
    })
  )
}
function onMessage({ data }) {
  if (data.statusUpdate) {
    ({ isLoggedIn, isOnline } = data.statusUpdate);
    console.log("SW version is ", version, ", isOnline", isOnline, ", isLoggedIn", isLoggedIn);
  }
}

async function handleActivation() {
  // 3 clear caches from last service worker
  await clearCaches();
  // 2.1 cache URLs even if they are already cached
  await cacheLoggedOutFiles(true);
  await clients.claim();

  console.log(`Service Worker version ${version} activated`);
}

function onActivate(evt) {
  // Since brwoser might shut down SW, we have to say to NOT until we want!
  evt.waitUntil(handleActivation());
}
// 1.2 cache defined URLs
async function cacheLoggedOutFiles(forceReload = false) {
  // create a cache with a name
  var cache = await caches.open(cacheName);

  return Promise.all(
    urlsToCache.loggoutOut.map(async function requestFile(url) {
      try {
        let result;

        if (!forceReload) {
          // 1.3 Get data from cache if available and not forced to reload
          result = await cache.match(url);
          if (result) {
            return result;
          }

          // 1.4 define request options
          const fetchOptions = {
            method: "GET",
            cache: "no-cache", // Do not use browser cache
            credentials: "omit" // Do not send cookies
          }

          result = await fetch(url, fetchOptions);
          if (result.ok) {
            // 1.5 put the result to our own controlled cache
            await cache.put(url, result);
          }

        }


      } catch (error) {
        console.log('error: ', error);
      }
    })
  )
}

async function clearCaches() {
  // 3.1 get all cache names
  var cacheNames = await caches.keys();
  // 3.2 which of these names are old caches?
  var oldCacheNames = cacheNames.filter((name) => {
    if (/^cache-v\d+$/.test(name)) {
      let [, cacheVersion] = name.match(/^cache-v(\d+)$/);
      cacheVersion = (cacheVersion != null) ? Number(cacheVersion) : cacheVersion
      return (cacheVersion > 0 && cacheVersion != version)
    }
  });

  // 3.3 delete from cache storage one by one
  return Promise.all(
    oldCacheNames.map((name) => caches.delete(name)
    )
  )
}