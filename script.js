const folders = document.querySelectorAll(".folder");
const windows = document.querySelectorAll(".cyber-window");
const screenShade = document.getElementById("screenShade");
const clock = document.getElementById("clock");

let topZ = 40;
let activeWindow = null;

/**
 * Make sure no folder/window is open when the site first loads.
 */
window.addEventListener("DOMContentLoaded", () => {
  windows.forEach((win) => {
    win.classList.remove("is-open");
    win.style.zIndex = "";
    win.style.left = "50%";
    win.style.top = "50%";
    win.style.transform = "translate(-50%, -50%)";
  });

  document.body.classList.remove("window-open");
  activeWindow = null;
  updateClock();
});

/**
 * Open folder window.
 */
folders.forEach((folder) => {
  folder.addEventListener("click", () => {
    const targetId = folder.dataset.window;
    const targetWindow = document.getElementById(targetId);

    if (!targetWindow) return;

    openWindow(targetWindow);
  });
});

/**
 * Close buttons.
 */
windows.forEach((win) => {
  const closeButton = win.querySelector(".window-close");
  const softCloseButton = win.querySelector(".soft-close");

  closeButton.addEventListener("click", () => closeWindow(win));

  if (softCloseButton) {
    softCloseButton.addEventListener("click", () => closeWindow(win));
  }

  win.addEventListener("pointerdown", () => {
    bringToFront(win);
  });
});

/**
 * Click outside the active window to close it.
 */
screenShade.addEventListener("click", () => {
  closeTopWindow();
});

/**
 * Press Esc to close the latest opened window.
 */
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTopWindow();
  }
});

function openWindow(win) {
  win.classList.add("is-open");
  bringToFront(win);
  document.body.classList.add("window-open");

  activeWindow = win;

  const closeButton = win.querySelector(".window-close");
  if (closeButton) {
    closeButton.focus({ preventScroll: true });
  }
}

function closeWindow(win) {
  win.classList.remove("is-open");

  const openWindows = [...windows].filter((item) =>
    item.classList.contains("is-open")
  );

  if (openWindows.length === 0) {
    document.body.classList.remove("window-open");
    activeWindow = null;
    return;
  }

  activeWindow = openWindows.sort((a, b) => {
    return Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0);
  })[0];
}

function closeTopWindow() {
  if (activeWindow && activeWindow.classList.contains("is-open")) {
    closeWindow(activeWindow);
    return;
  }

  const openWindows = [...windows].filter((win) =>
    win.classList.contains("is-open")
  );

  if (openWindows.length > 0) {
    const topWindow = openWindows.sort((a, b) => {
      return Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0);
    })[0];

    closeWindow(topWindow);
  }
}

function bringToFront(win) {
  topZ += 1;
  win.style.zIndex = topZ;
  activeWindow = win;
}

/**
 * Draggable desktop windows.
 */
windows.forEach((win) => {
  const bar = win.querySelector(".window-bar");

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  bar.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;

    isDragging = true;
    bringToFront(win);

    const rect = win.getBoundingClientRect();

    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    win.style.left = `${startLeft}px`;
    win.style.top = `${startTop}px`;
    win.style.transform = "none";

    bar.setPointerCapture(event.pointerId);
  });

  bar.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    const newLeft = startLeft + dx;
    const newTop = startTop + dy;

    const maxLeft = window.innerWidth - win.offsetWidth - 8;
    const maxTop = window.innerHeight - win.offsetHeight - 48;

    win.style.left = `${clamp(newLeft, 8, Math.max(8, maxLeft))}px`;
    win.style.top = `${clamp(newTop, 8, Math.max(8, maxTop))}px`;
  });

  bar.addEventListener("pointerup", (event) => {
    isDragging = false;
    bar.releasePointerCapture(event.pointerId);
  });

  bar.addEventListener("pointercancel", () => {
    isDragging = false;
  });
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Bottom status clock.
 */
function updateClock() {
  if (!clock) return;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  clock.textContent = `${hours}:${minutes}`;
}

setInterval(updateClock, 1000);
