const header = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");
const heroCopy = document.querySelector("[data-tilt]");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelector("[data-year]").textContent = new Date().getFullYear();

const closeMenu = () => {
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
  document.body.style.overflow = "";
};

menuButton.addEventListener("click", () => {
  const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(willOpen));
  navigation.classList.toggle("is-open", willOpen);
  document.body.style.overflow = willOpen ? "hidden" : "";
});

navLinks.forEach((link) => link.addEventListener("click", closeMenu));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("is-open")) {
    closeMenu();
    menuButton.focus();
  }
});

const syncScroll = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 36);
  if (!reducedMotion.matches) {
    hero.style.setProperty("--pan-y", `${Math.min(window.scrollY * 0.055, 48)}px`);
  }
};

syncScroll();
window.addEventListener("scroll", syncScroll, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  },
  { rootMargin: "-35% 0px -50%", threshold: [0, 0.25, 0.6] }
);

sections.forEach((section) => sectionObserver.observe(section));

const setPointerPosition = (event) => {
  const bounds = hero.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  const xRatio = Math.max(0, Math.min(1, x / bounds.width));
  const yRatio = Math.max(0, Math.min(1, y / bounds.height));

  hero.style.setProperty("--pointer-x", `${xRatio * 100}%`);
  hero.style.setProperty("--pointer-y", `${yRatio * 100}%`);
  hero.style.setProperty("--pan-x", `${(0.5 - xRatio) * 18}px`);

  heroCopy.style.setProperty("--tilt-x", `${(xRatio - 0.5) * 1.7}deg`);
  heroCopy.style.setProperty("--tilt-y", `${(0.5 - yRatio) * 1.25}deg`);
};

if (!reducedMotion.matches) {
  hero.addEventListener("pointermove", setPointerPosition, { passive: true });
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--pointer-x", "50%");
    hero.style.setProperty("--pointer-y", "50%");
    hero.style.setProperty("--pan-x", "0px");
    heroCopy.style.setProperty("--tilt-x", "0deg");
    heroCopy.style.setProperty("--tilt-y", "0deg");
  });
}

document.querySelectorAll("[data-hover-card]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--card-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--card-y", `${event.clientY - bounds.top}px`);
  });
});

const canvas = document.querySelector("#life-layer");
const context = canvas.getContext("2d");
const pointer = { x: -1000, y: -1000, active: false };
let spores = [];
let canvasWidth = 0;
let canvasHeight = 0;
let animationFrame = 0;

const colors = [
  "rgba(238, 232, 216, 0.64)",
  "rgba(215, 126, 103, 0.65)",
  "rgba(201, 208, 184, 0.55)",
];

const createSpore = (index) => ({
  x: Math.random() * canvasWidth,
  y: Math.random() * canvasHeight,
  vx: (Math.random() - 0.5) * 0.18,
  vy: -0.08 - Math.random() * 0.18,
  radius: 1.2 + Math.random() * 2.8,
  phase: Math.random() * Math.PI * 2,
  length: 8 + Math.random() * 17,
  color: colors[index % colors.length],
});

const resizeCanvas = () => {
  const bounds = hero.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
  canvasWidth = bounds.width;
  canvasHeight = bounds.height;
  canvas.width = Math.round(canvasWidth * ratio);
  canvas.height = Math.round(canvasHeight * ratio);
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  spores = Array.from({ length: Math.max(16, Math.round(canvasWidth / 55)) }, (_, index) => createSpore(index));
};

const drawSpore = (spore, time) => {
  const wave = Math.sin(time * 0.0014 + spore.phase);
  context.beginPath();
  context.fillStyle = spore.color;
  context.arc(spore.x, spore.y, spore.radius * (1 + wave * 0.12), 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.lineWidth = 0.55;
  context.strokeStyle = spore.color.replace(/0\.[0-9]+\)/, "0.28)");
  context.moveTo(spore.x, spore.y + spore.radius);
  context.bezierCurveTo(
    spore.x + wave * 4,
    spore.y + spore.length * 0.33,
    spore.x - wave * 5,
    spore.y + spore.length * 0.66,
    spore.x + wave * 3,
    spore.y + spore.length
  );
  context.stroke();
};

const animateLife = (time) => {
  context.clearRect(0, 0, canvasWidth, canvasHeight);

  spores.forEach((spore) => {
    if (pointer.active) {
      const dx = spore.x - pointer.x;
      const dy = spore.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < 155) {
        const force = (155 - distance) / 155;
        spore.vx += (dx / distance) * force * 0.035;
        spore.vy += (dy / distance) * force * 0.035;
      }
    }

    spore.vx *= 0.988;
    spore.vy = spore.vy * 0.992 - 0.0007;
    spore.x += spore.vx + Math.sin(time * 0.0006 + spore.phase) * 0.07;
    spore.y += spore.vy;

    if (spore.y < -spore.length) {
      spore.y = canvasHeight + spore.length;
      spore.x = Math.random() * canvasWidth;
    }
    if (spore.x < -20) spore.x = canvasWidth + 20;
    if (spore.x > canvasWidth + 20) spore.x = -20;

    drawSpore(spore, time);
  });

  animationFrame = requestAnimationFrame(animateLife);
};

if (!reducedMotion.matches && context) {
  resizeCanvas();
  animationFrame = requestAnimationFrame(animateLife);
  window.addEventListener("resize", resizeCanvas, { passive: true });
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
}

reducedMotion.addEventListener("change", (event) => {
  if (event.matches) {
    cancelAnimationFrame(animationFrame);
    context.clearRect(0, 0, canvasWidth, canvasHeight);
  }
});
