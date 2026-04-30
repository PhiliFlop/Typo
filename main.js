// Typing Battle - main.js (vanilla)
// Modular functions: startGame, updateTyping, calculateWPM, simulateAI, updateLeaderboard, endGame

const SENTENCES = [
  "Zwei Seelen wohnen ach in meiner Brust, die eine will sich von der andern trennen.",
  "Mir graut es vor dem Anblick meines Standes, doch muss ich mich der Wahrheit hingeben.",
  "Es ist nicht Tugend, sondern Mut und Tand, der Menschen weiter auf der Welt erhält.",
  "Die Jahre fliessen hin, die Wahrheit bleibt und wird zur Ewigkeit geweihet.",
  "Der Glaube ist das einzige, das trägt, wenn alles Wissen mich verlässt.",
  "Wer immer strebend sich bemüht, den können wir erlösen.",
  "Der Drang zur Wahrheit wächst mit jedem Tag, doch Zweifel plagt die rastlose Brust.",
  "Gelüste locken, doch die Kraft allein vermag das Ziel zu fassen.",
  "In Moment der Wahrheit offenbaret sich, was dem Menschen wahrhaft eigen ist.",
  "Das Leben ist ein Traum, doch wer erwacht, der schaut die Wahrheit unverhohlen.",
  "Bei uns essen alle aus einem Teller, Deutschland hat einen neuen Bestseller",
  "Lehrer fragen, was ich für ein Deutsch in meinem Part schreibe,Glaub mir, diese Fame hat auch NachteileInternet, Mashkal, ballert auf lautlos",
  "Jaja, ist okay, es ballert nur auf lautlos, ich mach trotzdem sechsstellig, sag mir, wer von euch macht auch so?",
  "Zeig dir, was ne Baddie kann In Paris im Rari fahren",
  "What is nine plus ten, twenty one",
  "What color is a carrot, a carrot uhm, a carrot uhm.",
  "Moin moin meine aktiven Freunde",
  "Ich bins Marvin, ich bins Kelvin",
  "Hat so viel Bargeld in der Jacke von Moncler, der Main-Character, Oberkörper wie ein Bär"
];

// ---- DOM
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const playerNameInput = document.getElementById('player-name');

const gameScreen = document.getElementById('game-screen');
const countdownEl = document.getElementById('countdown');
const sentenceBox = document.getElementById('sentence-box');
const typingInput = document.getElementById('typing-input');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');
const mistakesEl = document.getElementById('mistakes');
const leaderboardEl = document.getElementById('leaderboard');
const startLeaderboardList = document.getElementById('start-leaderboard-list');

const endScreen = document.getElementById('end-screen');
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');
const playAgainBtn = document.getElementById('play-again');
const viewLeaderboardBtn = document.getElementById('view-leaderboard');

const leaderboardScreen = document.getElementById('leaderboard-screen');
const globalLeaderboardEl = document.getElementById('global-leaderboard');
const backToMenuBtn = document.getElementById('back-to-menu');

// ---- State
let players = []; // only human player in solo mode
let sentence = '';
let sentenceChars = [];
let startTime = null;
let gameRunning = false;
let roundStartTime = null; // time when current sentence started
let roundElapsed = 0;
let rafId = null;
let totalGameTime = 30; // 30 seconds total game time
let totalElapsed = 0;

let points = 0; // player's score
let lastCorrectCount = 0; // track for point calculation
let playerName = ''; // player's name for leaderboard

// API endpoint for Cloudflare Workers (you'll need to update this URL)
const API_BASE = import.meta.env?.VITE_API_BASE || 'https://typeshift-api.philipp-kaiser.workers.dev'; // Replace with your actual Workers URL

const MAX_MISTAKES = 999; // no practical limit now; points system is the constraint

// Utility: play a short beep (optional sound effects)
function beep(freq = 440, duration = 0.12, vol = 0.05){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, duration*1000);
  }catch(e){ /* audio not supported */ }
}

// Pick a random sentence and render it as spans
function pickSentence(){
  sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
  sentenceChars = sentence.split('');
  sentenceBox.innerHTML = '';
  sentenceChars.forEach((ch,i)=>{
    const sp = document.createElement('span');
    sp.textContent = ch;
    sp.dataset.index = i;
    sentenceBox.appendChild(sp);
  });
}

