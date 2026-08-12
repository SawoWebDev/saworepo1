// rake.js
// A small, dependency-free implementation of RAKE (Rapid Automatic Keyword
// Extraction — Rose et al. 2010) for Phase 2 of the SEO Keyword
// Intelligence module. No npm package used on purpose: RAKE is simple
// enough to implement directly, and this avoids pulling in an
// unmaintained micro-dependency for ~100 lines of logic (same reasoning
// already applied to scripts/generate-sitemap.js's zero-dependency design
// — see docs/🟢 SEO/SEO-AUTOMATION.md).
//
// Algorithm: split text into candidate phrases at stopwords/punctuation,
// score each word by (co-occurrence degree / frequency), score each phrase
// as the sum of its words' scores, then aggregate. See extractKeywords'
// doc comment for the title/H1 weighting this module adds on top of
// vanilla RAKE, per the spec's "weight phrases higher when found in
// title/H1 vs. body text" requirement.

const STOPWORDS = new Set(
  (
    "a,about,above,after,again,against,all,am,an,and,any,are,aren't,as,at,be,because,been,before,being,below," +
    "between,both,but,by,can't,cannot,could,couldn't,did,didn't,do,does,doesn't,doing,don't,down,during,each,few," +
    "for,from,further,had,hadn't,has,hasn't,have,haven't,having,he,he'd,he'll,he's,her,here,here's,hers,herself," +
    "him,himself,his,how,how's,i,i'd,i'll,i'm,i've,if,in,into,is,isn't,it,it's,its,itself,let's,me,more,most," +
    "mustn't,my,myself,no,nor,not,of,off,on,once,only,or,other,ought,our,ours,ourselves,out,over,own,same," +
    "shan't,she,she'd,she'll,she's,should,shouldn't,so,some,such,than,that,that's,the,their,theirs,them," +
    "themselves,then,there,there's,these,they,they'd,they'll,they're,they've,this,those,through,to,too,under," +
    "until,up,very,was,wasn't,we,we'd,we'll,we're,we've,were,weren't,what,what's,when,when's,where,where's," +
    "which,while,who,who's,whom,why,why's,with,won't,would,wouldn't,you,you'd,you'll,you're,you've,your,yours," +
    "yourself,yourselves"
  ).split(",")
);

const PHRASE_DELIMITERS = /[,.!?;:()[\]{}"'\-–—/\\|<>]+/;
const MIN_WORD_LENGTH = 3;
const MAX_PHRASE_WORDS = 5;

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(PHRASE_DELIMITERS)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

/** Splits raw text into candidate phrases (stopword- and punctuation-delimited runs of content words). */
function extractCandidatePhrases(text) {
  const chunks = tokenize(text);
  const phrases = [];

  for (const chunk of chunks) {
    const words = chunk.split(/\s+/).filter(Boolean);
    let current = [];
    for (const word of words) {
      const isStopword = STOPWORDS.has(word) || word.length < MIN_WORD_LENGTH || /^\d+$/.test(word);
      if (isStopword) {
        if (current.length) phrases.push(current);
        current = [];
      } else {
        current.push(word);
      }
    }
    if (current.length) phrases.push(current);
  }

  return phrases.filter((p) => p.length <= MAX_PHRASE_WORDS);
}

/** Standard RAKE word scoring: score(w) = degree(w) / frequency(w), where
 * degree(w) is the sum of the lengths of every phrase containing w
 * (co-occurrence, including w's own contribution) and frequency(w) is how
 * many phrases contain w. */
function scoreWords(phrases) {
  const freq = new Map();
  const degree = new Map();

  for (const phrase of phrases) {
    const len = phrase.length;
    for (const word of phrase) {
      freq.set(word, (freq.get(word) || 0) + 1);
      degree.set(word, (degree.get(word) || 0) + len);
    }
  }

  const scores = new Map();
  for (const [word, f] of freq) {
    scores.set(word, degree.get(word) / f);
  }
  return scores;
}

function scorePhrase(phrase, wordScores) {
  return phrase.reduce((sum, word) => sum + (wordScores.get(word) || 0), 0);
}

/**
 * Extracts and scores keyword phrases from a single page's text fields.
 *
 * @param {object} fields
 * @param {string} [fields.title]
 * @param {string[]} [fields.headings] - h1-h3 text
 * @param {string} [fields.metaDescription]
 * @param {string} [fields.body] - main content, boilerplate already stripped
 * @param {object} [weights] - multipliers applied to phrase scores by where they were found
 * @returns {Array<{ phrase: string, score: number }>} sorted descending by score
 */
export function extractKeywords(fields, weights = { title: 4, heading: 2, metaDescription: 1.5, body: 1 }) {
  const allPhrases = [
    ...extractCandidatePhrases(fields.title).map((p) => ({ phrase: p, source: "title" })),
    ...(fields.headings || []).flatMap((h) => extractCandidatePhrases(h).map((p) => ({ phrase: p, source: "heading" }))),
    ...extractCandidatePhrases(fields.metaDescription).map((p) => ({ phrase: p, source: "metaDescription" })),
    ...extractCandidatePhrases(fields.body).map((p) => ({ phrase: p, source: "body" })),
  ];

  if (!allPhrases.length) return [];

  // Word scores computed across ALL text (title+body+etc combined), matching
  // vanilla RAKE's whole-document co-occurrence graph.
  const wordScores = scoreWords(allPhrases.map((p) => p.phrase));

  // Then re-weight each phrase occurrence by where it appeared, and
  // aggregate duplicate phrases (e.g. a phrase in both title and body)
  // by summing their weighted scores — a phrase repeated in more places
  // should rank higher, not just take the max.
  const byPhraseText = new Map();
  for (const { phrase, source } of allPhrases) {
    const text = phrase.join(" ");
    const weight = weights[source] ?? 1;
    const weightedScore = scorePhrase(phrase, wordScores) * weight;
    byPhraseText.set(text, (byPhraseText.get(text) || 0) + weightedScore);
  }

  return Array.from(byPhraseText.entries())
    .map(([phrase, score]) => ({ phrase, score: Math.round(score * 100) / 100 }))
    .sort((a, b) => b.score - a.score);
}
