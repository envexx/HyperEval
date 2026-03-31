import React from "react";
import { motion } from "framer-motion";
import { FileBadge, Users, ArrowRight, Activity, ExternalLink } from "lucide-react";
import { type Hypercert } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface HypercertCardProps {
  hypercert: Hypercert;
  onEvaluate: (h: Hypercert) => void;
  onViewDetail: (h: Hypercert) => void;
  isEvaluating: boolean;
  delay?: number;
}

export function HypercertCard({
  hypercert,
  onEvaluate,
  onViewDetail,
  isEvaluating,
  delay = 0,
}: HypercertCardProps) {
  const meta = hypercert.metadata || {};
  const workScope = Array.isArray(meta.work_scope) ? meta.work_scope : [];
  const contributorsCount = Array.isArray(meta.contributors) ? meta.contributors.length : 0;
  const attestationCount = hypercert.attestations?.count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.05, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border overflow-hidden transition-all duration-300",
        "bg-card/50 hover:bg-card/80 border-border/50 hover:border-primary/30",
        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-primary/5",
        isEvaluating && "border-primary/50 shadow-[0_0_20px_rgba(34,197,94,0.1)] pointer-events-none"
      )}
    >
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Clickable detail area */}
      <button
        onClick={() => onViewDetail(hypercert)}
        className="flex-1 text-left p-6 pb-4 focus:outline-none"
        tabIndex={0}
        aria-label={`View details for ${meta.name || "Untitled"}`}
      >
        <div className="flex items-start justify-between mb-3 gap-3">
          <h3 className="font-bold text-base text-foreground leading-tight group-hover:text-primary/90 transition-colors line-clamp-2">
            {meta.name || "Untitled Impact Claim"}
          </h3>
          <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground/40 group-hover:text-primary/60 transition-colors mt-0.5" />
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
          {meta.description || "No description provided for this hypercert."}
        </p>

        {workScope.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {workScope.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-secondary/80 text-secondary-foreground text-xs rounded-md border border-white/5 font-medium"
              >
                {tag}
              </span>
            ))}
            {workScope.length > 4 && (
              <span className="px-2 py-0.5 text-muted-foreground/60 text-xs font-medium">
                +{workScope.length - 4} more
              </span>
            )}
          </div>
        )}
      </button>

      {/* Footer row */}
      <div className="px-6 pb-5 pt-3 border-t border-border/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5" title="Attestations">
            <FileBadge className="w-4 h-4 text-primary/70" />
            <span>{attestationCount}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Contributors">
            <Users className="w-4 h-4 text-blue-400/70" />
            <span>{contributorsCount}</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onEvaluate(hypercert); }}
          disabled={isEvaluating}
          className={cn(
            "relative overflow-hidden px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 shrink-0",
            isEvaluating
              ? "bg-secondary text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] active:scale-95"
          )}
        >
          {isEvaluating ? (
            <>
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Evaluating
            </>
          ) : (
            <>
              Evaluate
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
