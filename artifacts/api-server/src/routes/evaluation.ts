import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import crypto from "crypto";

const router: IRouter = Router();

const EVAL_CRITERIA = {
  claimVerification: {
    weight: 0.3,
    label: "Claim Verification",
  },
  evidenceQuality: {
    weight: 0.35,
    label: "Evidence Quality",
  },
  impactScore: {
    weight: 0.35,
    label: "Impact Magnitude",
  },
};

const MULTI_SIGNAL_INSTRUCTIONS = `
MULTI-SIGNAL ANALYSIS INSTRUCTIONS:
In addition to analyzing the text metadata, you MUST analyze these protocol-level signals if present in the data:

1. attestations.count — Number of third-party attestations. 0 = no external validation. 3+ = some validation. 10+ = well-validated.
2. fractions — If present, analyze the ownership distribution. Concentrated ownership (1 holder with >90%) may indicate less community support. Distributed ownership suggests broader backing.
3. sales.count — If present, indicates market validation. Sales > 0 means someone valued this enough to pay.
4. contributors — Count and diversity. Single anonymous contributor is weaker than a named team of 3+.
5. contract.chain_id — Chain 10 = Optimism (mature ecosystem), 8453 = Base (newer), 42161 = Arbitrum. The chain choice provides context.

Factor these signals into your score. A hypercert with great description but 0 attestations and single-holder fractions should score lower on evidence than one with 5 attestations and distributed ownership.`;

const CLAIM_VERIFIER_SYSTEM = `You are a Claim Verification Agent for impact certificates (hypercerts).

Your job is to analyze the INTERNAL CONSISTENCY and SPECIFICITY of an impact claim.

Evaluate these dimensions:
1. Specificity — Is the work scope clearly defined? Are contributors identified? Are timeframes specific?
2. Consistency — Do the timeframes, scope, and description align logically?
3. Verifiability — Could an independent observer verify this claim? Are there measurable outcomes mentioned?
4. Completeness — Are all fields filled meaningfully?

SCORING GUIDE:
- 90-100: Extremely specific, internally consistent, all fields meaningful, easy to verify
- 70-89: Good specificity, minor gaps, mostly verifiable
- 50-69: Moderate — some vague claims, some inconsistencies
- 30-49: Weak — generic descriptions, missing contributors, unclear scope
- 0-29: Very poor — placeholder text, contradictory claims, unverifiable

${MULTI_SIGNAL_INSTRUCTIONS}

You MUST respond with ONLY valid JSON (no markdown, no backticks, no explanation outside the JSON):
{
  "score": <number 0-100>,
  "confidence": <number 0-100>,
  "findings": [
    {"aspect": "specificity", "status": "pass", "detail": "one sentence"},
    {"aspect": "consistency", "status": "warn", "detail": "one sentence"},
    {"aspect": "verifiability", "status": "fail", "detail": "one sentence"},
    {"aspect": "completeness", "status": "pass", "detail": "one sentence"}
  ],
  "summary": "2-3 sentence overall assessment"
}

Status values: "pass" (good), "warn" (has issues), "fail" (significant problem)`;

const EVIDENCE_CHECKER_SYSTEM = `You are an Evidence Quality Agent for impact certificates (hypercerts).

Your job is to assess the QUALITY and STRENGTH of evidence supporting an impact claim.

Evaluate these dimensions:
1. Documentation — Is there a detailed description with specifics?
2. Measurability — Are outcomes quantified? Are there numbers, percentages, or concrete metrics?
3. Third-party validation — Are there attestations? How many?
4. Recency — Is the evidence timely?
5. Provenance — Can the source of work be traced?

SCORING GUIDE:
- 90-100: Rich documentation, quantified outcomes, multiple attestations, traceable provenance
- 70-89: Good documentation with some metrics, some attestations
- 50-69: Basic description, few or no metrics, limited validation
- 30-49: Vague description, no measurable outcomes, no attestations
- 0-29: No meaningful evidence at all

${MULTI_SIGNAL_INSTRUCTIONS}

You MUST respond with ONLY valid JSON (no markdown, no backticks):
{
  "score": <number 0-100>,
  "confidence": <number 0-100>,
  "findings": [
    {"aspect": "documentation", "status": "strong", "detail": "one sentence"},
    {"aspect": "measurability", "status": "moderate", "detail": "one sentence"},
    {"aspect": "third_party_validation", "status": "weak", "detail": "one sentence"},
    {"aspect": "recency", "status": "strong", "detail": "one sentence"},
    {"aspect": "provenance", "status": "moderate", "detail": "one sentence"}
  ],
  "summary": "2-3 sentence overall assessment"
}

Status values: "strong", "moderate", "weak", "absent"`;

