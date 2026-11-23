// Ember Clash — deterministic screenshot states.
// ?shot=title | table | win | loss renders one exact, fixed-seed state
// so the screenshots are real renders of the game code, reproducible
// on any machine. No interaction is needed; the state is drawn as-is.

import { newGame, startDuel, resolveRound } from './game.js';
import { seededRandom } from './deck.js';

function fixedTableState() {
  // A mid-duel table: both hands visible, played cards on the table,
  // life totals showing the fight so far.
  const state = newGame(20261123);
  startDuel(state);
  // Play three scripted rounds so the table shows history and damage.
  const scripted = [
    { player: 2, ai: 0 }, // player picks a mid card, AI its best
    { player: 0, ai: 0 },
    { player: 1, ai: 0 },
  ];
  for (const pick of scripted) {
    if (state.screen !== 'table') break;
    const playerCard = state.playerHand.splice(pick.player, 1)[0];
    const aiCard = state.aiHand.splice(pick.ai, 1)[0];
    resolveRound(state, playerCard, aiCard);
    state.round += 1;
    // Draw back up to five cards each, from the fixed deck.
    if (state.deck.length) state.playerHand.push(state.deck.pop());
    if (state.deck.length) state.aiHand.push(state.deck.pop());
  }
  state.message = 'Round 4 — your move. Ember is watching your hand...';
  state.selected = 1;
  return state;
}

function fixedEndState(won) {
  const state = newGame(20261123);
  startDuel(state);
  // Force the end screen with a believable final score.
  if (won) {
    state.aiLife = 0;
    state.playerLife = 17;
    state.screen = 'win';
  } else {
    state.playerLife = 0;
    state.aiLife = 12;
    state.screen = 'loss';
  }
  state.round = 9;
  return state;
}

export function shotState(shot) {
  if (shot === 'table') return fixedTableState();
  if (shot === 'win') return fixedEndState(true);
  if (shot === 'loss') return fixedEndState(false);
  const state = newGame(20261123);
  state.screen = 'title';
  return state;
}

export function readShotParam() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}

// Keep the seeded RNG helper reachable for tests and debugging.
export { seededRandom };
