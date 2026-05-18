const socket = io();

// ── theme toggle ──
const themeBtn = document.querySelector("#theme-toggle");

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
  themeBtn.textContent = "☾";
}

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  themeBtn.textContent = isLight ? "☾" : "☀";
  localStorage.setItem("theme", isLight ? "light" : "dark");
});

const alertInput = document.querySelector("#alert-input");
const sendBtn = document.querySelector("#send-alert");
const alertsList = document.querySelector("#alerts-list");
const typeBtns = document.querySelectorAll(".type-btn");
const clock = document.querySelector("#clock");

let selectedType = "CRITICA";

function updateClock() {
  if (clock) clock.textContent = new Date().toLocaleTimeString("it-IT");
}
updateClock();
setInterval(updateClock, 1000);

typeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    typeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type;
  });
});

function escapeHTML(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function typeIcon(type) {
  const icons = {
    CRITICA: "🔴",
    ADVERTENCIA: "🟡",
    INFORMATIVA: "🔵",
    EVACUACION: "🚨",
    GENERAL: "⚪",
  };
  return icons[type] || "⚪";
}

function emitAlert() {
  const message = alertInput.value.trim();
  if (!message) return;
  socket.emit("alert", { message, type: selectedType });
  alertInput.value = "";
  alertInput.focus();
}

sendBtn.addEventListener("click", emitAlert);

alertInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") emitAlert();
});

const overlay      = document.querySelector("#alert-overlay");
const overlayIcon  = document.querySelector("#overlay-icon");
const overlayType  = document.querySelector("#overlay-type");
const overlayUser  = document.querySelector("#overlay-user");
const overlayMsg   = document.querySelector("#overlay-message");

let overlayTimer = null;

function showOverlay(data, onDone) {
  const { user, message, type } = data;

  // limpiar timer anterior si llega otra alerta encima
  if (overlayTimer) {
    clearTimeout(overlayTimer);
    overlay.classList.remove("fading");
    overlay.classList.add("hidden");
  }

  overlayIcon.textContent  = typeIcon(type);
  overlayType.textContent  = type;
  overlayUser.textContent  = `Emisor: ${escapeHTML(user)}`;
  overlayMsg.textContent   = message;

  overlay.className = `alert-overlay overlay-${type}`;

  overlayTimer = setTimeout(() => {
    overlay.classList.add("fading");
    setTimeout(() => {
      overlay.classList.add("hidden");
      overlay.classList.remove("fading");
      overlayTimer = null;
      onDone();
    }, 100);
  }, 400);
}

function appendToList({ user, message, type, date }) {
  const safeMsg  = escapeHTML(message);
  const safeUser = escapeHTML(user);
  const safeType = escapeHTML(type);

  const item = document.createRange().createContextualFragment(`
    <div class="alert-item ${safeType}">
      <div class="alert-icon">${typeIcon(type)}</div>
      <div class="alert-body">
        <div class="alert-meta">
          <span class="alert-type-tag">${safeType}</span>
          <span class="alert-user">${safeUser}</span>
          <span class="alert-time">${date}</span>
        </div>
        <div class="alert-message">${safeMsg}</div>
      </div>
    </div>
  `);

  alertsList.appendChild(item);
  alertsList.scrollTop = alertsList.scrollHeight;
}

socket.on("alert", (data) => {
  showOverlay(data, () => appendToList(data));
});

socket.on("connect", () => console.log("Conectado al servidor ESPE-Alert"));
socket.on("disconnect", () => console.log("Desconectado del servidor"));
