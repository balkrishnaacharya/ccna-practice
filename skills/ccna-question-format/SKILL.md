# CCNA Question Format Skill

## Rules

- **Always** output questions as a JSON array of objects.
- **Never** include markdown fences around JSON when writing to a `.json` file.
- **Every** question must have these exact keys: `stem`, `explanation`, `domain`, `subtopic`, `difficulty`, `source`, `choices`.
- **Domain must be one of:** `network_infra`, `switching`, `ip_routing`, `services_security`, `ai_ops`.
- **Difficulty must be one of:** `easy`, `medium`, `hard`.
- **Choices must be an array of exactly 4 objects,** each with `text` (string) and `is_correct` (boolean).
- **At least one choice** must have `is_correct: true`.
- **Explanations must be 2–4 sentences.** No one-word explanations.

## Example

```json
{
  "stem": "Which protocol provides loop-free Layer 2 topology using Rapid PVST+?",
  "explanation": "Rapid PVST+ is Cisco's implementation of RSTP (802.1w) that provides faster convergence than classic STP. It maintains a separate spanning-tree instance per VLAN, enabling load balancing across redundant links.",
  "domain": "switching",
  "subtopic": "Rapid PVST+",
  "difficulty": "medium",
  "source": "sample",
  "choices": [
    { "text": "STP (802.1D)", "is_correct": false },
    { "text": "RSTP (802.1w)", "is_correct": true },
    { "text": "MSTP (802.1s)", "is_correct": false },
    { "text": "PVST+", "is_correct": false }
  ]
}
```

## Anti-Patterns

- ❌ `"explanation": "It is correct."` — too vague.
- ❌ `"choices": ["A", "B", "C", "D"]` — missing `is_correct`.
- ❌ `"domain": "networking"` — not a valid domain.
- ❌ Two `is_correct: true` choices when the question says "choose one."

