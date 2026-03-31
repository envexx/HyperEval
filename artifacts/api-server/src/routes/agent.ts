import { Router, type IRouter } from "express";
import { evaluateHypercertCore } from "./evaluation";

const router: IRouter = Router();

router.get("/v1/agent", (_req, res) => {
  res.json({
    name: "HyperEval Agent Endpoint",
    version: "1.0.0",
    description: "AI-powered impact claim evaluation for hypercerts. Call POST /api/v1/agent/evaluate to evaluate a hypercert.",
    endpoints: {
      evaluate: {
        method: "POST",
        path: "/api/v1/agent/evaluate",
        body: {
          hypercert_id: "string — Hypercert ID to fetch and evaluate",
          hypercert_data: "object — Or pass hypercert data directly",
          context: "string (optional) — Additional context for evaluation",
        },
        response: "Structured evaluation with scores, summaries, and EAS attestation",
      },
    },
    capabilities: [
      "Multi-agent evaluation (3 specialized AI agents)",
      "EAS off-chain attestation generation",
      "Structured JSON output compatible with hypercerts protocol",
      "Cross-reference analysis (attestations, fractions, contributors)",
      "Lexicon-compatible evaluation records",
    ],
  });
});

router.post("/v1/agent/evaluate", async (req, res) => {
  try {
    const { hypercert_id, hypercert_data, context } = req.body as {
      hypercert_id?: string;
      hypercert_data?: unknown;
      context?: string;
    };

    let dataToEvaluate: unknown;

    if (hypercert_id) {
      const fetchRes = await fetch(
        `http://localhost:${process.env.PORT || 8080}/api/hypercerts/${encodeURIComponent(hypercert_id)}`,
      );
      if (!fetchRes.ok) {
        res.status(404).json({
          error: "hypercert_not_found",
          message: `Could not fetch hypercert: ${hypercert_id}`,
        });
        return;
      }
      dataToEvaluate = await fetchRes.json();
    } else if (hypercert_data) {
      dataToEvaluate = hypercert_data;
    } else {
      res.status(400).json({
        error: "missing_input",
        message: "Provide either 'hypercert_id' (string) or 'hypercert_data' (object)",
        example: {
          hypercert_id: "10-0x822f17a9a5eecfd66dbaff7946a8071c265d1d07-123456",
          context: "Optional additional context for evaluation",
        },
      });
      return;
    }

    const evaluation = (await evaluateHypercertCore(dataToEvaluate, context || "")) as Record<string, unknown>;
    const agents = evaluation.agents as Record<string, { score?: number; summary?: string }>;

    res.json({
      agent: "HyperEval",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      input: {
        hypercert_id: hypercert_id || evaluation.hypercertId,
        context_provided: !!context,
      },
      evaluation: {
        overall_score: evaluation.overallScore,
        confidence: evaluation.confidence,
        verdict: evaluation.verdict,
        verdict_label: evaluation.verdictLabel,
        scores: {
          claim_verification: agents.claimVerification?.score,
          evidence_quality: agents.evidenceQuality?.score,
          impact_magnitude: agents.impactMagnitude?.score,
        },
        summaries: {
          claim_verification: agents.claimVerification?.summary,
          evidence_quality: agents.evidenceQuality?.summary,
          impact_magnitude: agents.impactMagnitude?.summary,
        },
      },
      attestation: evaluation.attestation || null,
      lexiconCompatible: evaluation.lexiconCompatible || null,
      meta: {
        evaluation_time_ms: evaluation.evaluationTimeMs,
        model: "claude-sonnet-4-6",
        agents_used: 3,
        schema_version: "1.0",
      },
    });
  } catch (err) {
    req.log.error({ err }, "Agent endpoint error");
    res.status(500).json({
      error: "evaluation_failed",
      message: (err as Error).message,
    });
  }
});

export default router;
