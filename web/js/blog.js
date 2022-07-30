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
			sendStatusUpdate();

		});

		window.addEventListener("offline", () => {
			offlineIcon.classList.remove("hidden");
			isOnline = false;
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
		sendStatusUpdate(svcworker);

		navigator.serviceWorker.addEventListener("controllerchange", () => {
			// new SW started working
			svcworker = navigator.serviceWorker.controller;
			sendStatusUpdate(svcworker);
		});

		navigator.serviceWorker.addEventListener("message", onSWMessage);
	}

	function onSWMessage(evt) {
		var { data } = evt;
		if (data.requestStatusUpdate) {
			// hey page! can u give me an update?
			console.log("Received status update request from service worker, responding");
			// port between page and sw
			sendStatusUpdate(evt.ports && evt.ports[0]);
		}
	}

	function sendStatusUpdate(target) {
		sendSWMessage({ statusUpdate: { isOnline, isLoggedIn } }, target)
	}

	function sendSWMessage(msg, target) {
		if (target) {
			target.postMessage(msg);
		} else if (svcworker) {
			svcworker.postMessage(msg);
		} else {
			navigator.serviceWorker.controller.postMessage(msg);
		}
	}

})();
