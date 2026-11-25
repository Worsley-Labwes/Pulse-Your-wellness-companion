const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function createDefaultState() {
  return {
    water: 5,
    steps: 6420,
    mindful: 0,
    mood: null,
    sleep: 7.5,
    habits: [true, true, false, false],
  };
}

function createNewProfileState() {
  return {
    water: 0,
    steps: 0,
    mindful: 0,
    mood: null,
    sleep: 7.5,
    habits: [false, false, false, false],
  };
}

const savedProfiles = JSON.parse(localStorage.getItem("pulse-profiles") || "null");
const validSavedProfiles = Array.isArray(savedProfiles)
  ? savedProfiles.filter((profile) => profile && typeof profile.id === "string" && typeof profile.name === "string" && profile.name.trim())
  : [];
const profiles = validSavedProfiles.length
  ? validSavedProfiles
  : [{
      id: "alex-smith",
      name: "Alex Smith",
      state: JSON.parse(localStorage.getItem("pulse-state") || "null") || createDefaultState(),
    }];
let activeProfileId = localStorage.getItem("pulse-active-profile");
if (!profiles.some((profile) => profile.id === activeProfileId)) activeProfileId = profiles[0].id;

function getActiveProfile() {
  return profiles.find((profile) => profile.id === activeProfileId);
}

let state = { ...createDefaultState(), ...(getActiveProfile().state || {}) };
if (!Array.isArray(state.habits)) state.habits = createDefaultState().habits;

function save() {
  getActiveProfile().state = state;
  localStorage.setItem("pulse-profiles", JSON.stringify(profiles));
  localStorage.setItem("pulse-active-profile", activeProfileId);
  localStorage.removeItem("pulse-state");
}

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function updateGreeting() {
  const firstName = getActiveProfile().name.trim().split(/\s+/)[0];
  if ($("#todayView").classList.contains("active")) {
    $("#viewTitle").textContent = `Good morning, ${firstName}`;
  }
}

function renderProfileControl() {
  const activeProfile = getActiveProfile();
  $("#profileName").textContent = activeProfile.name;
  $(".profile .avatar").textContent = getInitials(activeProfile.name);

  const menu = $("#profileMenu");
  menu.replaceChildren();
  profiles.forEach((profile) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = `profile-option${profile.id === activeProfileId ? " current" : ""}`;
    option.setAttribute("role", "menuitem");

    const avatar = document.createElement("span");
    avatar.className = "profile-option-avatar";
    avatar.textContent = getInitials(profile.name);
    const copy = document.createElement("span");
    copy.className = "profile-option-copy";
    const name = document.createElement("span");
    name.textContent = profile.name;
    const hint = document.createElement("small");
    hint.textContent = profile.id === activeProfileId ? "Current profile" : "Switch profile";
    copy.append(name, hint);
    option.append(avatar, copy);
    option.addEventListener("click", () => switchProfile(profile.id));
    menu.append(option);
  });

  const divider = document.createElement("div");
  divider.className = "profile-menu-divider";
  divider.setAttribute("role", "separator");
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "profile-add";
  addButton.setAttribute("role", "menuitem");
  addButton.textContent = "+ Add another profile";
  addButton.addEventListener("click", openProfileModal);
  const logoutDivider = document.createElement("div");
  logoutDivider.className = "profile-menu-divider";
  logoutDivider.setAttribute("role", "separator");
  const logoutButton = document.createElement("button");
  logoutButton.type = "button";
  logoutButton.className = "profile-logout";
  logoutButton.setAttribute("role", "menuitem");
  logoutButton.textContent = "Log out";
  logoutButton.addEventListener("click", logOut);
  const note = document.createElement("p");
  note.className = "profile-menu-note";
  note.textContent = "Saved in this browser only. Profiles are not password-protected.";
  menu.append(divider, addButton, logoutDivider, logoutButton, note);
}

function closeProfileMenu() {
  $("#profileMenu").hidden = true;
  $("#profileButton").setAttribute("aria-expanded", "false");
}

function switchProfile(profileId) {
  const loggedOut = localStorage.getItem("pulse-logged-out") === "true";
  if (profileId === activeProfileId && !loggedOut) {
    closeProfileMenu();
    return;
  }

  if (!loggedOut) save();
  activeProfileId = profileId;
  const activeState = getActiveProfile().state || createNewProfileState();
  state = { ...createDefaultState(), ...activeState };
  if (!Array.isArray(state.habits)) state.habits = createNewProfileState().habits;
  localStorage.removeItem("pulse-logged-out");
  renderProfileControl();
  buildHabits();
  syncCheckinForm();
  updateGreeting();
  $("#nudgeTitle").textContent = "A two-minute reset";
  $("#nudgeText").textContent = "Step outside and notice five things around you.";
  updateDashboard();
  closeProfileChooser();
  closeProfileMenu();
  $(".sidebar").classList.remove("open");
  showToast(`Active profile: ${getActiveProfile().name}`);
}

