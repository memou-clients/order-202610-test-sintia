const DELUXE_CONFIG = {
  girlfriendName: "My Love",
  nickname: "Love",
  boyfriendName: "Your Person",
  anniversaryDate: "14 February 2026",
  signOffName: "Your Person",
  loveLetter: "Thank you for being part of every little moment. For the quiet days, the loud laughs, the little jokes, and every ordinary second that somehow became a memory. I would choose all of it again.",
  finalMessage: "Thank you for being part of the time I never want to forget. Here’s to everything we have lived, and everything still waiting for us.",
  castDialogues: [
    {title:"First Day",quote:"The beginning did not look like a beginning. It simply felt right."},
    {title:"The Laugh",quote:"Some laughs stay in your head long after the room becomes quiet."},
    {title:"Rain",quote:"Even the ordinary weather became part of our story."},
    {title:"Late Night",quote:"We talked until the clock stopped feeling important."},
    {title:"Home",quote:"Somewhere along the way, being together started to feel like home."},
    {title:"Yesterday",quote:"The past is softer when it has your face in it."},
    {title:"Little Things",quote:"The tiny things were never tiny to me."},
    {title:"Still Here",quote:"Different chapter, same feeling: I am still grateful for you."},
    {title:"Us",quote:"If time keeps moving, I hope we keep making memories worth keeping."}
  ]
};

const PHOTOS = ["cover.jpg", ...Array.from({length:14}, (_, i) => `mem_${i+1}.jpg`)];
const ALTS = ["Main Hero Poster", ...Array.from({length:14}, (_, i) => `Memory Polaroid ${i+1}`)];
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

let selectedIndex = 0;
let orbitAngle = 0;
let orbitFrame = null;
let orbitDragging = false;
let orbitStartX = 0;
let orbitStartAngle = 0;
let gameMode = "catch";
let gameRunning = false;
let gameTimer = null;
let spawnTimer = null;
let score = 0;
let timeLeft = 30;
let matchFirst = null;
let matchBusy = false;

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function initConfig() {
  setText("recipientDisplay", DELUXE_CONFIG.girlfriendName);
  setText("dateDisplay", DELUXE_CONFIG.anniversaryDate);
  setText("letterRecipient", DELUXE_CONFIG.girlfriendName);
  setText("senderDisplay", DELUXE_CONFIG.signOffName);
  setText("finalRecipient", DELUXE_CONFIG.girlfriendName);
  setText("finalSender", DELUXE_CONFIG.signOffName);
  setText("finalText", DELUXE_CONFIG.finalMessage);
  setText("letterText", DELUXE_CONFIG.loveLetter);
}

function initEntrance() {
  const entrance = $("#entranceModal");
  const app = $("#mainApp");
  const button = $("#enterSiteBtn");
  const bgm = $("#bgm");

  button.addEventListener("click", async () => {
    app.setAttribute("aria-hidden", "false");
    document.body.classList.remove("is-locked");
    entrance.classList.add("is-leaving");
    try {
      await bgm.play();
      setMusicState(true);
    } catch {
      setMusicState(false);
    }
    window.setTimeout(() => entrance.remove(), 750);
  });
}

function setMusicState(isPlaying) {
  const button = $("#musicToggle");
  const label = $("#musicLabel");
  button.classList.toggle("is-playing", isPlaying);
  button.setAttribute("aria-pressed", String(isPlaying));
  label.textContent = isPlaying ? "MUSIC ON" : "MUSIC OFF";
}

function initMusic() {
  const bgm = $("#bgm");
  const button = $("#musicToggle");
  button.addEventListener("click", async () => {
    if (bgm.paused) {
      try { await bgm.play(); } catch {}
    } else {
      bgm.pause();
    }
  });
  bgm.addEventListener("play", () => setMusicState(true));
  bgm.addEventListener("pause", () => setMusicState(false));
}

function buildOrbit() {
  const track = $("#orbitTrack");
  track.innerHTML = "";
  PHOTOS.forEach((file, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "orbit-card";
    card.dataset.index = index;
    card.setAttribute("aria-label", `Open ${ALTS[index]}`);
    card.innerHTML = `<img src="assets/images/${file}" alt="${ALTS[index]}"><span>${String(index + 1).padStart(2,"0")}</span>`;
    card.addEventListener("click", () => {
      selectedIndex = index;
      orbitAngle = -(selectedIndex * (360 / PHOTOS.length));
      renderOrbit();
      openMemory(selectedIndex % DELUXE_CONFIG.castDialogues.length);
    });
    track.appendChild(card);
  });
  renderOrbit();
  startOrbitLoop();

  const stage = $("#orbitStage");
  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    orbitDragging = true;
    orbitStartX = event.clientX;
    orbitStartAngle = orbitAngle;
    stage.setPointerCapture?.(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!orbitDragging) return;
    orbitAngle = orbitStartAngle + (event.clientX - orbitStartX) * 0.32;
    renderOrbit();
  });
  const endDrag = () => { orbitDragging = false; };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
}

