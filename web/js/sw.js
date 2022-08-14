"use strict";

const version = 5; // All resources are an atomic package which might get updated

var isOnline = true;
var isLoggedIn = false;

var cacheName = `cache-v${version}`
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
// 1.0
self.addEventListener("fetch", onFetch);

// ********************************************

// Main runner
main().catch(console.error());

// ********************************************

async function main() {
  await sendMessage({ requestStatusUpdate: true })
  await cacheLoggedOutFiles();
}

async function onInstall(evt) {
  console.log(`Service Worker version ${version} installed`);
  self.skipWaiting();
}

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
  await clearCaches();
  await cacheLoggedOutFiles(true);
  await clients.claim();

  console.log(`Service Worker version ${version} activated`);
}

function onActivate(evt) {
  // Since brwoser might shut down SW, we have to say to NOT until we want!
  evt.waitUntil(handleActivation());
}
async function cacheLoggedOutFiles(forceReload = false) {
  var cache = await caches.open(cacheName);

  return Promise.all(
    urlsToCache.loggoutOut.map(async function requestFile(url) {
      try {
        let result;

        if (!forceReload) {
          result = await cache.match(url);
          if (result) {
            return result;
          }

          const fetchOptions = {
            method: "GET",
            cache: "no-cache", // Do not use browser cache
            credentials: "omit" // Do not send cookies
          }

          result = await fetch(url, fetchOptions);
          if (result.ok) {
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
  var cacheNames = await caches.keys();
  var oldCacheNames = cacheNames.filter((name) => {
    if (/^cache-v\d+$/.test(name)) {
      let [, cacheVersion] = name.match(/^cache-v(\d+)$/);
      cacheVersion = (cacheVersion != null) ? Number(cacheVersion) : cacheVersion
      return (cacheVersion > 0 && cacheVersion != version)
    }
  });

  return Promise.all(
    oldCacheNames.map((name) => caches.delete(name)
    )
  )
}

function onFetch(evt) {
  const { request } = evt;

  // 1.1 wait until get a response
  evt.respondWith(router(request))
}

// 1.2
async function router(req) {
  var url = new URL(req.url);
  var reqUrl = url.pathname;
  var cache = await caches.open(cacheName);

  // 1.3 to prevent CORS
  if (url.origin == location.origin) {
    let res;
    try {
      const fetchOptions = {
        method: req.method,
        headers: req.headers,
        cache: "no-store",
        credentials: "omit"
      }

      // 1.4 The startegy: 
      //      - make the request
      //      - store the response into cache 
      //      - If didn't get the response (e.g. because of being offline), use cache
      res = await fetch(req.url, fetchOptions);
      if (res && res.ok) {
        // 1.4 cache the response
        await cache.put(reqUrl, res.clone());
        // 1.4 return the response for evt.respondWith
        return res;
      }
    } catch (error) {
      console.log('error: ', error);
    }

    // 1.5 check our cache if it didn't get a response from server (for any reason e.g. we are offline)
    res = await cache.match(reqUrl);

    if (res) {
      return res.clone()
    }
  }

  // TODO: figure out CORS requests
}