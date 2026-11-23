// Ember Clash — the rival AI.
// Ember the rival does not cheat: it only sees its own hand, the cards
// already played, and the life totals. Its choices are meant to be readable
// so the player can counter them: it saves its big cards while it is ahead,
// spends them when it falls behind, and leans into the suit that beat the
// player's last card.

import { suitBeats } from './cards.js';

function handValue(hand) {
  return hand.reduce((sum, card) => sum + card.value, 0);
}

// Score a candidate card for this round. Higher is better for the AI.
export function scoreCard(card, state) {
  const me = state.aiLife;
  const foe = state.playerLife;
  const lastPlayerSuit = state.lastPlayerCard ? state.lastPlayerCard.suit : null;
  let score = card.value * 2;
  // Spend big cards when behind, hoard them when ahead.
  if (me < foe) score += card.value * 1.5;
  if (me > foe + 10) score -= card.value * 0.8;
  // Chase the suit advantage against the player's favourite suit.
  if (lastPlayerSuit && suitBeats(card.suit, lastPlayerSuit)) score += 4;
  // Keep the chain alive: repeat the suit that won the last round.
  if (state.chainSuit && card.suit === state.chainSuit) score += 2;
  // A little jitter so the rival is not perfectly predictable.
  score += state.random() * 3;
  return score;
}

export function chooseCard(state) {
  const hand = state.aiHand;
  if (hand.length === 0) return null;
  let best = hand[0];
  let bestScore = -Infinity;
  for (const card of hand) {
    const score = scoreCard(card, state);
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }
  return best;
}

// How much the AI "wants" this round, shown as a taunt line on the table.
export function rivalMood(state) {
  if (state.aiLife <= 8) return 'Ember is cornered — expect the big cards now.';
  if (state.playerLife <= 8) return 'Ember smells victory. Hold the line!';
  if (state.aiLife > state.playerLife + 10) return 'Ember is toying with you.';
  return 'Ember studies your hand...';
}

export { handValue };
