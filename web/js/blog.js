(function Blog() {
	"use strict";

	var offlineIcon;
	var isOnline = ("onLine" in navigator) ? navigator.onLine : true;
	var isLoggedIn = /isLoggedIn=1/.test(document.cookie.toString() || "");
	var usingSW = ("serviceWorker" in navigator);
	var swRegistration;
	var svcworker;

	document.addEventListener("DOMContentLoaded", ready, false);

	initServiceWorker().catch(console.error());
	// **********************************

	function ready() {
		offlineIcon = document.getElementById("connectivity-status");

		if (!isOnline) {
			offlineIcon.classList.remove("hidden");
		}

		window.addEventListener("online", () => {
			offlineIcon.classList.add("hidden");
			isOnline = true;
			// 2.5.2: Send a status update on online
			sendStatusUpdate();

		});

		window.addEventListener("offline", () => {
			offlineIcon.classList.remove("hidden");
			isOnline = false;
			// 2.5.2: Send a status update on offline
			sendStatusUpdate();
		});
	}

	async function initServiceWorker() {
		swRegistration = await navigator.serviceWorker.register("/sw.js", {
			updateViaCache: "none",
		});

		// installing	: First time 
		// wating     : when new SW is wating for last SW to finish its job. we can skip this step (skipWating) after installation;
		svcworker = swRegistration.installing || swRegistration.wating || swRegistration.active;
		// 2.5.0: Send a status update when service worker installed first time
		sendStatusUpdate(svcworker);

		navigator.serviceWorker.addEventListener("controllerchange", () => {
			// new SW started working
			svcworker = navigator.serviceWorker.controller;
			// 2.5.1 Send a status update when service worker controller changed
			sendStatusUpdate(svcworker);
		});

		// 2.0 : Listen for messages FROM service worker
		navigator.serviceWorker.addEventListener("message", onSWMessage);
	}

	// 2.1 : Listen for messages (from SW) and send a status update (to SW)
	function onSWMessage(evt) {
		var { data } = evt;
		// 2.2 The data sent from service worker. In this case asked for a update about isOnline & isLoggedIn
		if (data.requestStatusUpdate) {
			// hey page! can u give me an update?
			console.log("Received status update request from service worker, responding");
			// 2.3 port between page and sw 
			// Question: Whay we sned the message to svcworker?
			// Answer: because we might have multipe pages comunicating with
			// and we have to comunitcate throgh MESSAGE CHANNELs (unique local set of ports)
			sendStatusUpdate(evt.ports && evt.ports[0]);
		}
	}

	// 2.4 : send something (E.G. statuses like isOnline & isLoggedIn to service worker
	// Cause service worker DO NOT have access to coolies (isLoggedIn) and Navigator (isOnline)
	function sendStatusUpdate(target) {
		// The target is the PORT[0]
		const msg = { statusUpdate: { isOnline, isLoggedIn } };
		sendSWMessage(msg, target)
	}

	// 1 : Send A message TO Service worker from page
	function sendSWMessage(msg, target) {
		// The target is the PORT[0] that SW is listening from
		// Or, is the service worker freshly (installed / changed) contrller (check 2.5)
		if (target) {
			target.postMessage(msg);
		} else if (svcworker) {
			// Used when we send a status update on online/offline to currently active service worker
			svcworker.postMessage(msg);
		} else {
			// This case will not happen but it's just a fallback to make sure errors are handled.
			navigator.serviceWorker.controller.postMessage(msg);
		}
	}

})();
