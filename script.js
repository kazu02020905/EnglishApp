let questions = [];
let current = null;

// ▼ index.json → 各問題ファイルを読み込む
async function loadQuestions() {
  const listRes = await fetch("questions/index.json");
  const fileList = await listRes.json();

  let loaded = [];

  for (const file of fileList) {
    const res = await fetch("questions/" + file);
    const q = await res.json();
    loaded.push(q);
  }

  questions = loaded;
  loadScores();
  pickQuestion();
}

// ▼ スコア読み込み
function loadScores() {
  const saved = localStorage.getItem("scores");
  if (!saved) return;

  const scoreData = JSON.parse(saved);

  questions.forEach(q => {
    if (scoreData[q.id] !== undefined) {
      q.score = scoreData[q.id];
    }
  });
}

// ▼ スコア保存
function saveScores() {
  const scoreData = {};
  questions.forEach(q => {
    scoreData[q.id] = q.score;
  });
  localStorage.setItem("scores", JSON.stringify(scoreData));
}

// ▼ 重み付きランダム
function pickQuestion() {
  const available = questions.filter(q => q.score < 3);

  let weighted = [];
  available.forEach(q => {
    const weight = Math.max(1, 3 - q.score);
    for (let i = 0; i < weight; i++) weighted.push(q);
  });

  current = weighted[Math.floor(Math.random() * weighted.length)];

  document.getElementById("question-box").innerText = current.question;
  document.getElementById("user-answer").value = "";
  document.getElementById("result").innerText = "";

  document.getElementById("hint-box").innerText = current.hint;
  document.getElementById("note1-box").innerText = current.note1 || "";
  document.getElementById("note2-box").innerText = current.note2 || "";

  document.getElementById("user-answer").focus();
}

// ▼ 判定
document.getElementById("check-btn").addEventListener("click", () => {
  const user = document.getElementById("user-answer").value.trim();
  const correct = current.answer.trim();

  const cleanUser = user.replace(/[!?.,、。]/g, "").toLowerCase();
  const cleanCorrect = correct.replace(/[!?.,、。]/g, "").toLowerCase();

  if (cleanUser === cleanCorrect) {
    document.getElementById("result").innerText = "⭕ Correct!";
    current.score += 1;
  } else {
    document.getElementById("result").innerText =
      "❌ Incorrect\nCorrect Answer: " + correct;
    current.score -= 1;
  }

  saveScores();
});

// ▼ Enterキー
document.getElementById("user-answer").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("check-btn").click();
});

// ▼ 次へ
document.getElementById("next-btn").addEventListener("click", () => pickQuestion());

// ▼ 問題追加フォーム → server.js に送信
document.getElementById("save-btn").addEventListener("click", async () => {
  const data = {
    question: document.getElementById("q-question").value,
    answer: document.getElementById("q-answer").value,
    hint: document.getElementById("q-hint").value,
    note1: document.getElementById("q-note1").value,
    note2: document.getElementById("q-note2").value
  };

  const res = await fetch("/add-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (result.success) {
    document.getElementById("save-result").innerText =
      "保存完了 → " + result.file;

    loadQuestions();
  } else {
    document.getElementById("save-result").innerText =
      "エラー: " + result.error;
  }
});

loadQuestions();
