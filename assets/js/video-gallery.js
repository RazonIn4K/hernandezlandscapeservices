(function () {
  "use strict";

  var allVideos = Array.prototype.slice.call(
    document.querySelectorAll(".video-grid video"),
  );
  if (!allVideos.length) return;

  allVideos.forEach(function (video) {
    var card = video.closest(".video-card");
    video.addEventListener("play", function () {
      if (card) card.classList.add("is-playing");
    });
    video.addEventListener("pause", function () {
      if (card) card.classList.remove("is-playing");
    });
  });

  var englishLabels = allVideos.map(function (video) {
    return video.getAttribute("aria-label") || "Hernandez Landscape project video";
  });

  function updateVideoLabels(lang) {
    var useSpanish = lang === "es";
    var template = useSpanish && window.siteI18n
      ? window.siteI18n.t("video.control.label", "es")
      : "";
    allVideos.forEach(function (video, index) {
      var label = useSpanish && template
        ? template.replace("{{number}}", String(index + 1))
        : englishLabels[index];
      video.setAttribute("aria-label", label);
    });
  }

  if (window.siteI18n) {
    updateVideoLabels(window.siteI18n.getLanguage());
    window.siteI18n.onChange(updateVideoLabels);
  }

  var videos = allVideos.filter(function (video) {
    return video.hasAttribute("data-poster");
  });
  if (!videos.length) return;

  function loadPoster(video) {
    var poster = video.getAttribute("data-poster");
    if (!poster) return;
    video.setAttribute("poster", poster);
    video.removeAttribute("data-poster");
  }

  if (!("IntersectionObserver" in window)) {
    videos.forEach(loadPoster);
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        loadPoster(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "600px 0px" },
  );

  videos.forEach(function (video) {
    observer.observe(video);
    video.addEventListener("focus", function () {
      loadPoster(video);
      observer.unobserve(video);
    }, { once: true });
  });
})();