const IMPACT_SCORER_SYSTEM = `You are an Impact Magnitude Scoring Agent for impact certificates (hypercerts).

Your job is to estimate the SIGNIFICANCE and SCALE of the claimed impact.

Evaluate these dimensions:
1. Scale — How many people/systems/entities are affected?
2. Depth — How significant is the change for those affected?
3. Duration — Is the impact short-lived or lasting?
4. Additionality — Would this impact have happened without this specific work?
5. Systemic change — Does this contribute to broader structural improvements?

SCORING GUIDE:
- 90-100: Transformative, large-scale, lasting systemic change with clear additionality
- 70-89: Significant, measurable impact on a meaningful population
- 50-69: Moderate, localized impact with some evidence of change
- 30-49: Limited impact, mostly aspirational claims without evidence of scale
- 0-29: Minimal or entirely unsubstantiated impact claims

${MULTI_SIGNAL_INSTRUCTIONS}

You MUST respond with ONLY valid JSON (no markdown, no backticks):
{
  "score": <number 0-100>,
  "confidence": <number 0-100>,
  "findings": [
    {"aspect": "scale", "rating": "high", "detail": "one sentence"},
    {"aspect": "depth", "rating": "medium", "detail": "one sentence"},
    {"aspect": "duration", "rating": "high", "detail": "one sentence"},
    {"aspect": "additionality", "rating": "low", "detail": "one sentence"},
    {"aspect": "systemic_change", "rating": "medium", "detail": "one sentence"}
  ],
  "summary": "2-3 sentence overall assessment"
}

Rating values: "high", "medium", "low", "unclear"`;

const EVALUATION_SCHEMA = "string hypercertId, uint8 overallScore, uint8 claimScore, uint8 evidenceScore, uint8 impactScore, string verdict, string summaryHash, uint64 evaluationTimestamp";

