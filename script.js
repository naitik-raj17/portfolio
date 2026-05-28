const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function setYear() {
  const el = $("#year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function setupMobileMenu() {
  const btn = $(".menu-btn");
  const panel = $(".mobile-nav");
  if (!btn || !panel) return;

  const setOpen = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  };

  setOpen(false);

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  panel.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches("a[href^='#']")) setOpen(false);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

function setupActiveNav() {
  const links = $$(".nav-link").filter((a) => a.getAttribute("href")?.startsWith("#"));
  if (links.length === 0) return;

  const sections = links
    .map((a) => {
      const id = a.getAttribute("href")?.slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);

  const mapLink = new Map();
  for (const a of links) {
    const id = a.getAttribute("href")?.slice(1);
    if (id) mapLink.set(id, a);
  }

  const setCurrent = (id) => {
    for (const a of links) a.removeAttribute("aria-current");
    const a = mapLink.get(id);
    if (a) a.setAttribute("aria-current", "page");
  };

  const obs = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
      const id = visible?.target?.id;
      if (id) setCurrent(id);
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: [0.1, 0.2, 0.3, 0.4, 0.5] },
  );

  for (const sec of sections) obs.observe(sec);
}

function setupContactForm() {
  const form = $("#contactForm");
  if (!form) return;
  const status = $("#contactStatus");
  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    const endpoint = form.getAttribute("data-endpoint") || "";
    const payload = {
      name,
      email,
      message,
      source: "portfolio",
      page: window.location.href,
      sentAt: new Date().toISOString(),
    };

    const setStatus = (text) => {
      if (status) status.innerHTML = text;
    };

    const setBusy = (busy) => {
      if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = busy;
      form.toggleAttribute("aria-busy", busy);
    };

    const fallbackMailto = () => {
      const subject = encodeURIComponent(`Portfolio inquiry from ${name || "Someone"}`);
      const body = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:rajnaitikone@gmail.com?subject=${subject}&body=${body}`;
    };

    if (!endpoint) {
      setStatus("No backend endpoint configured. Opening email client…");
      fallbackMailto();
      return;
    }

    setBusy(true);
    setStatus("Sending…");

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Optional response parsing; ignore body if empty
        try {
          await res.json();
        } catch {
          // ignore
        }
        setStatus("Sent. I’ll get back to you soon.");
        form.reset();
      })
      .catch(() => {
        setStatus("Backend unavailable. Opening email client…");
        fallbackMailto();
      })
      .finally(() => {
        setBusy(false);
      });
  });
}

setYear();
setupMobileMenu();
setupActiveNav();
setupContactForm();

