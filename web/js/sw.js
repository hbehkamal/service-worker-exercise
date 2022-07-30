"use strict";

// This file's codes are going to run at installation and at restarting (inactive bg tab becomes foreground) state of SW life cycle

const version = 2; // All resources are an atomic package which might get updated

var isOnline = true;
var isLoggedIn = false;

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

async function sendMessage(msg) {
  var allClients = await clients.matchAll({
    includeUncontrolled: true
  });

  return Promise.all(
    allClients.map(function clientMsg(client) {
      var chan = new MessageChannel();
      chan.port1.onmessage = onMessage;  // listen on port 1
      return client.postMessage(msg, [chan.port2]); // Send on port 2
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
