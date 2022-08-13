"use strict";

const version = 3; // All resources are an atomic package which might get updated

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

// ********************************************

// Main runner
main().catch(console.error());

// ********************************************

async function main() {
  await sendMessage({ requestStatusUpdate: true })
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
  // Firing the controller. clients means all tabs;
  await clients.claim();
  console.log(`Service Worker version ${version} activated`);
}

function onActivate(evt) {
  // Since brwoser might shut down SW, we have to say to NOT until we want!
  evt.waitUntil(handleActivation());
}