// startGame: initialize players and begin countdown
export function startGame(){
  // Check if name is entered
  playerName = playerNameInput.value.trim();
  if(!playerName){
    alert('Bitte gib deinen Namen mit Klasse ein!');
    return;
  }

  // Solo game: only the human player
  players = [];
  points = 0;
  lastCorrectCount = 0;
  pickSentence();

  const human = {
    id: 'YOU',
    name: playerName,
    progress: 0,
    wpm: 0,
    accuracy: 100,
    mistakes: 0,
    typed: '',
    finished: false,
    eliminated: false,
    finishTime: null
  };
  players.push(human);

  // UI
  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  typingInput.value = '';
  typingInput.focus();

  // Start game immediately
  beginRound();
}

function beginRound(){
  // start total game timer (30 seconds)
  gameRunning = true;
  startTime = performance.now();
  roundStartTime = performance.now();
  totalElapsed = 0;
  lastCorrectCount = 0;

  // main loop
  lastFrame = performance.now();
  rafId = requestAnimationFrame(tick);
}

// updateTyping: called on input events
function updateTyping(){
  if(!gameRunning) return;
  const human = players[0];
  const typed = typingInput.value || '';
  human.typed = typed;

  // Count correct prefix
  let correct = 0;
  for(let i=0;i<typed.length && i<sentence.length;i++){
    if(typed[i] === sentence[i]) correct++; else break;
  }

  // Calculate points: +1 per correct char, -2 per mistake
  const correctDelta = correct - lastCorrectCount;
  if(correctDelta > 0) points += correctDelta;
  lastCorrectCount = correct;

  // Mistakes are number of mismatches in typed portion
  let mistakes = 0;
  for(let i=0;i<typed.length && i<sentence.length;i++){
    if(typed[i] !== sentence[i]) mistakes++;
  }
  // Extra chars beyond sentence count as mistakes
  if(typed.length > sentence.length) mistakes += typed.length - sentence.length;

  // Deduct points for new mistakes
  if(mistakes > human.mistakes){
    const newMistakes = mistakes - human.mistakes;
    points = Math.max(0, points - (newMistakes * 2));
  }

  human.mistakes = mistakes;
  mistakesEl.textContent = points; // display points instead of mistakes

  // Update per-character highlighting
  const spans = sentenceBox.querySelectorAll('span');
  spans.forEach((sp,i)=>{
    sp.classList.remove('correct','wrong');
    if(i < typed.length){
      if(typed[i] === sp.textContent) sp.classList.add('correct');
      else sp.classList.add('wrong');
    }
  });

  // progress equals correct characters / total
  human.progress = Math.min(1, correct / Math.max(1, sentence.length));

  // WPM & accuracy
  const t = (performance.now() - startTime) / 1000;
  human.wpm = Math.round(calculateWPM(correct, t));
  human.accuracy = typed.length === 0 ? 100 : Math.max(0, Math.round((correct / typed.length) * 100));
  wpmEl.textContent = human.wpm;
  accuracyEl.textContent = human.accuracy + "%";

  // If completed -> load next sentence
  if(human.progress >= 1 && !human.finished){
    // reset for next sentence
    human.finished = false;
    human.typed = '';
    typingInput.value = '';
    lastCorrectCount = 0;
    pickSentence();
    roundStartTime = performance.now();
    beep(880, 0.08, 0.04); // little ding on sentence complete
  }
}

// calculateWPM: uses correctCharacters and seconds elapsed
export function calculateWPM(correctChars, seconds){
  if(seconds <= 0) return 0;
  const words = correctChars / 5;
  return Math.round((words / seconds) * 60);
}

// simulateAI: update AI progress each frame using dt
// updateLeaderboard: render only the human player's progress (solo)
export function updateLeaderboard(){
  const p = players[0];
  leaderboardEl.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'player-row' + (p.eliminated? ' eliminated' : '');
  const meta = document.createElement('div'); meta.className = 'player-meta';
  const name = document.createElement('div'); name.className = 'player-name'; name.textContent = p.name;
  const stats = document.createElement('div'); stats.className = 'player-stats';
  stats.textContent = `Punkte: ${points} • WPM: ${p.wpm || '-'} • Genauigkeit: ${p.accuracy || '-'}%`;
  meta.appendChild(name); meta.appendChild(stats);

  const badge = document.createElement('div'); badge.className = 'badge';
  badge.textContent = Math.round(p.progress*100) + '%';

  row.appendChild(meta); row.appendChild(badge);
  leaderboardEl.appendChild(row);
}

// elimination: eliminate the slowest non-finished player
// no AI elimination in solo mode; timeout handled in tick
function eliminateSlowest(){ /* noop for solo */ }

