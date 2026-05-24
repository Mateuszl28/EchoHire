import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "EchoHire — AI-powered recruitment";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          color: "#0f172a",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          backgroundColor: "#ffffff",
          backgroundImage:
            "radial-gradient(900px 500px at 0% 0%, rgba(99, 102, 241, 0.16), transparent 60%), radial-gradient(800px 500px at 100% 0%, rgba(168, 85, 247, 0.16), transparent 60%), radial-gradient(700px 400px at 50% 110%, rgba(16, 185, 129, 0.12), transparent 60%)",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 900,
              color: "white",
              boxShadow: "0 0 40px rgba(99,102,241,0.45)",
            }}
          >
            E
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>
              EchoHire
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#64748b",
                letterSpacing: 4,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              AI-native ATS · v1.0
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(16,185,129,0.4)",
              color: "#047857",
              backgroundColor: "rgba(16,185,129,0.06)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#10b981",
                boxShadow: "0 0 10px #10b981",
              }}
            />
            Powered by Claude Sonnet 4.6
          </div>
        </div>

        <div
          style={{
            marginTop: 70,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 70,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -1.2,
              maxWidth: 1080,
              color: "#0f172a",
            }}
          >
            Turn CVs into
            <br />
            <span style={{ color: "#6366f1" }}>structured signal.</span>
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#475569",
              maxWidth: 1000,
              lineHeight: 1.35,
            }}
          >
            Streaming candidate analysis · interview prep kits · JD matching ·
            scorecards · side-by-side comparison — all in the browser.
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 24,
          }}
        >
          {[
            { v: "5",     l: "AI flows",          c: "#6366f1" },
            { v: "Live",  l: "Streaming",         c: "#a855f7" },
            { v: "6-axis",l: "Scorecards",        c: "#10b981" },
            { v: "0",     l: "Backend required",  c: "#f59e0b" },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                flex: 1,
                padding: "18px 22px",
                borderRadius: 14,
                background: "white",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                boxShadow: "0 6px 20px -10px rgba(15,23,42,0.18)",
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: s.c }}>
                {s.v}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 14,
            color: "#94a3b8",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          built with Next.js 15 · Anthropic SDK · prompt caching enabled
        </div>
      </div>
    ),
    { ...size }
  );
}
