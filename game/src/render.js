// Ember Clash — everything the player sees: the table, the hands,
// the cards, the title and end screens. Pure DOM + CSS, no canvas,
// so every card stays crisp and readable at any size.

import { cardFace } from './cards.js';
import { rivalMood } from './ai.js';
import { scoreLine } from './game.js';

const SUIT_WORD = { flame: 'FLAME', leaf: 'LEAF', stone: 'STONE', tide: 'TIDE' };

export function cardElement(card, opts = {}) {
  const el = document.createElement('div');
  el.className = 'card' + (opts.faceDown ? ' face-down' : '') + (opts.selected ? ' selected' : '') + (opts.played ? ' played' : '');
  if (opts.faceDown) {
    // A face-down rival card needs no face data at all: its back is drawn
    // from CSS, so never touch the card object here.
    el.innerHTML = '<div class="card-back">✦<span>EMBER<br>CLASH</span>✦</div>';
    return el;
  }
  const face = cardFace(card);
  el.style.setProperty('--suit', face.colour);
  el.innerHTML =
    `<div class="corner top"><span class="num">${face.value}</span><span class="glyph">${face.glyph}</span></div>` +
    `<div class="centre"><span class="big">${face.value}</span><span class="big-glyph">${face.glyph}</span><span class="suit-name">${SUIT_WORD[card.suit]}</span></div>` +
    `<div class="corner bottom"><span class="num">${face.value}</span><span class="glyph">${face.glyph}</span></div>`;
  if (opts.index !== undefined) {
    el.dataset.index = String(opts.index);
    el.title = `${face.value} of ${face.name} — press ${opts.index + 1} or click to play`;
  }
  return el;
}

export function lifeBar(life, max = 30) {
  const wrap = document.createElement('div');
  wrap.className = 'life-bar';
  const pct = Math.max(0, Math.min(100, (life / max) * 100));
  wrap.innerHTML = `<div class="life-fill" style="width:${pct}%"></div>`;
  return wrap;
}

function lifeBlock(label, life, isPlayer) {
  const block = document.createElement('div');
  block.className = 'life-block' + (isPlayer ? ' you' : ' foe');
  const name = document.createElement('div');
  name.className = 'life-name';
  name.textContent = label;
  const total = document.createElement('div');
  total.className = 'life-total';
  total.innerHTML = `<span class="heart">♥</span> ${life}`;
  block.append(name, total, lifeBar(life));
  return block;
}