function eliminatePlayer(player, reason){
  if(player.eliminated || player.finished) return;
  player.eliminated = true;
  // visual cue in leaderboard
  updateLeaderboard();
  // little sound
  beep(220,0.14,0.06);
  // if human -> end game (loss)
  if(player.id === 'YOU'){
    endGame(false, reason);
  } else {
    // show small elimination message overlay
    const msg = document.createElement('div');
    msg.className = 'eliminate-anim';
    msg.style.position = 'absolute'; msg.style.right = '16px'; msg.style.top = '16px';
    msg.textContent = player.name + ' eliminated';
    document.body.appendChild(msg);
    setTimeout(()=> msg.remove(), 900);
  }
}

// called when human finishes the sentence
function wonByHuman(){
  // sentence is complete; auto-advance to next (handled in updateTyping)
}

// End game: show end screen with stats
export function endGame(won, reason){
  if(!gameRunning) return;
  gameRunning = false;
  cancelAnimationFrame(rafId);

  // UI: show end screen
  gameScreen.classList.add('hidden');
  endScreen.classList.remove('hidden');
  endTitle.textContent = `Spiel vorbei! Deine Punktzahl: ${points}`;
  endMessage.textContent = `${playerName} — ${points} Punkte`;

  // Save score to leaderboard
  saveScore(playerName, points);

  // small sound
  if(won) beep(880,0.12,0.06); else beep(180,0.18,0.06);
}

// Save score to Cloudflare D1 via Workers
async function saveScore(name, score){
  try{
    const response = await fetch(`${API_BASE}/api/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score })
    });
    if(!response.ok) console.warn('Fehler beim Speichern des Scores');
  }catch(e){
    console.warn('Netzwerkfehler beim Score speichern:', e);
  }
}

// Load and display global leaderboard
async function loadLeaderboard(targetEl, limit, emptyMessage){
  if(!targetEl) return;
  try{
    const response = await fetch(`${API_BASE}/api/scores`);
    const data = await response.json();
    renderLeaderboard(targetEl, data.scores || [], limit, emptyMessage);
  }catch(e){
    console.warn('Fehler beim Laden des Leaderboards:', e);
    targetEl.innerHTML = '<p class="empty-leaderboard">Leaderboard nicht verfügbar</p>';
  }
}

function renderLeaderboard(targetEl, scores, limit, emptyMessage){
  targetEl.innerHTML = '';
  if(scores.length === 0){
    targetEl.innerHTML = `<p class="empty-leaderboard">${emptyMessage}</p>`;
    return;
  }
  scores.slice(0, limit).forEach((entry, i)=>{
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
      <div class="player-meta">
        <div class="player-name">#${i+1} — ${entry.name}</div>
        <div class="player-stats">${entry.score} Punkte</div>
      </div>
      <div class="badge">${entry.score}</div>
    `;
    targetEl.appendChild(row);
  });
}

// Main loop
let lastFrame = 0;
function tick(ts){
  if(!gameRunning) return;
  const dt = (ts - lastFrame)/1000; // seconds
  lastFrame = ts;
  totalElapsed = (ts - startTime) / 1000;

  // update remaining time display (total 30 seconds)
  const remaining = Math.max(0, Math.ceil(totalGameTime - totalElapsed));
  countdownEl.textContent = remaining > 0 ? remaining : '0';

  // 30 seconds elapsed -> game over
  if(totalElapsed >= totalGameTime){
    endGame(true, 'Zeit vorbei');
    return;
  }

  // update leaderboard and UI
  updateLeaderboard();

  // schedule next frame
  rafId = requestAnimationFrame(tick);
}

// helpers
function randRange(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

// wiring
startBtn.addEventListener('click', ()=> startGame());
typingInput.addEventListener('input', updateTyping);
playAgainBtn.addEventListener('click', ()=>{
  // reset screens
  playerNameInput.value = '';
  startScreen.classList.remove('hidden');
  endScreen.classList.add('hidden');
  leaderboardScreen.classList.add('hidden');
  typingInput.focus();
  loadLeaderboard(startLeaderboardList, 10, 'Noch keine Scores...');
});
viewLeaderboardBtn.addEventListener('click', ()=>{
  endScreen.classList.add('hidden');
  leaderboardScreen.classList.remove('hidden');
  loadLeaderboard(globalLeaderboardEl, 20, 'Noch keine Scores...');
});
backToMenuBtn.addEventListener('click', ()=>{
  leaderboardScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  playerNameInput.focus();
  loadLeaderboard(startLeaderboardList, 10, 'Noch keine Scores...');
});

loadLeaderboard(startLeaderboardList, 10, 'Noch keine Scores...');

// make startGame available on global for quick debugging
window.startGame = startGame;
