const crypto = require("crypto");

/**
 * Normalize text for comparison: lowercase, strip punctuation, collapse space.
 * "Which IPv6 address... (fe80::/10)?" and "which ipv6 address ... fe80 /10"
 * must collapse to the same value.
 */
function normalize(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Content fingerprint for a question.
 *
 * Deliberately ignores `id`, `domain`, `difficulty`, and option ordering so the
 * same question re-imported with metadata tweaks is still recognised. Correct
 * answers are also excluded: two rows with identical stem + choices but a
 * different key are the same question, and one of them has a bad answer.
 */
function fingerprint(q) {
  const stem = normalize(q.stem);
  const choices = (q.choices || [])
    .map((c) => normalize(typeof c === "string" ? c : c.text))
    .sort()
    .join("|");
  return crypto.createHash("sha256").update(`${stem}::${choices}`).digest("hex");
}

module.exports = { normalize, fingerprint };
