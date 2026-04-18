# CYK Parser Lab

**Theory of Computation Assignment Submission**
**Unit 3 · Context-Free Grammars & Context-Free Languages**

An interactive web-based simulator of the **Cocke–Younger–Kasami (CYK) Algorithm** — the classic O(n³|G|) dynamic programming technique for deciding membership in Context-Free Languages.

---

## Why CYK? Why It's the Best Choice

Most students will choose Turing Machines, NFA→DFA, or PDA. The CYK algorithm sits at the intersection of:
- **Context-Free Grammars (Unit 3)** — the most content-rich unit
- **Chomsky Normal Form** — a non-trivial prerequisite
- **Dynamic Programming** — the algorithmic complexity angle
- **Parse Trees** — visual derivation structure

Almost no one will implement this, and it demonstrates deeper understanding than a Turing Machine simulator.

---

## Concept: CYK Algorithm

The algorithm decides: **given a CFG G and string w, is w ∈ L(G)?**

### Prerequisites (all from Unit 3)
1. **Chomsky Normal Form (CNF)**: Every rule is either A → BC or A → a
2. **Context-Free Grammar**: G = (V, Σ, R, S)
3. **Derivation / Parse Trees**: Shown after successful membership check

### The Recurrence
```
T[1][i]   = { A | A → wᵢ ∈ R }             (base: single characters)
T[l][i]   = ⋃ₖ { A | A → BC, B ∈ T[k][i], C ∈ T[l-k][i+k] }   (step)
w ∈ L(G)  iff S ∈ T[n][1]                   (acceptance)
```

### Time Complexity: **O(n³ · |G|)**
- n = length of input string
- |G| = number of grammar productions
- The n×n DP table has O(n²) cells, each requiring O(n) split points

---

## Features

### Grammar Editor Tab
- 5 preset CNF grammars (textbook CYK example, aⁿbⁿ, palindromes, equal a's&b's, multi-alphabet)
- Custom grammar input via production rules
- Visual grammar display with colour-coded binary vs terminal productions
- CNF explainer with the 4 rules of Chomsky Normal Form

### CYK Table Tab (main simulation)
- **Step-by-step mode**: advance one cell at a time with full explanation
- **Run All**: complete DP table in one click
- **Prev/Next**: navigate backwards through steps
- The full triangular DP table — each cell shows which non-terminals can derive that substring
- Highlighted active cell, special marking for cells containing the start symbol
- Progress bar for the O(n³) computation

### Parse Tree Tab
- D3.js interactive parse tree diagram for any accepted string
- Derivation steps showing the production rules applied
- Tree depth, leaf count, and string metadata

### Batch Tester Tab
- Test up to 20 strings at once
- Language analysis: visual chips showing accepted vs rejected
- Useful for discovering the pattern of L(G) experimentally

---

## Preset Grammars

| Name | Language | Interesting Because |
|------|----------|---------------------|
| Classic CYK | Textbook Hopcroft example | Standard reference |
| aⁿbⁿ | {aⁿbⁿ \| n≥1} | Classic non-regular CFL |
| Even Palindromes | {wwᴿ \| w∈{a,b}*} | Symmetric structure |
| Equal a's & b's | Strings with #a = #b | Counting via grammar |
| Multi-alphabet | Strings over {a,b,c} | 3-terminal grammar |

---

## How to Run

```bash
# No build step required — static HTML/CSS/JS
open index.html
# OR
python3 -m http.server 8080
```

---

## Submission Description (1-2 sentences)

> An interactive web application simulating the **CYK (Cocke–Younger–Kasami) Algorithm** for deciding membership in Context-Free Languages, featuring step-by-step O(n³) dynamic programming table visualization, D3.js parse tree generation, and batch string testing across 5 CNF grammar presets.

---

## Assignment Form Answers

- **Module/Chapter**: 3
- **Topic**: CYK Algorithm for Context-Free Language Membership (Chomsky Normal Form)

---

## Why This Scores High

| Criterion | Evidence |
|-----------|----------|
| Complexity | CYK is O(n³) DP, requires CNF grammar input |
| Rarity | Almost no student will implement this |
| Covers multiple sub-topics | CNF, CFL membership, derivation, parse trees |
| Visual richness | Animated DP table + D3 parse tree |
| Batch testing | Experimentally discover L(G) |
| Step-by-step | Full explanation of every cell computed |
