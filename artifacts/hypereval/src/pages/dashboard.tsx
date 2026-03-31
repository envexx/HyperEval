import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Search, FileText, BarChart3, Database, ChevronRight, Hash, ArrowLeftRight, Code2, Copy, CheckCircle2 } from "lucide-react";
import { useListHypercerts, useSearchHypercerts, useEvaluateHypercert, useExtractImpactData } from "@workspace/api-client-react";
import { type Hypercert, type EvaluationResult } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { HypercertCard } from "@/components/hypercert-card";
import { ScoreRing } from "@/components/ui/score-ring";
import { VerdictBadge } from "@/components/ui/verdict-badge";
import { AgentReport } from "@/components/agent-report";
import { CompareView } from "@/components/compare-view";
import { HypercertDetailModal } from "@/components/hypercert-detail-modal";

type TabType = "browse" | "extract" | "results" | "compare" | "api";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Detail modal
  const [selectedHypercert, setSelectedHypercert] = useState<import("@workspace/api-client-react").Hypercert | null>(null);

  // State for evaluation flow
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [currentEval, setCurrentEval] = useState<EvaluationResult | null>(null);
  const [evalHistory, setEvalHistory] = useState<EvaluationResult[]>([]);
  
  // State for extraction flow
  const [extractText, setExtractText] = useState("");

  // Queries
  const { data: listData, isLoading: listLoading } = useListHypercerts(
    { first: 12, offset: 0 },
    { query: { enabled: !debouncedSearch } }
  );

  const { data: searchData, isLoading: searchLoading } = useSearchHypercerts(
    { q: debouncedSearch || "" },
    { query: { enabled: !!debouncedSearch } }
  );

  // Mutations
  const evaluateMutation = useEvaluateHypercert();
  const extractMutation = useExtractImpactData();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery);
  };

  const handleEvaluate = async (hypercert: Hypercert) => {
    setEvaluatingId(hypercert.hypercert_id);
    setActiveTab("results");
    setCurrentEval(null);
    
    try {
      const result = await evaluateMutation.mutateAsync({ data: { hypercertData: hypercert as any } });
      setCurrentEval(result);
      setEvalHistory(prev => {
        const filtered = prev.filter(e => e.hypercertId !== result.hypercertId);
        return [result, ...filtered];
      });
    } catch (error) {
      console.error("Evaluation failed", error);
      // Fallback for UI if API fails completely (simulating the spec's error handling)
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleExtract = async () => {
    if (!extractText.trim()) return;
    try {
      await extractMutation.mutateAsync({ data: { text: extractText } });
    } catch (error) {
      console.error("Extraction failed", error);
    }
  };

  const displayData = debouncedSearch ? searchData : listData;
  const isLoading = debouncedSearch ? searchLoading : listLoading;
  const hypercerts = displayData?.data || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      {/* Background ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab("browse")}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              HyperEval
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest bg-secondary/80 text-muted-foreground border border-white/5">
                AI Agent
              </span>
            </h1>
          </div>

          <nav role="navigation" aria-label="Main navigation" className="flex items-center p-1 bg-secondary/50 rounded-xl border border-white/5 backdrop-blur-md overflow-x-auto no-scrollbar">
            {[
              { id: "browse", label: "Browse", icon: Database },
              { id: "extract", label: "Extract", icon: FileText },
              { id: "results", label: "Results", icon: BarChart3 },
              { id: "compare", label: "Compare", icon: ArrowLeftRight },
              { id: "api", label: "API", icon: Code2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative px-2.5 sm:px-4 py-2 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all duration-200 whitespace-nowrap shrink-0 min-w-[36px] min-h-[36px] justify-center sm:justify-start",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-lg shadow-md shadow-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {(tab.id === "results" || tab.id === "compare") && evalHistory.length > 0 && (
                      <span className={cn(
                        "ml-0.5 sm:ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                        isActive ? "bg-primary-foreground/20 text-white" : "bg-primary/20 text-primary"
                      )}>
                        {evalHistory.length}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* BROWSE TAB */}
          {activeTab === "browse" && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">Impact Claims</h2>
                  <p className="text-muted-foreground">Select a hypercert to evaluate its impact claims with AI.</p>
                </div>
                
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="block w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                  />
                  {searchQuery !== debouncedSearch && (
                    <button type="submit" className="absolute inset-y-1.5 right-1.5 px-3 bg-secondary hover:bg-secondary/80 text-xs font-medium rounded-lg border border-white/5 transition-colors">
                      Search
                    </button>
                  )}
                </form>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
                  ))}
                </div>
              ) : hypercerts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hypercerts.map((hc, i) => (
                    <HypercertCard
                      key={hc.hypercert_id}
                      hypercert={hc as Hypercert}
                      onEvaluate={handleEvaluate}
                      onViewDetail={(h) => setSelectedHypercert(h)}
                      isEvaluating={evaluatingId === hc.hypercert_id}
                      delay={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-border rounded-2xl bg-card/20">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No hypercerts found</h3>
                  <p className="mt-1 text-muted-foreground">Try adjusting your search query.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* EXTRACT TAB */}
          {activeTab === "extract" && (
            <motion.div
              key="extract"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-10">
                <div className="inline-flex p-2.5 sm:p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Unstructured Data Integration</h2>
                <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
                  Paste any report, proposal, or description. Our AI agent will extract structured hypercert-compatible metrics and data.
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-2 shadow-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-300">
                <textarea
                  value={extractText}
                  onChange={(e) => setExtractText(e.target.value)}
                  placeholder="Paste impact report, grant proposal, or project description here..."
                  className="w-full h-64 bg-transparent border-none text-foreground placeholder:text-muted-foreground/60 resize-none p-4 focus:outline-none font-sans text-base leading-relaxed"
                />
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-white/5 mt-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {extractText.length} characters
                  </span>
                  <button
                    onClick={handleExtract}
                    disabled={extractMutation.isPending || !extractText.trim()}
                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-secondary disabled:text-muted-foreground text-primary-foreground font-semibold rounded-lg transition-all flex items-center gap-2"
                  >
                    {extractMutation.isPending ? (
                      <><Activity className="w-4 h-4 animate-pulse" /> Extracting Data...</>
                    ) : (
                      <><Hash className="w-4 h-4" /> Extract to Schema</>
                    )}
                  </button>
                </div>
              </div>

              {extractMutation.isSuccess && extractMutation.data?.success && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-primary/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.05)]"
                >
                  <div className="bg-secondary/50 px-6 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Extracted Schema
                    </h3>
                    <span className="text-xs text-muted-foreground font-mono">JSON Format</span>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <pre className="text-sm text-foreground/80 font-mono leading-relaxed">
                      {JSON.stringify(extractMutation.data.extracted, null, 2)}
                    </pre>
                  </div>
                  {extractMutation.data.extracted?.confidence_notes && (
                    <div className="px-6 py-4 bg-warning/10 border-t border-warning/20">
                      <p className="text-xs text-warning flex items-start gap-2">
                        <span className="font-bold mt-0.5">Note:</span> 
                        {extractMutation.data.extracted.confidence_notes}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* RESULTS TAB */}
          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {evaluatingId && !currentEval && (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-secondary rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                    <Activity className="w-8 h-8 text-primary absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white">Evaluating Claim...</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Running 3 specialized AI agents in parallel to verify claims, check evidence, and score impact magnitude.
                    </p>
                  </div>
                </div>
              )}

              {currentEval && !evaluateMutation.isError && (
                <div className="space-y-8">
                  {/* Hero Summary Card */}
                  <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10 relative z-10">
                      <div className="flex-1 space-y-4 sm:space-y-6 w-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-mono border border-border max-w-full overflow-hidden">
                          <span className="truncate">ID: {currentEval.hypercertId.substring(0, 16)}...</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight break-words">
                          {currentEval.hypercertName}
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2">
                          <VerdictBadge verdict={currentEval.verdict} label={currentEval.verdictLabel} size="lg" />
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-secondary/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/5">
                            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Confidence: <strong className="text-foreground">{currentEval.confidence}%</strong>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {currentEval.evaluationTimeMs}ms
                          </div>
                        </div>
                      </div>
                      
                      <div className="shrink-0 bg-background/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-md">
                        <ScoreRing 
                          score={currentEval.overallScore} 
                          size={120} 
                          strokeWidth={10} 
                          label="Overall Impact Score" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agents Grid */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      Agent Reports
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {Object.entries(currentEval.agents || {}).map(([key, agent], index) => (
                        <AgentReport key={key} agent={agent} agentKey={key} delay={index} />
                      ))}
                    </div>
                  </div>

                  {/* EAS Attestation Status */}
                  {(currentEval as any).attestation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-card/80 border border-emerald-800/30 rounded-2xl p-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px]" />
                      <div className="flex items-center gap-2 mb-4 relative z-10">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <h3 className="font-semibold text-emerald-400 text-sm">
                          {(currentEval as any).attestation.type === "offchain-signed"
                            ? "Signed Off-Chain EAS Attestation"
                            : "EAS-Compatible Attestation (Unsigned)"}
                        </h3>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground font-mono relative z-10">
                        <p>Attester: {(currentEval as any).attestation.attester}</p>
                        <p>Schema: <span className="text-foreground/70">{(currentEval as any).attestation.schema}</span></p>
                        <p>Type: {(currentEval as any).attestation.type}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 relative z-10">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify((currentEval as any).attestation, null, 2));
                          }}
                          className="px-3 sm:px-4 py-2 bg-emerald-600/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-600/30 transition-colors flex items-center gap-2"
                        >
                          <Copy className="w-3 h-3 shrink-0" /> <span className="hidden sm:inline">Copy Attestation JSON</span><span className="sm:hidden">Attestation</span>
                        </button>
                        {(currentEval as any).lexiconCompatible && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify((currentEval as any).lexiconCompatible, null, 2));
                            }}
                            className="px-3 sm:px-4 py-2 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                          >
                            <Copy className="w-3 h-3 shrink-0" /> <span className="hidden sm:inline">Copy Lexicon Record</span><span className="sm:hidden">Lexicon</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 relative z-10">
                        This evaluation is a verifiable attestation compatible with the Ethereum Attestation Service and Hypercerts protocol.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {evaluateMutation.isError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center max-w-2xl mx-auto mt-20">
                  <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Evaluation Failed</h3>
                  <p className="text-destructive/80">
                    {evaluateMutation.error?.message || "An unexpected error occurred while running the AI agents."}
                  </p>
                  <button 
                    onClick={() => setActiveTab("browse")}
                    className="mt-6 px-6 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
                  >
                    Return to Browse
                  </button>
                </div>
              )}

              {/* History Section */}
              {evalHistory.length > (currentEval ? 1 : 0) && !evaluatingId && (
                <div className="mt-20 pt-10 border-t border-border">
                  <h3 className="text-lg font-bold text-white mb-6">Previous Evaluations</h3>
                  <div className="grid gap-3">
                    {evalHistory.filter(e => e.hypercertId !== currentEval?.hypercertId).map((ev, i) => (
                      <div 
                        key={i} 
                        onClick={() => setCurrentEval(ev)}
                        className="flex items-center justify-between bg-card hover:bg-secondary/80 border border-border hover:border-primary/30 rounded-xl p-3 sm:p-4 cursor-pointer transition-all group gap-3"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center border border-white/5 font-mono text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                            {ev.overallScore}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-foreground font-medium truncate">{ev.hypercertName}</h4>
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(ev.evaluatedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                          <span className="hidden sm:block"><VerdictBadge verdict={ev.verdict} label={ev.verdictLabel} size="sm" /></span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!evaluatingId && !currentEval && evalHistory.length === 0 && (
                <div className="text-center py-32 max-w-md mx-auto">
                  <BarChart3 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Results Yet</h3>
                  <p className="text-muted-foreground mb-8">
                    Browse the registry and select a hypercert to generate an AI evaluation report.
                  </p>
                  <button 
                    onClick={() => setActiveTab("browse")}
                    className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
                  >
                    Browse Hypercerts
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* COMPARE TAB */}
          {activeTab === "compare" && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CompareView
                evaluations={evalHistory}
                onRemove={(id) => {
                  setEvalHistory(prev => prev.filter(e => e.hypercertId !== id));
                  if (currentEval?.hypercertId === id) setCurrentEval(null);
                }}
              />
            </motion.div>
          )}

          {/* API TAB */}
          {activeTab === "api" && (
            <motion.div
              key="api"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div>
                <div className="inline-flex p-2.5 sm:p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4">
                  <Code2 className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Agent Endpoint</h2>
                <p className="text-muted-foreground text-sm sm:text-lg">
                  HyperEval exposes a public API that other agents, platforms, or tools can call to evaluate hypercert impact claims.
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden font-mono text-xs sm:text-sm">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-secondary/30 flex items-center gap-2 sm:gap-3">
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-bold rounded shrink-0">POST</span>
                  <span className="text-white truncate">/api/v1/agent/evaluate</span>
                </div>

                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                  <div>
                    <p className="text-muted-foreground mb-3 font-sans text-sm">Evaluate by hypercert ID:</p>
                    <pre className="text-foreground/80 bg-secondary/50 rounded-xl p-4 overflow-auto text-xs border border-white/5">
{`{
  "hypercert_id": "10-0x822f17a9...-123456",
  "context": "Optional additional context"
}`}
                    </pre>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-3 font-sans text-sm">Or pass data directly:</p>
                    <pre className="text-foreground/80 bg-secondary/50 rounded-xl p-4 overflow-auto text-xs border border-white/5">
{`{
  "hypercert_data": {
    "metadata": {
      "name": "My Impact Project",
      "description": "Description of work done...",
      "work_scope": ["climate", "open-source"],
      "contributors": ["Alice", "Bob"]
    }
  }
}`}
                    </pre>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-3 font-sans text-sm">Response includes:</p>
                    <ul className="text-muted-foreground text-xs space-y-2 font-sans">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Overall score (0-100) + verdict</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Individual agent scores + summaries</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> EAS-compatible attestation record</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Lexicon-compatible evaluation output</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-muted-foreground mb-3 font-sans text-sm">Try it:</p>
                    <pre className="text-foreground/80 bg-secondary/50 rounded-xl p-4 overflow-auto text-xs border border-white/5">
{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/agent/evaluate \\
  -H "Content-Type: application/json" \\
  -d '{"hypercert_id": "demo-1"}'`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden font-mono text-xs sm:text-sm">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-secondary/30 flex items-center gap-2 sm:gap-3">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded shrink-0">GET</span>
                  <span className="text-white">/api/v1/agent</span>
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-muted-foreground font-sans text-sm">
                    Returns endpoint documentation, capabilities, and schema information as JSON. Useful for agent discovery.
                  </p>
                </div>
              </div>

              <div className="bg-card/60 border border-border rounded-2xl p-6">
                <h3 className="text-white font-bold mb-3 font-sans">Capabilities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  {[
                    "Multi-agent evaluation (3 specialized AI agents)",
                    "EAS off-chain attestation generation",
                    "Structured JSON output compatible with Hypercerts protocol",
                    "Cross-reference analysis (attestations, fractions, contributors)",
                    "Lexicon-compatible evaluation records",
                    "Real-time GraphQL data from Hypercerts API",
                  ].map((cap) => (
                    <div key={cap} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="border-t border-border mt-auto py-4 sm:py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <span>HyperEval &mdash; Built for the Hypercerts Hackathon</span>
          <span>Powered by Hypercerts Protocol + Claude AI</span>
        </div>
      </footer>

      {/* Hypercert Detail Side Panel */}
      <HypercertDetailModal
        hypercert={selectedHypercert}
        onClose={() => setSelectedHypercert(null)}
        onEvaluate={(h) => {
          setSelectedHypercert(null);
          handleEvaluate(h);
        }}
        isEvaluating={!!evaluatingId}
      />
    </div>
  );
}
