import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileSearch, TrendingUp } from "lucide-react";
import { type AgentResult } from "@workspace/api-client-react";
import { StatusDot } from "./ui/verdict-badge";

interface AgentReportProps {
  agent: AgentResult;
  agentKey: string;
  delay?: number;
}

export function AgentReport({ agent, agentKey, delay = 0 }: AgentReportProps) {
  const getIcon = () => {
    switch (agentKey) {
      case "claimVerification": return <ShieldCheck className="w-6 h-6 text-blue-400" />;
      case "evidenceQuality": return <FileSearch className="w-6 h-6 text-purple-400" />;
      case "impactMagnitude": return <TrendingUp className="w-6 h-6 text-amber-400" />;
      default: return <ShieldCheck className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
      className="bg-card/40 border border-border/50 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm hover:bg-card/60 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-secondary/50 rounded-xl border border-white/5 shadow-inner">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{agent.label}</h3>
            <span className="text-xs text-muted-foreground font-mono">Weight: {Math.round(agent.weight * 100)}%</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
            {agent.score}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground/90 leading-relaxed mb-6 border-l-2 border-primary/30 pl-3">
        {agent.summary}
      </p>

      <div className="space-y-3 mt-auto">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Detailed Findings</h4>
        {(agent.findings || []).map((f, i) => (
          <div key={i} className="flex items-start gap-3 bg-secondary/20 p-3 rounded-lg border border-white/5">
            <StatusDot status={f.status || f.rating} />
            <div className="flex flex-col gap-0.5 w-full">
              <span className="text-foreground text-xs font-medium capitalize tracking-wide">
                {f.aspect.replace(/_/g, ' ')}
              </span>
              <span className="text-muted-foreground text-sm leading-snug">
                {f.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
