const desktop = document.getElementById("desktop");
const folders = document.querySelectorAll(".folder");
const windows = document.querySelectorAll(".window");
let topZ = 20;

function bringToFront(win) {
  win.style.zIndex = String(++topZ);
}

function openWindow(name) {
  const target = document.querySelector(`[data-window-panel="${name}"]`);
  if (!target) return;
  target.classList.add("active");
  bringToFront(target);
}

function closeWindow(win) {
  if (!win) return;
  win.classList.remove("active");
}

folders.forEach((folder) => {
  folder.addEventListener("click", () => openWindow(folder.dataset.window));
});

windows.forEach((win) => {
  const closeButton = win.querySelector(".close");
  const titlebar = win.querySelector(".titlebar");

  closeButton.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeWindow(win);
  });

  win.addEventListener("mousedown", () => {
    bringToFront(win);
  });

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let pointerId = null;

  titlebar.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".close")) return;
    if (event.button !== 0 && event.pointerType !== "touch") return;

    isDragging = true;
    pointerId = event.pointerId;
    bringToFront(win);

    const rect = win.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    titlebar.setPointerCapture(pointerId);
    titlebar.style.cursor = "grabbing";
    win.style.transform = "none";
    win.style.left = `${rect.left}px`;
    win.style.top = `${rect.top}px`;
  });

  titlebar.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const maxLeft = window.innerWidth - win.offsetWidth - 8;
    const maxTop = window.innerHeight - win.offsetHeight - 56;
    const nextLeft = Math.max(8, Math.min(event.clientX - offsetX, maxLeft));
    const nextTop = Math.max(8, Math.min(event.clientY - offsetY, maxTop));
    win.style.left = `${nextLeft}px`;
    win.style.top = `${nextTop}px`;
  });

  const stopDragging = () => {
    isDragging = false;
    titlebar.style.cursor = "grab";
    if (pointerId !== null) {
      try {
        titlebar.releasePointerCapture(pointerId);
      } catch (error) {
        // ignore release errors
      }
      pointerId = null;
    }
  };

  titlebar.addEventListener("pointerup", stopDragging);
  titlebar.addEventListener("pointercancel", stopDragging);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const activeWindows = [...windows].filter((win) => win.classList.contains("active"));
  if (!activeWindows.length) return;
  const topWindow = activeWindows.sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))[0];
  closeWindow(topWindow);
});

function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function runTypingLoop(element, options = {}) {
  if (!element) return;

  const items = JSON.parse(element.dataset.texts || "[]");
  if (!items.length) return;

  const typeSpeed = options.typeSpeed ?? 95;
  const deleteSpeed = options.deleteSpeed ?? 50;
  const holdBeforeDelete = options.holdBeforeDelete ?? 1200;
  const holdBeforeNext = options.holdBeforeNext ?? 300;

  let itemIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const tick = () => {
    const currentText = items[itemIndex];

    if (!isDeleting) {
      charIndex += 1;
      const next = currentText.slice(0, charIndex);
      element.textContent = next;
      element.setAttribute("data-text", next);

      if (charIndex === currentText.length) {
        isDeleting = true;
        setTimeout(tick, holdBeforeDelete);
        return;
      }

      setTimeout(tick, typeSpeed);
      return;
    }

    charIndex -= 1;
    const next = currentText.slice(0, charIndex);
    element.textContent = next;
    element.setAttribute("data-text", next);

    if (charIndex === 0) {
      isDeleting = false;
      itemIndex = (itemIndex + 1) % items.length;
      setTimeout(tick, holdBeforeNext);
      return;
    }

    setTimeout(tick, deleteSpeed);
  };

  element.textContent = "";
  element.setAttribute("data-text", "");
  setTimeout(tick, 500);
}

runTypingLoop(document.getElementById("typed-tagline"), {
  typeSpeed: 70,
  deleteSpeed: 42,
  holdBeforeDelete: 1100,
  holdBeforeNext: 300,
});

updateClock();
setInterval(updateClock, 1000 * 30);