export function renderTable(root, state, onPlay) {
  root.innerHTML = '';
  const table = document.createElement('div');
  table.className = 'table';

  const header = document.createElement('div');
  header.className = 'table-header';
  const round = document.createElement('div');
  round.className = 'round-label';
  round.textContent = `ROUND ${state.round}`;
  const score = document.createElement('div');
  score.className = 'score-line';
  score.textContent = scoreLine(state);
  header.append(round, score);
  table.append(header);

  const foeRow = document.createElement('div');
  foeRow.className = 'hand-row foe-row';
  foeRow.append(lifeBlock('EMBER · RIVAL', state.aiLife, false));
  const foeHand = document.createElement('div');
  foeHand.className = 'hand foe-hand';
  state.aiHand.forEach(() => foeHand.append(cardElement(null, { faceDown: true })));
  foeRow.append(foeHand);
  table.append(foeRow);

  const mid = document.createElement('div');
  mid.className = 'mid-row';
  const played = document.createElement('div');
  played.className = 'played-zone';
  if (state.playerPlayed && state.aiPlayed) {
    played.append(cardElement(state.aiPlayed, { played: true }));
    const vs = document.createElement('div');
    vs.className = 'vs';
    vs.textContent = state.lastWinner === 'player' ? 'YOU WIN THE ROUND' : state.lastWinner === 'ai' ? 'EMBER WINS' : 'TIE';
    played.append(vs);
    played.append(cardElement(state.playerPlayed, { played: true }));
  } else {
    played.innerHTML = '<div class="played-hint">Play a card — the duel is decided here</div>';
  }
  const side = document.createElement('div');
  side.className = 'side-panel';
  const mood = document.createElement('div');
  mood.className = 'mood';
  mood.textContent = rivalMood(state);
  const msg = document.createElement('div');
  msg.className = 'message';
  msg.textContent = state.message || 'Choose a card below.';
  const rules = document.createElement('div');
  rules.className = 'mini-rules';
  rules.innerHTML =
    'Higher card wins the round · loser takes the difference in damage<br>' +
    '▲ Flame &gt; ◆ Leaf &gt; ■ Stone &gt; ● Tide &gt; ▲ Flame: +3 damage<br>' +
    'Same suit wins twice in a row: Ember Chain +2';
  const log = document.createElement('div');
  log.className = 'log';
  log.textContent = state.log.slice(-3).join('\n');
  side.append(mood, msg, rules, log);
  mid.append(played, side);
  table.append(mid);

  const youRow = document.createElement('div');
  youRow.className = 'hand-row you-row';
  youRow.append(lifeBlock('YOU', state.playerLife, true));
  const hand = document.createElement('div');
  hand.className = 'hand your-hand';
  state.playerHand.forEach((card, i) => {
    const el = cardElement(card, { index: i, selected: i === state.selected });
    el.addEventListener('click', () => onPlay(i));
    hand.append(el);
  });
  youRow.append(hand);
  table.append(youRow);

  const footer = document.createElement('div');
  footer.className = 'table-footer';
  footer.textContent = 'Keys 1–5 select · Enter / Space plays · R restarts · M mutes';
  table.append(footer);

  root.append(table);
}

export function renderTitle(root) {
  root.innerHTML = '';
  const t = document.createElement('div');
  t.className = 'screen title-screen';
  t.innerHTML =
    '<div class="title-embers">▲ ◆ ■ ●</div>' +
    '<h1>EMBER<br>CLASH</h1>' +
    '<p class="tagline">An elemental duel of cards. Thirty life. One card a round. No mercy.</p>' +
    '<div class="title-cards">' +
    '<div class="mini-card flame"><span>9</span>▲</div>' +
    '<div class="mini-card tide"><span>7</span>●</div>' +
    '<div class="mini-card leaf"><span>5</span>◆</div>' +
    '<div class="mini-card stone"><span>3</span>■</div>' +
    '</div>' +
    '<p class="cta">PRESS ENTER OR CLICK TO PLAY</p>' +
    '<p class="howto">Higher card wins the round · loser takes the difference as damage<br>' +
    '▲ Flame beats ◆ Leaf beats ■ Stone beats ● Tide beats ▲ Flame (+3)<br>' +
    'Win twice in a row with one suit for an Ember Chain (+2) · First to 0 life loses</p>' +
    '<p class="keys">Mouse: click a card &nbsp;·&nbsp; Keys: 1–5 select, Enter plays, R restarts</p>';
  root.append(t);
}

export function renderEnd(root, state) {
  const won = state.screen === 'win';
  root.innerHTML = '';
  const t = document.createElement('div');
  t.className = 'screen end-screen ' + (won ? 'win' : 'loss');
  t.innerHTML =
    `<h1>${won ? 'VICTORY' : 'DEFEAT'}</h1>` +
    `<p class="end-sub">${won ? 'The embers bow to you. Ember is beaten.' : 'Ember takes the duel. The embers fade...'}</p>` +
    `<div class="final-score">FINAL SCORE<br><span class="final-numbers">YOU ${state.playerLife} ♥ &nbsp;—&nbsp; EMBER ${state.aiLife} ♥</span><br>` +
    `<span class="final-rounds">after ${Math.max(1, state.round - 1)} rounds</span></div>` +
    '<p class="cta">PRESS R OR CLICK TO DUEL AGAIN</p>';
  root.append(t);
}

export function render(root, state, onPlay) {
  if (state.screen === 'title') renderTitle(root);
  else if (state.screen === 'table') renderTable(root, state, onPlay);
  else renderEnd(root, state);
}
