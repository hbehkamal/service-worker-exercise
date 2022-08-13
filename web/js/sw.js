"use strict";

// This file's codes are going to run at installation and at restarting (inactive bg tab becomes foreground) state of SW life cycle

const version = 2; // All resources are an atomic package which might get updated

var isOnline = true;
var isLoggedIn = false;

self.addEventListener("install", onInstall);
self.addEventListener("activate", onActivate);
// 3.0 : Listen for messages from the page
self.addEventListener("message", onMessage);

// ********************************************

// Main runner
main().catch(console.error());

// ********************************************

async function main() {
  // 1: Ask for a status update from the page
  await sendMessage({ requestStatusUpdate: true })
}

async function onInstall(evt) {
  console.log(`Service Worker version ${version} installed`);
  self.skipWaiting();
}

// 2.0 : send message to page
async function sendMessage(msg) {
  // 2.1 : get list of all service worker clients
  // includeUncontrolled: true means:
  // the matching operation will return all service worker clients who share the same origin as the current SW.
  // Otherwise, it returns only the service worker clients controlled by the current service worker.
  var allClients = await clients.matchAll({
    includeUncontrolled: true
  });

  return Promise.all(
    allClients.map(function clientMsg(client) {
      // 2.2 : Create a unique message channel for each client (page) that we are talking to
      var chan = new MessageChannel();
      // 2.3 : listen from messages on FIRST created port for each channel 
      chan.port1.onmessage = onMessage;

      // 2.4 : send message to the page (client) using SECOND port
      return client.postMessage(msg, [chan.port2]);
    })
  )
}
// 3.1 : Receive messages from page
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
