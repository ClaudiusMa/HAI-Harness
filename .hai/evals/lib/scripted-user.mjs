// The deterministic scripted user. After each agent reply it decides whether the agent is
// waiting on the user (a question, a go-ahead request, an integration approval) and, if so,
// what to answer, from the scenario's reply policy. It never improvises: an unmatched
// question gets the policy's fallback text, and every answer is recorded with its rule id.

// A reply waits on the user when its closing part asks a question or asks for a go-ahead
// or approval. "Let me know if you want changes" alone does not count.
const DEFAULT_WAITING = [
  "\\?[*_`)\\s]*$",
  "\\?[*_`)]*\\s*\\n",
  "\\b(please confirm|your go-?ahead|go-?ahead\\b|approve|approval|waiting for your|reply with)\\b"
];

const DEFAULT_RULES = [
  {
    id: "integration",
    kind: "integration",
    match: "\\b(worktree approve|integrate|merge|approve the (lane|task|change|build)|ready to (merge|integrate))\\b",
    reply: "Yes, approve and integrate it."
  },
  {
    id: "go-ahead",
    kind: "go-ahead",
    match: "\\b(go-?ahead|shall i (build|start|proceed|go)|should i (build|start|proceed|go)|ready to build|proceed|confirm|sound(s)? (right|good)|look(s)? (right|good)|ok to|okay to|want me to)\\b",
    reply: "Yes, go ahead."
  }
];

const DEFAULT_FALLBACK = "I have nothing to add. If you need a decision from me to finish this request, use your best judgement; otherwise this request is done.";

function compile(pattern) {
  return pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
}

// The last part of a reply is where an agent asks; the whole reply is matched for content.
function tail(text, chars = 1200) {
  return text.length > chars ? text.slice(-chars) : text;
}

export function isWaiting(text, policy = {}) {
  const patterns = (policy.waitingPatterns ?? DEFAULT_WAITING).map(compile);
  const end = tail(text ?? "");
  return patterns.some((p) => p.test(end));
}

// state: { followUpsUsed: {id: n} } carried across the run.
// probe: the latest scenario probe result ({ bugFixed, wrongBuild, ... }) or null.
// Returns null when the turn is over, else { reply, rules: [ids], kind }.
export function respond({ text, policy = {}, probe = null, state, turn = {} }) {
  const reply = text ?? "";
  const waiting = isWaiting(reply, policy);
  if (waiting && turn.answerQuestions !== false) {
    const clarifications = (policy.clarifications ?? []).filter((rule) => compile(rule.match).test(reply));
    const answers = clarifications.map((rule) => rule.reply);
    const ids = clarifications.map((rule) => rule.id);
    const rules = [...(policy.rules ?? []), ...(policy.defaultRules === false ? [] : DEFAULT_RULES)];
    const matched = rules.find((rule) => compile(rule.match).test(tail(reply)));
    if (matched) {
      answers.push(matched.reply);
      ids.push(matched.id);
    }
    if (answers.length === 0) {
      return { reply: policy.fallback ?? DEFAULT_FALLBACK, rules: ["fallback"], kind: "unmatched" };
    }
    const kind = clarifications.length ? "clarification" : matched.kind ?? "confirmation";
    return { reply: answers.join(" "), rules: ids, kind };
  }
  // Not waiting: a scenario follow-up may still fire on a probe result (for example "the
  // bug is still there" after the agent says it is fixed).
  for (const followUp of policy.followUps ?? []) {
    const used = state.followUpsUsed[followUp.id] ?? 0;
    if (used >= (followUp.maxTimes ?? 1)) continue;
    if (!probe || probe[followUp.when.probe] !== followUp.when.equals) continue;
    state.followUpsUsed[followUp.id] = used + 1;
    return { reply: followUp.reply, rules: [followUp.id], kind: "follow-up" };
  }
  return null;
}
