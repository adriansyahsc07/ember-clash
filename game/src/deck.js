// Ember Clash — deck building, shuffling and drawing.
// The deck is 36 cards: four suits times values 1-9. No jokers, no wilds;
// the whole game is won or lost on value, suit advantage and timing.

import { SUIT_KEYS } from './cards.js';

export const DECK_SIZE = 36;
export const HAND_SIZE = 5;

// mulberry32: a tiny deterministic generator so screenshot states
// (and tests) can deal the exact same hands every time.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDeck() {
  const deck = [];
  for (const suit of SUIT_KEYS) {
    for (let value = 1; value <= 9; value += 1) {
      deck.push({ suit, value, id: `${suit}-${value}` });
    }
  }
  return deck;
}

export function shuffle(deck, random = Math.random) {
  const cards = deck.slice();
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// Draw one card; when the draw pile is empty, the discard pile is
// shuffled back in so a long duel never stalls.
export function drawCard(state) {
  if (state.deck.length === 0) {
    if (state.discard.length === 0) return null;
    state.deck = shuffle(state.discard, state.random);
    state.discard = [];
  }
  return state.deck.pop();
}

export function dealHand(state, count = HAND_SIZE) {
  const hand = [];
  for (let i = 0; i < count; i += 1) {
    const card = drawCard(state);
    if (card) hand.push(card);
  }
  return hand;
}
