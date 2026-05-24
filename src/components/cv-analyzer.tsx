"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { Sparkles, Square } from "lucide-react";

interface Props {
  initialCv?: string;
  onSave?: (cv: string, analysis: string) => void;
  /** auto-extracts a name from the first non-empty line if true */
  showSave?: boolean;
}

/**
 * Streaming CV analyzer. Used on the homepage (legacy) and on the candidate
 * detail page (where it can persist results via onSave).
 */
export function CvAnalyzer({ initialCv = "", onSave, showSave = true }: Props) {
  const [cv, setCv] = useState(initialCv);
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"live" | "mock" | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  async function handleAnalyze() {
    setError(null);
    setAnalysis("");
    setLoading(true);
    setMode(null);

    const ctl = new AbortController();
    setController(ctl);

    try {
      const res = await fetch("/api/analyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv }),
        signal: ctl.signal,
      });

      if (!res.ok) {
        let msg = `Request failed with status ${res.status}`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch { /* ignore */ }
        setError(msg);
        return;
      }
      setMode((res.headers.get("x-echohire-mode") as "live" | "mock") ?? "live");
      if (!res.body) {
        setError("Empty response body");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        setAnalysis(buf);
      }
      if (onSave) onSave(cv, buf);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    } finally {
      setLoading(false);
      setController(null);
    }
  }

  const stop = () => controller?.abort();
  const disabled = loading || cv.trim().length < 50;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Candidate CV</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste plain text. Minimum 50 characters.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            placeholder="Paste the CV here…"
            className="min-h-[260px] font-mono text-sm"
            disabled={loading}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-mono">{cv.length.toLocaleString()} characters</span>
            <div className="flex items-center gap-2">
              {loading ? (
                <Button variant="outline" onClick={stop}>
                  <Square className="h-3 w-3" />
                  Stop
                </Button>
              ) : (
                <Button onClick={handleAnalyze} disabled={disabled}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {analysis ? "Re-analyze" : "Analyze with Claude"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive text-base">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
            {error.includes("ANTHROPIC_API_KEY") && (
              <p className="text-xs text-muted-foreground mt-2">
                Add the env var in your Vercel project settings, then redeploy.
                EchoHire also works in mock mode when the key is absent — set{" "}
                <code className="font-mono">USE_MOCK_AI=true</code> for a deterministic demo.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {(analysis || loading) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analysis</span>
              {mode && (
                <span className={
                  "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border " +
                  (mode === "live"
                    ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                    : "border-amber-300 text-amber-700 bg-amber-50")
                }>
                  {mode === "live" ? "Claude · live" : "Mock mode"}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis ? (
              <>
                <Markdown content={analysis} />
                {loading && (
                  <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse ml-1 align-baseline" />
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
