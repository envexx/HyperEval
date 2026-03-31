import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Users,
  FileBadge,
  Activity,
  ArrowRight,
  Hash,
  Link2,
  Layers,
  Globe,
} from "lucide-react";
import { type Hypercert } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  42161: "Arbitrum",
  8453: "Base",
  137: "Polygon",
  42220: "Celo",
  11155111: "Sepolia",
  84532: "Base Sepolia",
};

function useCopy(timeout = 1500) {
  const [copied, setCopied] = React.useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  };
  return { copied, copy };
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); copy(text); }}
      className={cn(
        "p-1 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0",
        className
      )}
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider sm:w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return <span className="text-sm text-muted-foreground/50">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="px-2.5 py-0.5 bg-secondary/80 text-secondary-foreground text-xs rounded-md border border-white/5 font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function formatDate(raw: string | number | null | undefined): string {
  if (!raw) return "—";
  const str = String(raw);
  if (str === "indefinite" || str === "0") return "Indefinite";
  const num = Number(str);
  if (!isNaN(num) && num > 1000000000) {
    return new Date(num * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  if (str.includes("-") && str.length >= 10) {
    return new Date(str).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  return str;
}

function formatUnits(units: string | number | null | undefined): string {
  if (!units) return "—";
  const n = Number(units);
  if (isNaN(n)) return String(units);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

interface HypercertDetailModalProps {
  hypercert: Hypercert | null;
  onClose: () => void;
  onEvaluate: (h: Hypercert) => void;
  isEvaluating: boolean;
}

export function HypercertDetailModal({
  hypercert,
  onClose,
  onEvaluate,
  isEvaluating,
}: HypercertDetailModalProps) {
  const meta = hypercert?.metadata || {};
  const chainId = hypercert?.contract?.chain_id;
  const chainName = chainId ? (CHAIN_NAMES[chainId] ?? `Chain ${chainId}`) : "—";
  const workScope = Array.isArray(meta.work_scope) ? meta.work_scope : [];
  const impactScope = Array.isArray(meta.impact_scope) ? meta.impact_scope : [];
  const contributors = Array.isArray(meta.contributors) ? meta.contributors : [];

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {hypercert && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 35, mass: 0.8 }}
            className="fixed right-0 top-0 h-full z-50 w-full max-w-xl flex flex-col bg-background border-l border-border/60 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-border bg-card/80 backdrop-blur-xl shrink-0">
              <div className="min-w-0">
                <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">Hypercert Detail</p>
                <h2 className="text-lg sm:text-xl font-bold text-white leading-snug break-words">
                  {meta.name || "Untitled Impact Claim"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Chain + quick stats */}
              <div className="flex flex-wrap gap-3 p-5 sm:p-6 border-b border-border/40 bg-secondary/20">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/60 border border-white/5 text-xs font-medium text-muted-foreground">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  {chainName}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/60 border border-white/5 text-xs font-medium text-muted-foreground">
                  <FileBadge className="w-3.5 h-3.5 text-primary" />
                  {hypercert.attestations?.count ?? 0} attestations
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/60 border border-white/5 text-xs font-medium text-muted-foreground">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  {formatUnits(hypercert.units)} units
                </div>
              </div>

              {/* Info rows */}
              <div className="px-5 sm:px-6">

                {/* Description — full, never truncated */}
                <InfoRow label="Description">
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words">
                    {meta.description || <span className="text-muted-foreground/50">No description provided.</span>}
                  </p>
                </InfoRow>

                {/* Work Scope */}
                <InfoRow label="Work Scope">
                  <TagList tags={workScope} />
                </InfoRow>

                {/* Impact Scope */}
                <InfoRow label="Impact Scope">
                  <TagList tags={impactScope} />
                </InfoRow>

                {/* Work Timeframe */}
                <InfoRow label="Work Period">
                  <div className="flex items-center gap-2 text-sm text-foreground/85">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{formatDate(meta.work_timeframe_from)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span>{formatDate(meta.work_timeframe_to)}</span>
                  </div>
                </InfoRow>

                {/* Impact Timeframe */}
                <InfoRow label="Impact Period">
                  <div className="flex items-center gap-2 text-sm text-foreground/85">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{formatDate(meta.impact_timeframe_from)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span>{formatDate(meta.impact_timeframe_to)}</span>
                  </div>
                </InfoRow>

                {/* Contributors */}
                <InfoRow label="Contributors">
                  {contributors.length === 0 ? (
                    <span className="text-sm text-muted-foreground/50">—</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {contributors.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground/85">
                          <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="break-all">{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </InfoRow>

                {/* Creator */}
                {hypercert.creator_address && (
                  <InfoRow label="Creator">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-mono text-foreground/70 break-all">
                        {hypercert.creator_address}
                      </span>
                      <CopyButton text={hypercert.creator_address} />
                    </div>
                  </InfoRow>
                )}

                {/* Hypercert ID */}
                <InfoRow label="Hypercert ID">
                  <div className="flex items-start gap-1.5">
                    <span className="text-xs font-mono text-muted-foreground break-all leading-relaxed">
                      {hypercert.hypercert_id}
                    </span>
                    <CopyButton text={hypercert.hypercert_id} />
                  </div>
                </InfoRow>

                {/* URI */}
                {hypercert.uri && (
                  <InfoRow label="Metadata URI">
                    <div className="flex items-start gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground break-all leading-relaxed">
                        {hypercert.uri}
                      </span>
                      <CopyButton text={hypercert.uri} />
                    </div>
                  </InfoRow>
                )}

              </div>
            </div>

            {/* Footer CTA */}
            <div className="shrink-0 p-5 sm:p-6 border-t border-border bg-card/60 backdrop-blur-xl">
              <button
                onClick={() => { onEvaluate(hypercert); onClose(); }}
                disabled={isEvaluating}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2",
                  isEvaluating
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                )}
              >
                {isEvaluating ? (
                  <><Activity className="w-4 h-4 animate-pulse" /> Evaluating...</>
                ) : (
                  <><Activity className="w-4 h-4" /> Evaluate with AI Agents</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