function startOrbitLoop() {
  cancelAnimationFrame(orbitFrame);
  let last = performance.now();
  const tick = (now) => {
    const delta = Math.min(now - last, 50);
    last = now;
    if (!orbitDragging && !document.hidden) {
      orbitAngle += delta * 0.025;
      renderOrbit();
    }
    orbitFrame = requestAnimationFrame(tick);
  };
  orbitFrame = requestAnimationFrame(tick);
}

function renderOrbit() {
  const cards = $$(".orbit-card");
  const total = cards.length;
  const mobile = window.innerWidth <= 600;
  const tablet = window.innerWidth <= 900;
  const rx = mobile ? Math.min(window.innerWidth * 0.40, 180) : tablet ? 285 : 380;
  const ry = mobile ? 64 : tablet ? 82 : 108;
  const cardWidth = mobile ? 92 : tablet ? 116 : 148;

  cards.forEach((card, index) => {
    const base = (index / total) * Math.PI * 2;
    const angle = base + orbitAngle * Math.PI / 180;
    const x = Math.sin(angle) * rx;
    const y = Math.cos(angle) * ry;
    const depth = (Math.cos(angle) + 1) / 2;
    const scale = 0.62 + depth * 0.38;
    const z = Math.round(depth * 100);
    const opacity = 0.18 + depth * 0.82;
    card.style.width = `${cardWidth}px`;
    // IMPORTANT: the cards themselves never tilt. Only their positions orbit.
    card.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) scale(${scale})`;
    card.style.opacity = opacity.toFixed(2);
    card.style.zIndex = 10 + z;
    card.classList.toggle("is-selected", index === selectedIndex);
  });
  setText("orbitCounter", `${String(selectedIndex + 1).padStart(2,"0")} / 15`);
  setText("selectedNumber", String(selectedIndex + 1).padStart(2,"0"));
  setText("selectedLabel", (DELUXE_CONFIG.castDialogues[selectedIndex % 9]?.title || "MEMORY").toUpperCase());
}

function initSelectedOpen() {
  $("#selectedOpen").addEventListener("click", () => openMemory(selectedIndex % 9));
}

function buildMemories() {
  const grid = $("#memoryGrid");
  grid.innerHTML = "";
  DELUXE_CONFIG.castDialogues.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "memory-card";
    card.innerHTML = `<span class="memory-number">${String(index + 1).padStart(2,"0")}</span><img src="assets/images/mem_${index + 1}.jpg" alt="Memory Polaroid ${index + 1}"><span class="memory-title">${item.title}</span>`;
    card.addEventListener("click", () => openMemory(index));
    grid.appendChild(card);
  });
}

function openMemory(index) {
  const safe = ((index % 9) + 9) % 9;
  const item = DELUXE_CONFIG.castDialogues[safe];
  setText("detailNumber", String(safe + 1).padStart(2,"0"));
  setText("detailTitle", item.title);
  setText("detailQuote", item.quote);
  const image = $("#detailImage");
  image.src = `assets/images/mem_${safe + 1}.jpg`;
  image.alt = `Memory Polaroid ${safe + 1}`;
  const modal = $("#memoryDetail");
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeMemory() {
  const modal = $("#memoryDetail");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function initEnvelope() {
  const envelope = $("#envelopeTrigger");
  const modal = $("#letterModal");
  let opening = false;

  envelope.addEventListener("click", () => {
    if (opening) return;
    opening = true;
    envelope.classList.add("is-opening");
    window.setTimeout(() => {
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
    }, 950);
  });

  const close = () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      envelope.classList.remove("is-opening");
      opening = false;
    }, 250);
  };

  $("#closeLetter").addEventListener("click", close);
  $$('[data-close-letter]').forEach((el) => el.addEventListener("click", close));
}

function updateGameIntro() {
  const isCatch = gameMode === "catch";
  setText("gameName", isCatch ? "CATCH THE MEMORIES" : "MATCH THE MEMORIES");
  setText("gameStartTitle", isCatch ? "Catch as many memories as you can." : "Match all four pairs before time runs out.");
  setText("gameStartDesc", isCatch ? "Tap the floating photographs before the timer runs out." : "Flip two cards at a time. Find all 4 pairs.");
}

function clearGameTimers() {
  clearInterval(gameTimer);
  clearInterval(spawnTimer);
  gameTimer = null;
  spawnTimer = null;
}

function resetGameBoard() {
  clearGameTimers();
  $("#catchLayer").innerHTML = "";
  $("#matchLayer").innerHTML = "";
  score = 0;
  timeLeft = 30;
  matchFirst = null;
  matchBusy = false;
  setText("gameScore", "0");
  setText("gameTime", "30");
}

function showGameStart() {
  const start = $("#gameStart");
  const end = $("#gameEnd");
  start.classList.remove("hidden");
  start.setAttribute("aria-hidden", "false");
  end.classList.add("hidden");
  end.setAttribute("aria-hidden", "true");
}

function showGameEnd() {
  const start = $("#gameStart");
  const end = $("#gameEnd");
  start.classList.add("hidden");
  start.setAttribute("aria-hidden", "true");
  end.classList.remove("hidden");
  end.setAttribute("aria-hidden", "false");
}

function startGame() {
  resetGameBoard();
  gameRunning = true;
  showGameEndHidden();
  $("#gameStart").classList.add("hidden");
  $("#gameStart").setAttribute("aria-hidden", "true");
  if (gameMode === "catch") startCatchGame();
  else startMatchGame();
  gameTimer = setInterval(() => {
    if (!gameRunning) return;
    timeLeft -= 1;
    setText("gameTime", String(timeLeft));
    if (timeLeft <= 0) finishGame();
  }, 1000);
}

function showGameEndHidden() {
  const end = $("#gameEnd");
  end.classList.add("hidden");
  end.setAttribute("aria-hidden", "true");
}

function finishGame() {
  if (!gameRunning) return;
  gameRunning = false;
  clearGameTimers();
  $("#catchLayer").innerHTML = "";
  $("#matchLayer").innerHTML = "";
  setText("finalScore", String(score));
  setText("gameEndText", gameMode === "catch" ? "The memories were quick, but you caught a few." : "Every pair had a story of its own.");
  showGameEnd();
}

function startCatchGame() {
  const layer = $("#catchLayer");
  const spawn = () => {
    if (!gameRunning) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "catch-card";
    const index = Math.floor(Math.random() * 14) + 1;
    button.innerHTML = `<img src="assets/images/mem_${index}.jpg" alt="Memory ${index}">`;
    button.style.left = `${5 + Math.random() * 82}%`;
    button.style.top = `${8 + Math.random() * 74}%`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!gameRunning) return;
      score += 1;
      setText("gameScore", String(score));
      button.remove();
    });
    layer.appendChild(button);
    window.setTimeout(() => button.remove(), 1900);
  };
  for (let i = 0; i < 5; i += 1) spawn();
  spawnTimer = setInterval(spawn, 500);
}

function startMatchGame() {
  const layer = $("#matchLayer");
  const ids = [1, 2, 3, 4]; // exactly 8 cards = 4 pairs
  const deck = [...ids, ...ids].sort(() => Math.random() - 0.5);
  deck.forEach((id, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "match-card";
    card.dataset.id = String(id);
    card.innerHTML = `<span class="match-back">${String(index + 1).padStart(2,"0")}</span><img src="assets/images/mem_${id}.jpg" alt="Memory ${id}">`;
    card.addEventListener("click", () => flipMatch(card));
    layer.appendChild(card);
  });
}

function flipMatch(card) {
  if (!gameRunning || matchBusy || card.classList.contains("flipped") || card.classList.contains("matched")) return;
  card.classList.add("flipped");
  if (!matchFirst) {
    matchFirst = card;
    return;
  }
  const first = matchFirst;
  const second = card;
  matchBusy = true;
  if (first.dataset.id === second.dataset.id) {
    first.classList.add("matched");
    second.classList.add("matched");
    score += 1;
    setText("gameScore", String(score));
    matchFirst = null;
    matchBusy = false;
    if (score === 4) window.setTimeout(finishGame, 400);
  } else {
    window.setTimeout(() => {
      first.classList.remove("flipped");
      second.classList.remove("flipped");
      matchFirst = null;
      matchBusy = false;
    }, 650);
  }
}

function initGames() {
  $$(".game-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      gameMode = tab.dataset.mode;
      $$(".game-tab").forEach((item) => item.classList.toggle("active", item === tab));
      gameRunning = false;
      resetGameBoard();
      showGameStart();
      updateGameIntro();
    });
  });
  $("#startGame").addEventListener("click", startGame);
  $("#restartGame").addEventListener("click", startGame);
  updateGameIntro();
}

function initModals() {
  $("#closeMemory").addEventListener("click", closeMemory);
  $("#closeMemoryBtn").addEventListener("click", closeMemory);
  $$('[data-close-memory]').forEach((el) => el.addEventListener("click", closeMemory));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeMemory();
    $("#letterModal").classList.remove("show");
    $("#letterModal").setAttribute("aria-hidden", "true");
  });
}

window.addEventListener("resize", renderOrbit);

document.addEventListener("DOMContentLoaded", () => {
  initConfig();
  initEntrance();
  initMusic();
  buildOrbit();
  initSelectedOpen();
  buildMemories();
  initEnvelope();
  initGames();
  initModals();
});
