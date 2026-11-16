import { applyStaticTranslations, setLanguage, t } from "./i18n.js";

const copy = [
  [".sources-container>.eyebrow", "sources.eyebrow"],
  [".sources-container h1", "sources.heading", "firstText"],
  [".sources-lead", "sources.lead"],
  [".sources-warning strong", "sources.prototype"],
  [".sources-warning span", "sources.disclaimer"],
  [".sources-container>h2:nth-of-type(1)", "sources.resources"],
  [".sources-grid a:nth-child(1) strong", "sources.ctx"],
  [".sources-grid a:nth-child(1) p", "sources.ctxBody"],
  [".sources-grid a:nth-child(1) em", "sources.ctxLink"],
  [".sources-grid a:nth-child(2) strong", "sources.trek"],
  [".sources-grid a:nth-child(2) p", "sources.trekBody"],
  [".sources-grid a:nth-child(3) strong", "sources.perseverance"],
  [".sources-grid a:nth-child(3) p", "sources.perseveranceBody"],
  [".sources-grid a:nth-child(4) strong", "sources.donki"],
  [".sources-grid a:nth-child(4) p", "sources.donkiBody"],
  [".sources-container>h2:nth-of-type(2)", "sources.pipeline"],
  [".source-pipeline span:nth-of-type(1)", "sources.pipe1"],
  [".source-pipeline span:nth-of-type(2)", "sources.pipe2"],
  [".source-pipeline span:nth-of-type(3)", "sources.pipe3"],
  [".source-pipeline span:nth-of-type(4)", "sources.pipe4"],
  [".source-pipeline span:nth-of-type(5)", "sources.pipe5"],
  [".source-pipeline span:nth-of-type(6)", "sources.pipe6"],
  [".sources-container>h2:nth-of-type(3)", "sources.real"],
  [".sources-facts>div:nth-child(1) strong", "sources.crop"],
  [".sources-facts>div:nth-child(1) p", "sources.cropBody"],
  [".sources-facts>div:nth-child(2) strong", "sources.overview"],
  [".sources-facts>div:nth-child(2) p", "sources.overviewBody"],
  [".sources-facts>div:nth-child(3) strong", "sources.routing"],
  [".sources-facts>div:nth-child(3) p", "sources.routingBody"],
  [".sources-facts>div:nth-child(4) strong", "sources.synthetic"],
  [".sources-facts>div:nth-child(4) p", "sources.syntheticBody"],
  [".sources-facts>div:nth-child(5) strong", "sources.limits"],
  [".sources-facts>div:nth-child(5) p", "sources.limitsBody"],
  [".sources-container>h2:nth-of-type(4)", "sources.attribution"],
];
function render() {
  applyStaticTranslations();
  for (const [selector, key, kind] of copy) {
    const el = document.querySelector(selector);
    if (!el) continue;
    if (kind === "firstText") {
      const node = [...el.childNodes].find(
        (n) => n.nodeType === Node.TEXT_NODE,
      );
      if (node) node.textContent = t(key);
    } else el.textContent = t(key);
  }
  document
    .querySelectorAll(".sources-grid a:not(:first-child) em")
    .forEach((el) => (el.textContent = t("sources.open")));
  const last = document.querySelector(
    ".sources-container>h2:nth-of-type(4) + p",
  );
  if (last) {
    const node = [...last.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE,
    );
    if (node) node.textContent = t("sources.attributionBody") + " ";
  }
  const links = document.querySelectorAll(".sources-end a");
  for (const [index, key] of [
    "sources.usgsCredit",
    "sources.nasaGuidance",
    "sources.details",
    "sources.importer",
  ].entries())
    if (links[index]) links[index].textContent = t(key);
}
document.querySelectorAll("[data-language]").forEach((button) =>
  button.addEventListener("click", () => {
    setLanguage(button.dataset.language);
    render();
  }),
);
render();
