import React from "react";
import { motion } from "framer-motion";
import { type EvaluationResult } from "@workspace/api-client-react";
import { ScoreRing } from "./ui/score-ring";
import { VerdictBadge } from "./ui/verdict-badge";
import { ArrowLeftRight, X } from "lucide-react";

interface CompareViewProps {
  evaluations: EvaluationResult[];
  onRemove: (hypercertId: string) => void;
}

export function CompareView({ evaluations, onRemove }: CompareViewProps) {
  if (evaluations.length < 2) {
    return (
      <div className="text-center py-32 max-w-md mx-auto">
        <ArrowLeftRight className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-white mb-2">Compare Evaluations</h3>
        <p className="text-muted-foreground">
          You need at least 2 evaluated hypercerts to compare. Go to Browse and evaluate more hypercerts.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">Side-by-Side Comparison</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Compare evaluation results across multiple hypercerts.</p>
      </div>

      <div className="overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-4 sm:gap-6" style={{ minWidth: evaluations.length * 300 }}>
          {evaluations.map((ev, index) => (
            <motion.div
              key={ev.hypercertId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="w-[280px] sm:w-[360px] shrink-0 space-y-4"
            >
              <div className="bg-card/80 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <button
                  onClick={() => onRemove(ev.hypercertId)}
                  className="absolute top-3 right-3 p-1 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center gap-4">
                  <ScoreRing score={ev.overallScore} size={120} strokeWidth={10} />

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                      {ev.hypercertName}
                    </h3>
                    <VerdictBadge verdict={ev.verdict} label={ev.verdictLabel} size="md" />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Confidence: <strong className="text-foreground">{ev.confidence}%</strong></span>
                    <span className="font-mono">{ev.evaluationTimeMs}ms</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(ev.agents || {}).map(([key, agent]: [string, any]) => (
                  <div
                    key={key}
                    className="bg-card/40 border border-border/50 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{agent.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">{Math.round(agent.weight * 100)}%</span>
                        <span className="text-lg font-bold font-mono text-white">{agent.score}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {agent.summary}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-6 mt-4">
        <h3 className="text-lg font-bold text-white mb-4">Score Comparison</h3>
        <div className="space-y-3">
          {["claimVerification", "evidenceQuality", "impactMagnitude"].map((agentKey) => (
            <div key={agentKey} className="space-y-2">
              <span className="text-sm text-muted-foreground capitalize">
                {agentKey === "claimVerification" ? "Claim Verification" : agentKey === "evidenceQuality" ? "Evidence Quality" : "Impact Magnitude"}
              </span>
              <div className="flex items-center gap-3">
                {evaluations.map((ev) => {
                  const agent = ev.agents?.[agentKey as keyof typeof ev.agents];
                  const score = agent?.score ?? 0;
                  const maxScore = Math.max(...evaluations.map(e => e.agents?.[agentKey as keyof typeof e.agents]?.score ?? 0));
                  return (
                    <div key={ev.hypercertId} className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{ev.hypercertName}</span>
                        <span className="text-xs font-mono font-bold text-foreground ml-auto">{score}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full rounded-full ${score === maxScore ? "bg-primary" : "bg-muted-foreground/40"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
