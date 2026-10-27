const boardEl = document.querySelector('#board');
const statusEl = document.querySelector('#status');
const timerEl = document.querySelector('#timer');
const difficultyEl = document.querySelector('#difficulty');
const notesButton = document.querySelector('#notes');
let solution, puzzle, entries, notes, selected = -1, notesMode = false, seconds = 0, finished = false, showErrors = false;

function shuffled(values) { const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function makeSolution() {
  const pattern = (r, c) => (r * 3 + Math.floor(r / 3) + c) % 9;
  const bands = shuffled([0, 1, 2]);
  const rows = bands.flatMap(b => shuffled([0, 1, 2]).map(r => b * 3 + r));
  const stacks = shuffled([0, 1, 2]);
  const cols = stacks.flatMap(b => shuffled([0, 1, 2]).map(c => b * 3 + c));
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return Array.from({ length: 81 }, (_, i) => digits[pattern(rows[Math.floor(i / 9)], cols[i % 9])]);
}
function candidates(grid, index) {
  const row = Math.floor(index / 9), col = index % 9, used = new Set();
  for (let n = 0; n < 9; n++) { used.add(grid[row * 9 + n]); used.add(grid[n * 9 + col]); }
  const boxRow = Math.floor(row / 3) * 3, boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) for (let c = boxCol; c < boxCol + 3; c++) used.add(grid[r * 9 + c]);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n));
}
function countSolutions(grid, limit = 2) {
  let best = -1, options = null;
  for (let i = 0; i < 81; i++) if (!grid[i]) { const current = candidates(grid, i); if (!current.length) return 0; if (!options || current.length < options.length) { best = i; options = current; if (current.length === 1) break; } }
  if (best < 0) return 1;
  let count = 0;
  for (const n of options) { grid[best] = n; count += countSolutions(grid, limit - count); if (count >= limit) break; }
  grid[best] = 0;
  return count;
}
function makePuzzle(answer, difficulty) {
  const grid = [...answer], target = { easy: 42, medium: 34, hard: 28 }[difficulty];
  for (const index of shuffled(Array.from({ length: 81 }, (_, i) => i))) {
    if (grid.filter(Boolean).length <= target) break;
    const old = grid[index]; grid[index] = 0;
    if (countSolutions(grid) !== 1) grid[index] = old;
  }
  return grid;
}
function message(value) { statusEl.textContent = value; }
function sameArea(a, b) { if (a < 0 || b < 0) return false; const ar = Math.floor(a / 9), ac = a % 9, br = Math.floor(b / 9), bc = b % 9; return ar === br || ac === bc || (Math.floor(ar / 3) === Math.floor(br / 3) && Math.floor(ac / 3) === Math.floor(bc / 3)); }
function render() {
  boardEl.replaceChildren();
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'cell'; cell.setAttribute('role', 'gridcell');
    const row = Math.floor(i / 9), col = i % 9, value = puzzle[i] || entries[i];
    if (col === 2 || col === 5) cell.classList.add('box-right');
    if (row === 2 || row === 5) cell.classList.add('box-bottom');
    if (puzzle[i]) cell.classList.add('given');
    if (sameArea(i, selected)) cell.classList.add('peer');
    if (selected >= 0 && value && value === (puzzle[selected] || entries[selected])) cell.classList.add('same');
    if (i === selected) cell.classList.add('selected');
    if (showErrors && entries[i] && entries[i] !== solution[i]) cell.classList.add('conflict');
    if (value) cell.textContent = value;
    else if (notes[i].size) { const noteGrid = document.createElement('span'); noteGrid.className = 'note-grid'; for (let n = 1; n <= 9; n++) { const mark = document.createElement('span'); mark.textContent = notes[i].has(n) ? n : ''; noteGrid.append(mark); } cell.append(noteGrid); }
    cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}: ${value || (notes[i].size ? `notes ${[...notes[i]].sort().join(', ')}` : 'empty')}${puzzle[i] ? ', given' : ''}`);
    cell.setAttribute('aria-selected', String(i === selected));
    cell.addEventListener('click', () => { selected = i; render(); boardEl.children[i].focus(); });
    boardEl.append(cell);
  }
}
function startGame() {
  solution = makeSolution(); puzzle = makePuzzle(solution, difficultyEl.value); entries = Array(81).fill(0); notes = Array.from({ length: 81 }, () => new Set());
  selected = -1; seconds = 0; finished = false; showErrors = false; notesMode = false; notesButton.setAttribute('aria-pressed', 'false'); notesButton.querySelector('span').textContent = 'Off';
  timerEl.textContent = '00:00'; message('Choose a square, then enter a number.'); render();
}
function setNumber(number) {
  if (selected < 0) { message('Choose an empty square first.'); return; }
  if (finished || puzzle[selected]) return;
  if (notesMode && number) { notes[selected].has(number) ? notes[selected].delete(number) : notes[selected].add(number); entries[selected] = 0; }
  else { entries[selected] = number; notes[selected].clear(); }
  showErrors = false; render();
  if (entries.every((value, i) => puzzle[i] || value === solution[i])) { finished = true; message(`Puzzle solved! Well done — ${timerEl.textContent}.`); }
  else message(notesMode ? 'Note updated.' : number ? 'Number entered. Keep going!' : 'Square cleared.');
}
document.querySelectorAll('[data-number]').forEach(button => button.addEventListener('click', () => setNumber(Number(button.dataset.number))));
document.querySelector('#new-game').addEventListener('click', startGame);
notesButton.addEventListener('click', () => { notesMode = !notesMode; notesButton.setAttribute('aria-pressed', String(notesMode)); notesButton.querySelector('span').textContent = notesMode ? 'On' : 'Off'; message(notesMode ? 'Notes on: add possible numbers to empty squares.' : 'Notes off: enter your answer.'); });
document.querySelector('#erase').addEventListener('click', () => setNumber(0));
document.querySelector('#hint').addEventListener('click', () => { if (finished) return; const index = selected >= 0 && !puzzle[selected] && entries[selected] !== solution[selected] ? selected : entries.findIndex((n, i) => !puzzle[i] && n !== solution[i]); if (index < 0) return; selected = index; entries[index] = solution[index]; notes[index].clear(); showErrors = false; render(); message(`Hint: row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1} is ${solution[index]}.`); if (entries.every((n, i) => puzzle[i] || n === solution[i])) { finished = true; message('Puzzle solved! Well done.'); } });
document.querySelector('#check').addEventListener('click', () => { const mistakes = entries.filter((n, i) => n && n !== solution[i]).length; showErrors = mistakes > 0; render(); message(mistakes ? `${mistakes} ${mistakes === 1 ? 'entry needs' : 'entries need'} another look. Red squares show mistakes.` : 'So far, so good! Keep going.'); });
document.addEventListener('keydown', event => { if (event.target === difficultyEl) return; if (event.key >= '1' && event.key <= '9') { event.preventDefault(); setNumber(Number(event.key)); } else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') { event.preventDefault(); setNumber(0); } else if (selected >= 0 && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); const delta = { ArrowUp:-9, ArrowDown:9, ArrowLeft:-1, ArrowRight:1 }[event.key]; const next = selected + delta; if (next >= 0 && next < 81 && !(event.key === 'ArrowLeft' && selected % 9 === 0) && !(event.key === 'ArrowRight' && selected % 9 === 8)) { selected = next; render(); boardEl.children[selected].focus(); } } });
setInterval(() => { if (finished || !solution) return; seconds++; timerEl.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }, 1000);
startGame();
