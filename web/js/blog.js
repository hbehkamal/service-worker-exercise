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
		});

		window.addEventListener("offline", () => {
			offlineIcon.classList.remove("hidden");
			isOnline = false;
		});
	}

	const initServiceWorker = async () => {
		swRegistration = await navigator.serviceWorker.register("/sw.js", {
			updateViaCache: "none",
		});

		// installing	: First time 
		// wating     : when new SW is wating for last SW to finish its job. we can skip this step (skipWating) after installation;
		svcworker = swRegistration.installing || swRegistration.wating || swRegistration.active;

		navigator.serviceWorker.addEventListener("controllerchange", () => {
			// new SW started working
			svcworker = navigator.serviceWorker.controller;
		})
	}

})();
