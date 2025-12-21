// PTREE landing page tiny JS: theme toggle, copy buttons, hero tabs.
(function(){
  const root = document.documentElement;

  // Theme: remember preference.
  const savedTheme = localStorage.getItem("ptreeTheme");
  if (savedTheme === "light" || savedTheme === "dark") {
    root.setAttribute("data-theme", savedTheme);
  }

  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme");
      const next = cur === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      localStorage.setItem("ptreeTheme", next);
    });
  }

  // Copy buttons
  function copyText(text) {
    return navigator.clipboard.writeText(text);
  }

  document.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const sel = btn.getAttribute("data-copy");
      const el = document.querySelector(sel);
      if (!el) return;

      // If multiple code blocks are inside (hero), copy visible one
      const codeBlocks = el.querySelectorAll("code");
      let text = "";
      if (codeBlocks.length > 1) {
        const visible = Array.from(codeBlocks).find(c => !c.classList.contains("hide"));
        text = (visible?.innerText || visible?.textContent || "").trim();
      } else {
        text = (el.innerText || el.textContent || "").trim();
      }

      try {
        await copyText(text);
        const old = btn.innerHTML;
        btn.innerHTML = '<span class="btn-ico" aria-hidden="true">✅</span><span class="btn-text">Copied</span>';
        setTimeout(() => { btn.innerHTML = old; }, 900);
      } catch (e) {
        // fallback
        console.warn("Copy failed", e);
        alert("Copy failed. Your browser may block clipboard access.");
      }
    });
  });

  // Hero tabs
  const hero = document.getElementById("heroCode");
  if (hero) {
    const tabs = document.querySelectorAll(".tab");
    const codes = hero.querySelectorAll("code[data-code]");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        tabs.forEach(t => t.classList.toggle("active", t === tab));
        tabs.forEach(t => t.setAttribute("aria-selected", t === tab ? "true" : "false"));
        codes.forEach(c => c.classList.toggle("hide", c.getAttribute("data-code") !== target));
      });
    });
  }
})();
