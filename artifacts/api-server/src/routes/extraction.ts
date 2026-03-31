import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

const EXTRACTION_SYSTEM = `You are a Data Integration Agent that transforms unstructured text about impact work into structured hypercert-compatible data.

Given text (from a report, website, grant proposal, DAO proposal, hackathon submission, or any description of impact work), extract and structure it into the hypercert schema format.

Rules:
- Extract ONLY information that is explicitly stated or strongly implied
- Use ISO 8601 date format (YYYY-MM-DD)
- For work_scope and impact_scope, generate short lowercase kebab-case tags
- If dates are not specified, make reasonable estimates based on context and note this in confidence_notes
- Extract ALL metrics mentioned (numbers, percentages, counts, etc.)

You MUST respond with ONLY valid JSON (no markdown, no backticks):
{
  "name": "concise title of the impact work (max 80 chars)",
  "description": "clear description of the work done and impact claimed (2-4 sentences)",
  "work_scope": ["tag1", "tag2", "tag3"],
  "impact_scope": ["tag1", "tag2"],
  "contributors": ["name or org 1", "name or org 2"],
  "work_timeframe": {
    "from": "YYYY-MM-DD",
    "to": "YYYY-MM-DD"
  },
  "impact_timeframe": {
    "from": "YYYY-MM-DD",
    "to": "YYYY-MM-DD or indefinite"
  },
  "evidence": [
    {"type": "metric", "value": "description of a quantitative metric found"},
    {"type": "link", "value": "any URL mentioned"},
    {"type": "document", "value": "any document or report referenced"},
    {"type": "testimonial", "value": "any quote or endorsement"}
  ],
  "extracted_metrics": {
    "metric_name": "value with unit"
  },
  "confidence_notes": "any caveats about the extraction — what was inferred vs stated"
}`;

router.post("/extract", async (req, res) => {
  const { text, url } = req.body as { text?: string; url?: string };
  if (!text && !url) {
    res.status(400).json({ error: "Either 'text' or 'url' is required" });
    return;
  }

  let content = text || "";
  if (url) {
    content += `\n\n[Source URL: ${url}]`;
  }

  if (!content.trim()) {
    res.status(400).json({ error: "No content provided for extraction" });
    return;
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: EXTRACTION_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Extract structured impact data from this text and convert it to hypercert schema format:\n\n---\n${content}\n---`,
        },
      ],
    });

    const responseText = (response.content[0] as { text?: string })?.text || "{}";
    const cleaned = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const structured = JSON.parse(cleaned);

    res.json({
      success: true,
      extracted: structured,
      sourceType: url ? "url" : "text",
      extractedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Extraction error");
    res.json({
      success: false,
      error: (err as Error).message,
      extractedAt: new Date().toISOString(),
    });
  }
});

export default router;
