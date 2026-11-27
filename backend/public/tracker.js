(function () {
  "use strict";

  var STORAGE_KEY = "cf_analytics_session_id";
  var COOKIE_NAME = "cf_session_id";

  var currentScript = document.currentScript;
  var scriptOrigin = "";
  if (currentScript && currentScript.src) {
    try {
      scriptOrigin = new URL(currentScript.src).origin;
    } catch (_) {
      scriptOrigin = "";
    }
  }

  var SITE_ID =
    (currentScript && currentScript.getAttribute("data-site-id")) ||
    window.__CF_SITE_ID__ ||
    window.location.hostname ||
    "default";

  var ENDPOINT =
    (currentScript && currentScript.getAttribute("data-endpoint")) ||
    window.__CF_ANALYTICS_ENDPOINT__ ||
    (scriptOrigin ? scriptOrigin + "/api/events" : "/api/events");

  function generateUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return "sess_" + crypto.randomUUID().slice(0, 13);
    }
    return (
      "sess_" +
      "xxxxxxxx-xxxx".replace(/x/g, function () {
        return Math.floor(Math.random() * 16).toString(16);
      })
    );
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
  }

  function getSessionId() {
    var id = null;
    try {
      id = window.localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      id = null;
    }

    if (!id) {
      id = getCookie(COOKIE_NAME);
    }

    if (!id) {
      id = generateUUID();
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch (_) {}
    setCookie(COOKIE_NAME, id, 30);

    return id;
  }

  function getCleanUrl() {
    return window.location.origin + window.location.pathname;
  }

  function sendEvent(payload) {
    var body = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        var blob = new Blob([body], { type: "text/plain" });
        var queued = navigator.sendBeacon(ENDPOINT, blob);
        if (queued) return;
      } catch (_) {}
    }

    if (typeof fetch === "function") {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true,
      }).catch(function () {});
    }
  }

  var sessionId = getSessionId();

  function trackPageView() {
    sendEvent({
      site_id: SITE_ID,
      session_id: sessionId,
      event_type: "page_view",
      url: getCleanUrl(),
      timestamp: new Date().toISOString(),
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
    });
  }

  function trackClick(e) {
    if (e.target && e.target.closest && e.target.closest("[data-analytics-ignore]")) {
      return;
    }

    var target = e.target;
    var tag = target && target.tagName ? target.tagName.toUpperCase() : undefined;
    var text =
      target && typeof target.innerText === "string"
        ? target.innerText.trim().replace(/\s+/g, " ").slice(0, 60)
        : undefined;

    sendEvent({
      site_id: SITE_ID,
      session_id: sessionId,
      event_type: "click",
      url: getCleanUrl(),
      timestamp: new Date().toISOString(),
      x: Math.round(e.pageX),
      y: Math.round(e.pageY),
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
      element_tag: tag,
      element_text: text || undefined,
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    trackPageView();
  } else {
    document.addEventListener("DOMContentLoaded", trackPageView);
  }

  document.addEventListener("click", trackClick, true);

  var lastUrl = getCleanUrl();
  function handleRouteChange() {
    var nextUrl = getCleanUrl();
    if (nextUrl !== lastUrl) {
      lastUrl = nextUrl;
      trackPageView();
    }
  }

  var origPushState = window.history.pushState;
  window.history.pushState = function () {
    origPushState.apply(this, arguments);
    handleRouteChange();
  };
  window.addEventListener("popstate", handleRouteChange);

  window.__CF_TRACKER__ = {
    siteId: SITE_ID,
    sessionId: sessionId,
    trackPageView: trackPageView,
  };
})();
