// index.js - TitanGuard Dashboard REALTIME
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// CONFIG
const config = {
  token: process.env.BOT_TOKEN,
  guildID: "GUİLD İD ",
  jailRole: "JAİL ROLE",
};
const client = new Client({ intents: Object.values(GatewayIntentBits) });

// UTILS
const limits = new Map();
const whitelist = new Set();
let antiNukeLogs = [];
const guardStatus = { channelGuard:true, roleGuard:true, botGuard:true, antiNuke:true };
function logGuard(msg){ antiNukeLogs.unshift({time:new Date().toLocaleTimeString(),msg}); if(antiNukeLogs.length>20) antiNukeLogs.pop(); }

// EXPRESS + SOCKET.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const DASHBOARD_PORT = 4000;

app.get("/", (req,res)=>{
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>TitanGuard Dashboard</title>
<style>
*{box-sizing:border-box;}
body{margin:0;padding:0;font-family:sans-serif;overflow-x:hidden;background:#111;color:#fff;display:flex;flex-direction:column;align-items:center;min-height:100vh;}
body::before{content:"";position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(270deg,#ff0047,#2c34c7,#00ff9c,#ff0047);background-size:800% 800%;z-index:-1;animation: gradientAnim 20s ease infinite;}
@keyframes gradientAnim{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
h1{margin:40px 0 20px;font-size:3rem;text-shadow:2px 2px 10px rgba(0,0,0,0.8);}
.status-box{background:rgba(0,0,0,0.6);padding:25px 40px;border-radius:15px;box-shadow:0 8px 30px rgba(0,0,0,0.7);margin-bottom:30px;min-width:320px;}
.status-box h2{margin-top:0;text-shadow:1px 1px 6px rgba(0,0,0,0.7);}
.status-box p{font-size:1.3rem;margin:10px 0;}
.buttons{display:flex;flex-wrap:wrap;justify-content:center;gap:15px;margin-bottom:40px;}
button{min-width:130px;padding:15px 25px;border:none;border-radius:12px;cursor:pointer;font-weight:600;font-size:1rem;color:#fff;user-select:none;background:linear-gradient(135deg,#28a745,#1e7e34);box-shadow:0 6px 20px rgba(0,0,0,0.4);transition:all 0.3s ease, transform 0.2s ease;perspective:1000px;}
button.red{background:linear-gradient(135deg,#dc3545,#a71d2a);}
button.blue{background:linear-gradient(135deg,#007bff,#0056b3);}
button:hover{transform:rotateX(15deg) rotateY(5deg) scale(1.1);filter: brightness(1.2);box-shadow:0 12px 25px rgba(0,0,0,0.6);}
ul{background:rgba(0,0,0,0.4);padding:20px 30px;border-radius:15px;box-shadow:0 4px 20px rgba(0,0,0,0.6);max-width:720px;width:90vw;max-height:300px;overflow-y:auto;list-style-type:none;}
ul li{padding:8px 12px;margin-bottom:6px;border-left:4px solid #28a745;background:rgba(255,255,255,0.1);box-shadow:inset 0 0 4px rgba(0,0,0,0.4);font-size:1rem;}
ul li:last-child{margin-bottom:0;}
</style>
</head>
<body>
<h1>🛡 TitanGuard Dashboard</h1>
<div class="status-box">
<h2>Guard Durumları</h2>
<p id="channelGuard">Channel Guard: ✅</p>
<p id="roleGuard">Role Guard: ✅</p>
<p id="botGuard">Bot Guard: ✅</p>
<p id="antiNuke">Anti-Nuke: ✅</p>
</div>
<div class="buttons">
<button onclick="guardOn()">Guard Aç</button>
<button class="red" onclick="guardOff()">Guard Kapat</button>
<button class="blue" onclick="backup()">Backup Al</button>
<button onclick="whitelist()">Whitelist</button>
<button class="red" onclick="jail()">Jail/Unjail</button>
<button class="blue" onclick="limit()">Limit Ayarla</button>
</div>
<h2>📝 Son Loglar</h2>
<ul id="logs"></ul>
<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
socket.on("update",(data)=>{
  document.getElementById("channelGuard").textContent="Channel Guard: "+(data.guard.channelGuard?"✅":"❌");
  document.getElementById("roleGuard").textContent="Role Guard: "+(data.guard.roleGuard?"✅":"❌");
  document.getElementById("botGuard").textContent="Bot Guard: "+(data.guard.botGuard?"✅":"❌");
  document.getElementById("antiNuke").textContent="Anti-Nuke: "+(data.guard.antiNuke?"✅":"❌");
  const logs=document.getElementById("logs");
  logs.innerHTML=data.logs.map(l=>\`<li>[\${l.time}] \${l.msg}</li>\`).join("");
});
function guardOn(){fetch("/api/guard/on");}
function guardOff(){fetch("/api/guard/off");}
function backup(){fetch("/api/backup");}
function whitelist(){ const action=prompt("Whitelist: ekle/sil"); const user=prompt("Kullanıcı ID"); fetch(\`/api/whitelist/\${action}/\${user}\`);}
function jail(){ const action=prompt("Jail: jail/unjail"); const user=prompt("Kullanıcı ID"); fetch(\`/api/jail/\${action}/\${user}\`);}
function limit(){ const type=prompt("Limit tip: channel/role/ban/bot"); const val=prompt("Değer"); fetch(\`/api/limit/\${type}/\${val}\`);}
</script>
</body>
</html>`);
});

// API
app.get("/api/guard/on",(req,res)=>{Object.keys(guardStatus).forEach(k=>guardStatus[k]=true); logGuard("Guard açıldı"); io.emit("update",{guard:guardStatus,logs:antiNukeLogs}); res.sendStatus(200);});
app.get("/api/guard/off",(req,res)=>{Object.keys(guardStatus).forEach(k=>guardStatus[k]=false); logGuard("Guard kapatıldı"); io.emit("update",{guard:guardStatus,logs:antiNukeLogs}); res.sendStatus(200);});
app.get("/api/backup",(req,res)=>{ logGuard("Backup alındı"); io.emit("update",{guard:guardStatus,logs:antiNukeLogs}); res.sendStatus(200);});
app.get("/api/whitelist/:action/:user",(req,res)=>{ const {action,user}=req.params; if(action==="ekle") whitelist.add(user); else whitelist.delete(user); logGuard("Whitelist "+action+": "+user); io.emit("update",{guard:guardStatus,logs:antiNukeLogs}); res.sendStatus(200);});
app.get("/api/jail/:action/:user",(req,res)=>{ const {action,user}=req.params; logGuard("Jail "+action+": "+user); io.emit("update",{guard:guardStatus,logs:antiNukeLogs}); res.sendStatus(200);});
app.get("/api/limit/:type/:value",(req,res)=>{ const {type,value}=req.params; limits.set("limit_"+type,parseInt(value)); logGuard("Limit "+type+": "+value); io.emit("update",{guard:guardStatus,logs:antiNukeLogs}); res.sendStatus(200);});

// START
server.listen(DASHBOARD_PORT,()=>console.log(`🌐 Dashboard: http://localhost:${DASHBOARD_PORT}`));
client.login(config.token).then(()=>console.log("🤖 TitanGuard aktif!"));