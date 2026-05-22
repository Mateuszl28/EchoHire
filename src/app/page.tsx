import { CvAnalyzer } from "@/components/cv-analyzer";

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <header className="mb-12 text-center">
        <h1 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          EchoHire
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Paste a CV, get a structured recruiter-grade analysis in seconds.
          Powered by Claude.
        </p>
      </header>

      <CvAnalyzer />

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>
          MVP build. Drop a CV in the box above to see Claude&apos;s assessment.
        </p>
      </footer>
    </main>
  );
}
