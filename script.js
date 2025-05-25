// script.js
function startLesson(topic) {
  // For now, just redirect or load a new page (in future we'll make dynamic loader)
  alert("You selected: " + topic);
  // Later we will load lessons dynamically here
}

let currentTopic = "";
let currentChallengeIndex = 0;
let challenges = [];

function startLesson(topic) {
  currentTopic = topic;
  currentChallengeIndex = 0;
  loadChallenges();
}

function loadChallenges() {
  fetch(`challenges/${currentTopic}.json`)
    .then((res) => res.json())
    .then((data) => {
      challenges = data;
      showChallenge();
    });
}

function showChallenge() {
  document.querySelector(".topics").style.display = "none";
  document.getElementById("lesson-area").style.display = "block";

  const challenge = challenges[currentChallengeIndex];
  document.getElementById("challenge-title").textContent = challenge.title;
  document.getElementById("challenge-instruction").textContent =
    challenge.instruction;
  document.getElementById("code-editor").value = "";
  document.getElementById("output-frame").srcdoc = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("next-btn").disabled = true;

  // Load progress
  let progress = JSON.parse(localStorage.getItem("devmentor_progress")) || {};
  if (
    progress[currentTopic] &&
    progress[currentTopic].includes(currentChallengeIndex)
  ) {
    document.getElementById("feedback").textContent = "✅ Already Completed!";
    document.getElementById("feedback").style.color = "green";
    document.getElementById("next-btn").disabled = false;
  }

  function showProgressOnHome() {
    let progress = JSON.parse(localStorage.getItem("devmentor_progress")) || {};
    const cards = document.querySelectorAll(".topic-card");
    cards.forEach((card) => {
      const topic = card.textContent.toLowerCase().split(" ")[1];
      const completed = progress[topic]?.length || 0;
      card.innerHTML += `<br><small>✅ ${completed} completed</small>`;
    });
  }

  window.onload = showProgressOnHome;
}

function runCode() {
  const userCode = document.getElementById("code-editor").value.trim();
  const correctCode = challenges[currentChallengeIndex].solution.trim();
  const feedbackEl = document.getElementById("feedback");
  const nextBtn = document.getElementById("next-btn");

  document.getElementById("output-frame").srcdoc = userCode;

  // Basic validation (can be improved later)
  if (normalizeHTML(userCode) === normalizeHTML(correctCode)) {
    feedbackEl.textContent = "✅ Correct!";
    feedbackEl.style.color = "green";
    nextBtn.disabled = false;

    // ✅ Play success sound
    const sound = document.getElementById("success-sound");
    sound.currentTime = 0; // rewind to start
    sound.play();

    // ✅ Save progress
    saveProgress(currentTopic, currentChallengeIndex);

    // Launch confetti on success
    launchConfetti();
  } else {
    feedbackEl.textContent = "❌ Try Again.";
    feedbackEl.style.color = "red";
    nextBtn.disabled = true;
  }
}

// Normalization to avoid minor format issues
function normalizeHTML(html) {
  return html.replace(/\s+/g, "").toLowerCase();
}

function nextChallenge() {
  currentChallengeIndex++;
  const nextBtn = document.getElementById("next-btn");
  const feedbackEl = document.getElementById("feedback");

  if (currentChallengeIndex < challenges.length) {
    showChallenge();
    nextBtn.disabled = true;
    feedbackEl.textContent = "";
  } else {
    document.getElementById("lesson-area").innerHTML = `
            <h2>🎉 Congratulations!</h2>
            <p>You have completed all challenges in ${currentTopic.toUpperCase()}!</p>
            <button onclick="location.reload()">Go Back to Topics</button>
        `;
  }

  function saveProgress(topic, index) {
    let progress = JSON.parse(localStorage.getItem("devmentor_progress")) || {};
    if (!progress[topic]) progress[topic] = [];
    if (!progress[topic].includes(index)) {
      progress[topic].push(index);
    }
    localStorage.setItem("devmentor_progress", JSON.stringify(progress));
  }
}

function launchConfetti() {
  const duration = 1 * 1000;
  const end = Date.now() + duration;

  const colors = ["#bb0000", "#ffffff", "#00bb00", "#0000bb"];

  (function frame() {
    // Create 20 confetti pieces
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.animationDuration = Math.random() * 1 + 0.5 + "s";
      document.body.appendChild(confetti);

      setTimeout(() => {
        confetti.remove();
      }, 2000);
    }

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function resetProgress() {
  if (confirm("Are you sure you want to reset your progress?")) {
    localStorage.removeItem("devmentor_progress");
    location.reload();
  }
}