function renderProfileChooser() {
  const list = $("#profileChooserList");
  list.replaceChildren();
  profiles.forEach((profile) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "profile-choice";
    const avatar = document.createElement("span");
    avatar.className = "profile-option-avatar";
    avatar.textContent = getInitials(profile.name);
    const name = document.createElement("span");
    name.className = "profile-choice-name";
    name.textContent = profile.name;
    const action = document.createElement("span");
    action.className = "profile-choice-action";
    action.textContent = "Continue";
    option.append(avatar, name, action);
    option.addEventListener("click", () => switchProfile(profile.id));
    list.append(option);
  });
}

function openProfileChooser() {
  renderProfileChooser();
  document.body.classList.add("logged-out");
  $("#profileChooser").classList.add("open");
  $("#profileChooser").setAttribute("aria-hidden", "false");
}

function closeProfileChooser() {
  $("#profileChooser").classList.remove("open");
  $("#profileChooser").setAttribute("aria-hidden", "true");
  if (localStorage.getItem("pulse-logged-out") !== "true") {
    document.body.classList.remove("logged-out");
  }
}

function logOut() {
  save();
  localStorage.setItem("pulse-logged-out", "true");
  window.location.reload();
}

function openProfileModal() {
  closeProfileMenu();
  if (localStorage.getItem("pulse-logged-out") === "true") closeProfileChooser();
  $("#newProfileName").value = "";
  $("#profileModal").classList.add("open");
  $("#profileModal").setAttribute("aria-hidden", "false");
  $("#newProfileName").focus();
}

function closeProfileModal() {
  $("#profileModal").classList.remove("open");
  $("#profileModal").setAttribute("aria-hidden", "true");
  if (localStorage.getItem("pulse-logged-out") === "true") openProfileChooser();
}

function formatDate() {
  const now = new Date();
  $("#todayLabel").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function updateDashboard() {
  updateGreeting();
  $("#waterText").textContent = `${state.water} of 8 glasses`;
  $("#waterProgress").style.width = `${Math.min(state.water / 8 * 100, 100)}%`;
  $("#stepsText").textContent = `${state.steps.toLocaleString()} steps`;
  $("#stepsProgress").style.width = `${Math.min(state.steps / 10000 * 100, 100)}%`;
  $("#mindfulText").textContent = state.mindful ? "5 min complete" : "Not started";
  $("#mindfulProgress").style.width = `${state.mindful ? 100 : 0}%`;

  const totalSleep = state.sleep;
  const hours = Math.floor(totalSleep);
  const minutes = Math.round((totalSleep - hours) * 60);
  $("#sleepValue").textContent = `${hours}h ${String(minutes).padStart(2, "0")}m`;

  const moodBoost = state.mood ? (state.mood - 3) * 2 : 0;
  const score = Math.max(50, Math.min(99, Math.round(78 + state.water / 8 * 5 + moodBoost)));
  $("#wellnessScore").textContent = score;
  $("#signalText").textContent = score >= 85 ? "You are recharging well today" : score >= 70 ? "A steady, balanced day" : "A gentle day may help";

  const habitCount = state.habits.filter(Boolean).length;
  $("#habitCount").textContent = `${habitCount} / 4`;
  $("#planPercent").textContent = `${habitCount * 15 + 20}%`;
  $("#planPercent").parentElement.style.background = `conic-gradient(var(--violet) ${habitCount * 15 + 20}%, #eff0f4 0)`;
  save();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function buildWeek() {
  const values = [52, 68, 61, 82, 74, 91, 67];
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  $("#weekBars").innerHTML = values.map((value, index) =>
    `<i class="${index < 5 ? "on" : ""} ${index === 6 ? "today" : ""}" style="height:${value}% " title="${labels[index]}: ${value}%"></i>`
  ).join("");
}

function buildHabits() {
  const habits = ["Drink 8 glasses of water", "Take a 10-minute walk", "Write down one win", "Wind down before 10 PM"];
  $("#habitList").innerHTML = habits.map((habit, index) =>
    `<div class="habit-item ${state.habits[index] ? "done" : ""}" data-index="${index}">
      <button type="button" aria-label="Toggle ${habit}"></button><span>${habit}</span>
    </div>`
  ).join("");

  $$("#habitList .habit-item button").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".habit-item");
      const index = Number(item.dataset.index);
      state.habits[index] = !state.habits[index];
      item.classList.toggle("done", state.habits[index]);
      updateDashboard();
    });
  });
}

$$(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    $$(".view").forEach((view) => view.classList.remove("active"));
    $(`#${button.dataset.view}View`).classList.add("active");
    const titles = { trends: "Your wellbeing trends", plan: "Your personal plan" };
    $("#viewTitle").textContent = button.dataset.view === "today" ? `Good morning, ${getActiveProfile().name.trim().split(/\s+/)[0]}` : titles[button.dataset.view];
    $(".sidebar").classList.remove("open");
  });
});

