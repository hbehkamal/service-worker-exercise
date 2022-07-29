"use strict";

// This file's codes are going to run at installation and at restarting (inactive bg tab becomes foreground) state of SW life cycle

const version = 1; // All resources are an atomic package which might get updated

self.addEventListener("install", onInstall);
self.addEventListener("activate", onActivate);

// ********************************************

// Main runner
main().catch(console.error());

// ********************************************

async function main() {
  console.log(`Service Worker version ${version} started`);
}

async function onInstall(evt) {
  console.log(`Service Worker version ${version} installed`);
  self.skipWaiting();
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
