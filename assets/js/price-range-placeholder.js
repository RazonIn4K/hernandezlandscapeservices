(() => {
  const PHONE = "(815) 501-1478";
  const EN = `Photo estimate — call or text ${PHONE}`;
  const ES = `Estimado con foto — llama o manda un mensaje al ${PHONE}`;

  const placeholderText = () =>
    document.documentElement.lang.toLowerCase().startsWith("es") ? ES : EN;

  const replaceZeroRange = () => {
    const priceRange = document.getElementById("priceRange");
    if (!priceRange) return;
    if (!/^\s*\$0\s*[-\u2013\u2014]\s*\$0\s*$/.test(priceRange.textContent || "")) {
      return;
    }
    priceRange.textContent = placeholderText();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", replaceZeroRange, { once: true });
  } else {
    replaceZeroRange();
  }
})();