$("#profileButton").addEventListener("click", () => {
  const menu = $("#profileMenu");
  menu.hidden = !menu.hidden;
  $("#profileButton").setAttribute("aria-expanded", String(!menu.hidden));
});
document.addEventListener("click", (event) => {
  if (!event.target.closest("#profileButton, #profileMenu")) closeProfileMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProfileMenu();
    closeProfileModal();
  }
});

$("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#newProfileName").value.trim();
  if (!name) {
    $("#newProfileName").setCustomValidity("Please enter a name.");
    $("#newProfileName").reportValidity();
    return;
  }

  const profile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    state: createNewProfileState(),
  };
  profiles.push(profile);
  activeProfileId = profile.id;
  state = { ...profile.state };
  renderProfileControl();
  buildHabits();
  syncCheckinForm();
  localStorage.removeItem("pulse-logged-out");
  updateDashboard();
  closeProfileModal();
  closeProfileChooser();
  $(".sidebar").classList.remove("open");
  showToast(`Profile created: ${name}`);
});
$("#chooserAddProfile").addEventListener("click", openProfileModal);
$("#newProfileName").addEventListener("input", (event) => event.target.setCustomValidity(""));
$("#closeProfileModal").addEventListener("click", closeProfileModal);
$("#profileModal").addEventListener("click", (event) => {
  if (event.target === $("#profileModal")) closeProfileModal();
});

$$(".care-card").forEach((card) => {
  card.addEventListener("click", () => {
    if (card.dataset.care === "water") {
      state.water = Math.min(state.water + 1, 12);
      showToast(state.water >= 8 ? "Daily hydration goal reached" : "One glass added");
    } else if (card.dataset.care === "steps") {
      state.steps += 500;
      showToast("500 steps added");
    } else {
      state.mindful = state.mindful ? 0 : 5;
      showToast(state.mindful ? "Mindful moment complete" : "Mindful moment reset");
    }
    updateDashboard();
  });
});

$("#resetGoals").addEventListener("click", () => {
  state.water = 0;
  state.steps = 0;
  state.mindful = 0;
  updateDashboard();
  showToast("Today's care goals reset");
});

$("#nudgeButton").addEventListener("click", () => {
  $("#nudgeTitle").textContent = "Reset complete";
  $("#nudgeText").textContent = "Nice work — notice how you feel now.";
  showToast("Gentle nudge completed");
});

const modal = $("#checkinModal");
$("#checkinButton").addEventListener("click", () => {
  syncCheckinForm();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
});
$("#closeModal").addEventListener("click", () => {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
});
modal.addEventListener("click", (event) => {
  if (event.target === modal) $("#closeModal").click();
});
function syncCheckinForm() {
  $("#sleepRange").value = state.sleep;
  $("#sleepHours").textContent = `${Number(state.sleep).toFixed(1).replace(".0", "")} hours`;
  $$(".mood-options button").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.mood) === state.mood);
  });
}
$("#sleepRange").addEventListener("input", (event) => {
  $("#sleepHours").textContent = `${Number(event.target.value).toFixed(1).replace(".0", "")} hours`;
});
$$(".mood-options button").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".mood-options button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    state.mood = Number(button.dataset.mood);
  });
});
$("#saveCheckin").addEventListener("click", () => {
  if (!state.mood) state.mood = 3;
  state.sleep = Number($("#sleepRange").value);
  updateDashboard();
  $("#closeModal").click();
  showToast("Check-in saved privately");
});

$("#themeButton").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("pulse-theme", document.body.classList.contains("dark") ? "dark" : "light");
});
if (localStorage.getItem("pulse-theme") === "dark") document.body.classList.add("dark");

$("#mobileMenu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));

function drawTrend() {
  const canvas = $("#trendCanvas");
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--line");
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const y = i * h / 5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  const values = [58,64,61,70,67,76,72,81,78,84,80,88,82,86,79,91];
  const points = values.map((v, i) => [i * w / (values.length - 1), h - (v - 45) / 50 * h]);
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "rgba(116,119,215,.22)");
  gradient.addColorStop(1, "rgba(116,119,215,0)");
  ctx.beginPath();
  ctx.moveTo(points[0][0], h);
  points.forEach((p) => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.strokeStyle = "#7477d7"; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.stroke();
  points.forEach((p, i) => {
    if (i === points.length - 1) {
      ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, Math.PI * 2); ctx.fillStyle = "#7477d7"; ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], 9, 0, Math.PI * 2); ctx.strokeStyle = "rgba(116,119,215,.25)"; ctx.stroke();
    }
  });
}

const trendObserver = new MutationObserver(() => {
  if ($("#trendsView").classList.contains("active")) drawTrend();
});
trendObserver.observe($("#trendsView"), { attributes: true, attributeFilter: ["class"] });
$("#trendRange").addEventListener("change", drawTrend);
window.addEventListener("resize", () => {
  if ($("#trendsView").classList.contains("active")) drawTrend();
});

formatDate();
renderProfileControl();
updateGreeting();
buildWeek();
buildHabits();
updateDashboard();
if (localStorage.getItem("pulse-logged-out") === "true") openProfileChooser();
