const folders = document.querySelectorAll(".folder");
const windows = document.querySelectorAll(".window");
let topZ = 20;

function openWindow(name) {
  const target = document.querySelector(`[data-window-panel="${name}"]`);
  if (!target) return;
  target.classList.add("active");
  target.style.zIndex = String(++topZ);
}

folders.forEach((folder) => {
  folder.addEventListener("click", () => openWindow(folder.dataset.window));
});

windows.forEach((win) => {
  const closeButton = win.querySelector(".close");
  const titlebar = win.querySelector(".titlebar");

  closeButton.addEventListener("click", () => win.classList.remove("active"));

  win.addEventListener("mousedown", () => {
    win.style.zIndex = String(++topZ);
  });

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  titlebar.addEventListener("pointerdown", (event) => {
    isDragging = true;
    const rect = win.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    titlebar.setPointerCapture(event.pointerId);
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

  titlebar.addEventListener("pointerup", (event) => {
    isDragging = false;
    titlebar.releasePointerCapture(event.pointerId);
    titlebar.style.cursor = "grab";
  });
});

function updateClock() {
  const clock = document.getElementById("clock");
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

updateClock();
setInterval(updateClock, 1000 * 30);
