# EchoHire

AI-powered recruitment assistant. Paste a candidate CV, get a structured analysis from Claude — strengths, gaps, suggested roles, and interview questions.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + lightweight shadcn/ui components
- **Anthropic Claude API** (`claude-sonnet-4-6`) with prompt caching on the system prompt

## Getting started

### 1. Install dependencies

```sh
npm install
```

### 2. Configure your Claude API key

Copy `.env.example` to `.env.local` and fill in your key:

```sh
cp .env.example .env.local
```

Get an API key at [console.anthropic.com](https://console.anthropic.com/).

### 3. Run the dev server

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project layout

```
src/
├── app/
│   ├── api/analyze-cv/route.ts   # POST endpoint that calls Claude
│   ├── globals.css               # Tailwind base + theme tokens
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/
│   ├── cv-analyzer.tsx           # Client component: form + result
│   └── ui/                       # Button, Card, Textarea (shadcn-style)
└── lib/utils.ts                  # cn() helper
```

## How it works

1. User pastes a CV into the textarea on `/`.
2. Client `POST`s the text to `/api/analyze-cv`.
3. The route calls Claude with a cached system prompt (5-minute TTL) that defines the recruiter persona and output structure.
4. Markdown analysis is returned and rendered.

## Roadmap

- [ ] PDF upload (parse to text server-side)
- [ ] Job-description matching (compare CV against role requirements)
- [ ] Candidate shortlist with scores
- [ ] Interview transcript analysis
- [ ] Auth + per-user history

## License

MIT.
