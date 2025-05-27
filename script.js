let currentTopic = "";
let currentChallengeIndex = 0;
let challenges = [];
let hintIndex = 0;

function startLesson(topic) {
  currentTopic = topic;
  currentChallengeIndex = 0;
  hintIndex = 0;
  loadChallenges();
}

function loadChallenges() {
  fetch(`challenges/${currentTopic}.json`)
    .then((res) => res.json())
    .then((data) => {
      challenges = data;
      showChallenge();
    })
    .catch((err) => {
      console.error("Failed to load challenges:", err);
    });
}

function showChallenge() {
  document.querySelector(".topics").style.display = "none";
  document.getElementById("lesson-area").style.display = "block";

  const progressPercent =
    ((currentChallengeIndex + 1) / challenges.length) * 100;
  document.getElementById("progress-bar").style.width = `${progressPercent}%`;

  const challenge = challenges[currentChallengeIndex];
  document.getElementById("challenge-title").textContent = challenge.title;
  document.getElementById("challenge-instruction").textContent =
    challenge.instruction;
  document.getElementById("code-editor").value = "";
  document.getElementById("output-frame").srcdoc = "";
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");
  const aiBox = document.getElementById("ai-response");

  feedbackEl.textContent = "";
  feedbackEl.style.color = "";
  nextBtn.disabled = true;
  aiBox.innerText = "";
  hintIndex = 0;

  const progress = JSON.parse(localStorage.getItem("devmentor_progress")) || {};
  if (progress[currentTopic]?.includes(currentChallengeIndex)) {
    feedbackEl.textContent = "✅ Already Completed!";
    feedbackEl.style.color = "green";
    nextBtn.disabled = false;
  }
}

function runCode() {
  const userCode = document.getElementById("code-editor").value.trim();
  const correctCode = challenges[currentChallengeIndex].solution.trim();
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");
  document.getElementById("output-frame").srcdoc = userCode;

  if (normalizeHTML(userCode) === normalizeHTML(correctCode)) {
    feedbackEl.textContent = "✅ Correct!";
    feedbackEl.style.color = "green";
    nextBtn.disabled = false;
    document.getElementById("success-sound").currentTime = 0;
    document.getElementById("success-sound").play();
    saveProgress(currentTopic, currentChallengeIndex);
    launchConfetti();
  } else {
    feedbackEl.textContent = "❌ Try Again.";
    feedbackEl.style.color = "red";
    nextBtn.disabled = true;
  }
}

function normalizeHTML(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent.replace(/\s+/g, "").toLowerCase();
}

function nextChallenge() {
  currentChallengeIndex++;
  hintIndex = 0;

  if (currentChallengeIndex < challenges.length) {
    showChallenge();
  } else {
    document.getElementById("lesson-area").innerHTML = `
      <h2>🎉 Congratulations!</h2>
      <p>You have completed all challenges in ${currentTopic.toUpperCase()}!</p>
      <button onclick="location.reload()">Go Back to Topics</button>
    `;
  }
}

function saveProgress(topic, index) {
  let progress = JSON.parse(localStorage.getItem("devmentor_progress")) || {};
  if (!progress[topic]) progress[topic] = [];
  if (!progress[topic].includes(index)) {
    progress[topic].push(index);
  }
  localStorage.setItem("devmentor_progress", JSON.stringify(progress));
}

function launchConfetti() {
  const duration = 1000;
  const end = Date.now() + duration;
  const colors = ["#bb0000", "#ffffff", "#00bb00", "#0000bb"];

  (function frame() {
    for (let i = 0; i < 10; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.animationDuration = Math.random() + 0.5 + "s";
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 1500);
    }
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function resetProgress() {
  if (confirm("Are you sure you want to reset your progress?")) {
    localStorage.removeItem("devmentor_progress");
    location.reload();
  }
}

function clearAIResponse() {
  document.getElementById("ai-response").innerText = "";
  hintIndex = 0;
}

function getAIHint() {
  const challenge = challenges[currentChallengeIndex];
  const hints = challenge.hint;
  const responseBox = document.getElementById("ai-response");

  if (!hints) {
    responseBox.innerText = "💡 No hints available.";
    return;
  }

  if (!Array.isArray(hints)) {
    responseBox.innerText = `💡 Hint: ${hints}`;
    return;
  }

  if (hintIndex < hints.length) {
    responseBox.innerText += `💡 Hint ${hintIndex + 1}: ${hints[hintIndex]}\n`;
    hintIndex++;
  } else {
    responseBox.innerText += "✅ All hints revealed.\n";
  }
}

function getAISolution() {
  const challenge = challenges[currentChallengeIndex];
  const solution = challenge.solution || "No solution available.";
  const responseBox = document.getElementById("ai-response");
  responseBox.innerText = "🧠 AI is thinking...";
  setTimeout(() => {
    responseBox.innerText = `🧠 Solution:\n${solution}`;
  }, 800);
}

function getSmartAIHint() {
  const code = document.getElementById("code-editor").value;
  const instruction = challenges[currentChallengeIndex].instruction;
  const responseBox = document.getElementById("ai-response");
  responseBox.innerText = "🤖 Thinking...";

  fetch("http://localhost:3000/api/ai-hint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, instruction }),
  })
    .then((res) => res.json())
    .then((data) => {
      responseBox.innerText = "💡 AI Hint: " + data.reply;
    })
    .catch((error) => {
      responseBox.innerHTML =
        "❌ Failed to get AI response. <button onclick='getSmartAIHint()'>Retry</button>";
      console.error(error);
    });
}

function goBack() {
  document.getElementById("lesson-area").style.display = "none";
  document.querySelector(".topics").style.display = "flex";
  clearAIResponse();
  currentChallengeIndex = 0;
  hintIndex = 0;
}

function showProgressOnHome() {
  const progress = JSON.parse(localStorage.getItem("devmentor_progress")) || {};
  document.querySelectorAll(".topic-card").forEach((card) => {
    const topic = card.getAttribute("data-topic");
    if (!topic) return;
    const completed = progress[topic]?.length || 0;
    card.innerHTML += `<br><small>✅ ${completed} completed</small>`;
  });
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark-mode") ? "dark" : "light"
  );
}

fetch("dailyChallenges.json")
  .then((res) => res.json())
  .then((data) => {
    const htmlChallenges = data.filter((q) => q.category === "HTML");
    const today = new Date();
    const index = today.getDate() % htmlChallenges.length;
    const challenge = htmlChallenges[index];
    document.getElementById("challenge-title").innerText = challenge.title;
    document.getElementById("challenge-desc").innerText = challenge.description;
    document.getElementById(
      "challenge-difficulty"
    ).innerText = `Difficulty: ${challenge.difficulty}`;
  })
  .catch((err) => console.error("Error loading daily challenge:", err));

window.onload = showProgressOnHome;
