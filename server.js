const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(".")); // index.html や script.js を配信
app.use("/questions", express.static(path.join(__dirname, "questions"))); // ← これが必要！

const QUESTIONS_DIR = path.join(__dirname, "questions");
const INDEX_FILE = path.join(QUESTIONS_DIR, "index.json");

function getNextNumber() {
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  const nums = index.map(name => parseInt(name.replace(".json", "")));
  const max = Math.max(...nums);
  return String(max + 1).padStart(3, "0");
}

app.post("/add-question", (req, res) => {
  const { question, answer, hint, note1, note2 } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "question と answer は必須です" });
  }

  const nextNum = getNextNumber();
  const filename = `${nextNum}.json`;
  const filepath = path.join(QUESTIONS_DIR, filename);

  const newData = {
    id: parseInt(nextNum),
    question,
    answer,
    hint,
    note1,
    note2,
    score: 0
  };

  fs.writeFileSync(filepath, JSON.stringify(newData, null, 2));

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  index.push(filename);
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));

  res.json({ success: true, file: filename });
});

app.listen(3000, () => {
  console.log("Server running → http://localhost:3000");
});
