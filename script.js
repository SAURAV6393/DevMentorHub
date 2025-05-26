let currentTopic = "";
let currentChallengeIndex = 0;
let challenges = [];
let hintIndex = 0;

// Initial trigger
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
  document.getElementById("feedback").textContent = "";
  document.getElementById("next-btn").disabled = true;
  document.getElementById("ai-response").textContent = "";
  hintIndex = 0;

  const progress = JSON.parse(localStorage.getItem("devmentor_progress")) || {};
  if (
    progress[currentTopic] &&
    progress[currentTopic].includes(currentChallengeIndex)
  ) {
    document.getElementById("feedback").textContent = "✅ Already Completed!";
    document.getElementById("feedback").style.color = "green";
    document.getElementById("next-btn").disabled = false;
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
  return html.replace(/\s+/g, "").toLowerCase();
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
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.animationDuration = Math.random() * 1 + 0.5 + "s";
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 2000);
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
  hintIndex = 0; // reset hint counter
}

// Example AI hints and solutions are already in your challenge JSON
// You can simulate AI "thinking" with a small delay for better UX

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

  // Simulate AI processing delay
  responseBox.innerText = "🧠 AI is thinking...";
  setTimeout(() => {
    responseBox.innerText = `🧠 Solution:\n${solution}`;
  }, 800); // 0.8 seconds delay
}

function showProgressOnHome() {
  let progress = JSON.parse(localStorage.getItem("devmentor_progress")) || {};
  const cards = document.querySelectorAll(".topic-card");
  cards.forEach((card) => {
    const topic = card.getAttribute("data-topic");
    const completed = progress[topic]?.length || 0;
    card.innerHTML += `<br><small>✅ ${completed} completed</small>`;
  });
}

async function getSmartAIHint() {
  const code = document.getElementById("code-editor").value;
  const instruction = challenges[currentChallengeIndex].instruction;
  const responseBox = document.getElementById("ai-response");

  responseBox.innerText = "🤖 Thinking...";

  try {
    const res = await fetch("http://localhost:3000/api/ai-hint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, instruction }),
    });

    const data = await res.json();
    responseBox.innerText = "💡 AI Hint: " + data.reply;
  } catch (error) {
    responseBox.innerText = "❌ Failed to get AI response.";
    console.error(error);
  }
}

window.onload = showProgressOnHome;
