//Setting up server
const express = require("express");
const parser = require("body-parser")
const path = require("path");
const {v4: uuidv4} = require('uuid')
const app = express();
const PORT = process.env.PORT || 3000;

const games = {}

app.use(express.static(path.join(__dirname, "/")));
app.use(parser.json())

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

//Setting up gameid
//Note: Gameid was set up for a potential crossplatform multiplayer expansion
//Currently, multiplayer operates on a local client-side level.
//This code remains as a shell for potential future expansion.
app.get("/api/createGame", (req, res) => {
  let difficulty = req.query.difficulty || 'medium'
  let gameid = uuidv4()

  games[gameid] = {difficulty: difficulty, createdAt: Date.now()}

  res.json({gameid: gameid})
});

//to obtain different game info through gameid
app.get("/api/gameInfo", (req, res) => {
  let gameid = req.query.gameid

  res.json({difficulty: games[gameid].difficulty})
});

app.get("/api/ping", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

//To provide link in server once everything is set up
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);})