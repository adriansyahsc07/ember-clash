// Ember Clash — the duel itself: state, round resolution and scoring.
// Two elemental duelists, 30 life each, one card a round. The higher card
// wins the round; the loser takes damage equal to the gap, +3 more when the
// winner's suit has the advantage over the loser's. Winning two rounds in a
// row with the same suit lights an Ember Chain worth +2 damage.

import { buildDeck, dealHand, drawCard, seededRandom, shuffle } from './deck.js';
import { suitBeats } from './cards.js';
import { chooseCard } from './ai.js';

export const START_LIFE = 30;
export const SUIT_BONUS = 3;
export const CHAIN_BONUS = 2;

export function newGame(seed) {
  const random = seed === undefined ? Math.random : seededRandom(seed);
  const state = {
    screen: 'title', // title | table | win | loss
    random,
    deck: [],
    discard: [],
    playerHand: [],
    aiHand: [],
    playerLife: START_LIFE,
    aiLife: START_LIFE,
    round: 1,
    playerPlayed: null,
    aiPlayed: null,
    lastPlayerCard: null,
    lastWinner: null, // 'player' | 'ai' | 'tie' | null
    chainSuit: null,
    chainCount: 0,
    log: [],
    selected: 0,
    message: '',
  };
  state.deck = shuffle(buildDeck(), random);
  state.playerHand = dealHand(state);
  state.aiHand = dealHand(state);
  return state;
}

export function startDuel(state) {
  state.screen = 'table';
  state.message = 'Round 1 — play a card!';
  state.log = ['The duel begins. 30 life each. May the embers favour you.'];
  return state;
}

function topUpHands(state) {
  const p = drawCard(state);
  if (p) state.playerHand.push(p);
  const a = drawCard(state);
  if (a) state.aiHand.push(a);
}

// Resolve one round once both cards are on the table.
// Returns a summary the renderer and the log can use.
export function resolveRound(state, playerCard, aiCard) {
  const diff = playerCard.value - aiCard.value;
  const result = {
    playerCard,
    aiCard,
    winner: 'tie',
    damage: 0,
    suitBonus: false,
    chainBonus: false,
    text: '',
  };

  if (diff === 0) {
    result.text = `Both played ${playerCard.value} — a tie, no damage.`;
  } else {
    const playerWon = diff > 0;
    const winnerCard = playerWon ? playerCard : aiCard;
    const loserCard = playerWon ? aiCard : playerCard;
    let damage = Math.abs(diff);
    if (suitBeats(winnerCard.suit, loserCard.suit)) {
      damage += SUIT_BONUS;
      result.suitBonus = true;
    }
    // Ember Chain: same suit winning twice in a row burns hotter.
    if (state.chainSuit === winnerCard.suit && state.chainCount >= 1) {
      damage += CHAIN_BONUS;
      result.chainBonus = true;
      state.chainCount += 1;
    } else {
      state.chainSuit = winnerCard.suit;
      state.chainCount = 1;
    }
    result.winner = playerWon ? 'player' : 'ai';
    result.damage = damage;
    if (playerWon) {
      state.aiLife = Math.max(0, state.aiLife - damage);
    } else {
      state.playerLife = Math.max(0, state.playerLife - damage);
    }
    const who = playerWon ? 'You win' : 'Ember wins';
    const parts = [`${who} the round, ${damage} damage`];
    if (result.suitBonus) parts.push('suit advantage +3');
    if (result.chainBonus) parts.push('Ember Chain +2');
    result.text = `${parts.join(' · ')}.`;
  }

  if (diff === 0) {
    state.chainSuit = null;
    state.chainCount = 0;
  }

  state.lastWinner = result.winner;
  state.lastPlayerCard = playerCard;
  state.discard.push(playerCard, aiCard);
  state.playerPlayed = playerCard;
  state.aiPlayed = aiCard;
  state.log.push(`Round ${state.round}: you ${playerCard.value} ${playerCard.suit} vs Ember ${aiCard.value} ${aiCard.suit} — ${result.text}`);
  return result;
}

// The player commits a card from their hand (index into playerHand).
// Returns the round result, or null when the move is not legal.
export function playCard(state, handIndex) {
  if (state.screen !== 'table') return null;
  if (handIndex < 0 || handIndex >= state.playerHand.length) return null;
  const playerCard = state.playerHand.splice(handIndex, 1)[0];
  const aiCard = chooseCard(state);
  // Guard: if the rival somehow has no card (empty hand, empty deck),
  // reshuffle the discard pile back in and draw instead of crashing.
  if (!aiCard) {
    if (state.discard.length > 0) {
      state.deck = shuffle(state.discard, state.random);
      state.discard = [];
      const fresh = drawCard(state);
      if (fresh) state.aiHand.push(fresh);
    }
    const retry = chooseCard(state);
    if (!retry) return null;
    state.aiHand.splice(state.aiHand.indexOf(retry), 1);
    const result = resolveRound(state, playerCard, retry);
    state.round += 1;
    state.selected = 0;
    topUpHands(state);
    return finishRound(state, result);
  }
  state.aiHand.splice(state.aiHand.indexOf(aiCard), 1);
  const result = resolveRound(state, playerCard, aiCard);
  state.round += 1;
  state.selected = 0;
  topUpHands(state);
  return finishRound(state, result);
}

// Shared end-of-round bookkeeping: decide whether the duel is over and
// what the table should say next. Kept apart from playCard so the
// empty-hand retry path above ends the round exactly the same way.
function finishRound(state, result) {
  if (state.aiLife <= 0 && state.playerLife <= 0) {
    // A double knockout is decided by the round winner.
    state.screen = result.winner === 'ai' ? 'loss' : 'win';
  } else if (state.aiLife <= 0) {
    state.screen = 'win';
  } else if (state.playerLife <= 0) {
    state.screen = 'loss';
  } else {
    state.message = result.text;
  }
  return result;
}

export function restart(state) {
  const fresh = newGame();
  fresh.screen = 'table';
  fresh.message = 'A new duel — Round 1!';
  fresh.log = ['A fresh duel. 30 life each.'];
  return fresh;
}

// Score line shown on the table and the end screens.
export function scoreLine(state) {
  return `You ${state.playerLife} ♥  —  Ember ${state.aiLife} ♥  ·  Round ${state.round}`;
}

export function isGameOver(state) {
  return state.screen === 'win' || state.screen === 'loss';
}