async function runAgent(systemPrompt: string, hypercertData: unknown, customContext = "") {
  const userMessage = `Evaluate this hypercert impact claim:

=== HYPERCERT DATA ===
${JSON.stringify(hypercertData, null, 2)}
=== END DATA ===

${customContext ? `ADDITIONAL CONTEXT PROVIDED BY USER:\n${customContext}\n` : ""}

Provide your evaluation as JSON only. No markdown formatting.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = (response.content[0] as { text?: string })?.text || "{}";
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned) as {
      score: number;
      confidence: number;
      findings: Array<{ aspect: string; status?: string; rating?: string; detail: string }>;
      summary: string;
      error?: boolean;
    };
  } catch (err) {
    return {
      score: 0,
      confidence: 0,
      findings: [{ aspect: "error", status: "fail", detail: (err as Error).message }],
      summary: `Agent encountered an error: ${(err as Error).message}`,
      error: true,
    };
  }
}

function generateUnsignedAttestation(result: Record<string, unknown>) {
  const agents = result.agents as Record<string, { score?: number; summary?: string }> | undefined;
  const attestationData = {
    schema: EVALUATION_SCHEMA,
    data: {
      hypercertId: result.hypercertId || "unknown",
      overallScore: result.overallScore,
      claimScore: agents?.claimVerification?.score || 0,
      evidenceScore: agents?.evidenceQuality?.score || 0,
      impactScore: agents?.impactMagnitude?.score || 0,
      verdict: result.verdict,
      summaryHash: crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex"),
      evaluationTimestamp: Math.floor(Date.now() / 1000),
    },
    evaluatorAgent: "HyperEval v1.0",
    agentDetails: {
      claimVerifier: agents?.claimVerification?.summary,
      evidenceChecker: agents?.evidenceQuality?.summary,
      impactScorer: agents?.impactMagnitude?.summary,
    },
  };

  return {
    success: true,
    attestation: attestationData,
    attester: "unsigned — no private key configured",
    schema: EVALUATION_SCHEMA,
    type: "unsigned-format",
    note: "This attestation is correctly formatted but not cryptographically signed. Set EVALUATOR_PRIVATE_KEY to enable signing.",
  };
}

function generateLexiconCompatible(result: Record<string, unknown>, hypercertData: Record<string, unknown>) {
  const agents = result.agents as Record<string, { score?: number; findings?: Array<Record<string, unknown>> }> | undefined;
  return {
    $type: "org.hypercerts.claim.evaluation",
    subject: {
      hypercertId: result.hypercertId,
      uri: hypercertData.uri || null,
    },
    evaluator: {
      agent: "HyperEval",
      version: "1.0.0",
      method: "multi-agent-ai-evaluation",
    },
    scores: {
      overall: result.overallScore,
      claimVerification: agents?.claimVerification?.score,
      evidenceQuality: agents?.evidenceQuality?.score,
      impactMagnitude: agents?.impactMagnitude?.score,
    },
    verdict: result.verdict,
    confidence: result.confidence,
    methodology: "3 specialized AI agents (Claude claude-sonnet-4-6) evaluate independently on claim consistency, evidence quality, and impact magnitude. Scores are weighted 30/35/35 and aggregated.",
    findings: [
      ...((agents?.claimVerification?.findings || []).map(f => ({
        category: "claim_verification",
        ...f,
      }))),
      ...((agents?.evidenceQuality?.findings || []).map(f => ({
        category: "evidence_quality",
        ...f,
      }))),
      ...((agents?.impactMagnitude?.findings || []).map(f => ({
        category: "impact_magnitude",
        ...f,
      }))),
    ],
    createdAt: new Date().toISOString(),
  };
}

export async function evaluateHypercertCore(hypercertData: unknown, customContext = "") {
  const startTime = Date.now();
  const hcData = hypercertData as Record<string, unknown>;
  const metadata = hcData.metadata as Record<string, string> | undefined;
  const name = metadata?.name || (hcData as { name?: string }).name || "Unknown";

  const [claimResult, evidenceResult, impactResult] = await Promise.all([
    runAgent(CLAIM_VERIFIER_SYSTEM, hypercertData, customContext),
    runAgent(EVIDENCE_CHECKER_SYSTEM, hypercertData, customContext),
    runAgent(IMPACT_SCORER_SYSTEM, hypercertData, customContext),
  ]);

  const overallScore = Math.round(
    (claimResult.score || 0) * EVAL_CRITERIA.claimVerification.weight +
      (evidenceResult.score || 0) * EVAL_CRITERIA.evidenceQuality.weight +
      (impactResult.score || 0) * EVAL_CRITERIA.impactScore.weight,
  );

  const avgConfidence = Math.round(
    ((claimResult.confidence || 0) +
      (evidenceResult.confidence || 0) +
      (impactResult.confidence || 0)) /
      3,
  );

  let verdict: string, verdictLabel: string;
  if (overallScore >= 80) {
    verdict = "excellent";
    verdictLabel = "Excellent";
  } else if (overallScore >= 60) {
    verdict = "good";
    verdictLabel = "Good";
  } else if (overallScore >= 40) {
    verdict = "fair";
    verdictLabel = "Fair";
  } else if (overallScore >= 20) {
    verdict = "weak";
    verdictLabel = "Weak";
  } else {
    verdict = "insufficient";
    verdictLabel = "Insufficient";
  }

  const elapsed = Date.now() - startTime;

  const result: Record<string, unknown> = {
    hypercertId: (hcData as { hypercert_id?: string }).hypercert_id || "custom",
    hypercertName: name,
    overallScore,
    confidence: avgConfidence,
    verdict,
    verdictLabel,
    evaluatedAt: new Date().toISOString(),
    evaluationTimeMs: elapsed,
    agents: {
      claimVerification: {
        ...claimResult,
        label: EVAL_CRITERIA.claimVerification.label,
        weight: EVAL_CRITERIA.claimVerification.weight,
      },
      evidenceQuality: {
        ...evidenceResult,
        label: EVAL_CRITERIA.evidenceQuality.label,
        weight: EVAL_CRITERIA.evidenceQuality.weight,
      },
      impactMagnitude: {
        ...impactResult,
        label: EVAL_CRITERIA.impactScore.label,
        weight: EVAL_CRITERIA.impactScore.weight,
      },
    },
  };

  result.attestation = generateUnsignedAttestation(result);
  result.lexiconCompatible = generateLexiconCompatible(result, hcData);

  return result;
}

router.post("/evaluate", async (req, res) => {
  const { hypercertData, customContext } = req.body as {
    hypercertData: unknown;
    customContext?: string;
  };
  if (!hypercertData) {
    res.status(400).json({ error: "hypercertData is required in request body" });
    return;
  }

  try {
    const result = await evaluateHypercertCore(hypercertData, customContext || "");
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Evaluation error");
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
