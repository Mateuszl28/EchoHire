import type { Candidate, Job } from "./types";
import { newId } from "./storage";

// ─ Sample CVs (plausible, synthetic) ──────────────────────────────────────

const CV_AVA = `Ava Rosenberg
Senior Software Engineer · Berlin, DE · ava.rosenberg@example.io · linkedin.com/in/ava-r

SUMMARY
8 years building data infrastructure and developer tooling at high-growth SaaS companies.
Lead engineer on three production-grade systems; comfortable owning code from
prototype to 99.95% SLA.

EXPERIENCE
Senior Software Engineer · Stripe-like fintech "Tessera"  (2022-present, Berlin)
- Led the rewrite of the ledger event pipeline (Kafka → Flink), 50× throughput.
- Mentored 4 engineers; designed the team's PR review playbook (adopted org-wide).
- Drove SOC2 evidence collection for the data layer; passed audit clean.
- Stack: TypeScript, Python, Rust, Kafka, Flink, Postgres, Terraform.

Software Engineer · Datadog-like observability vendor "Pulse"  (2019-2022, Krakow)
- Built the high-cardinality metrics ingestion path (15M points/sec at peak).
- Authored the OpenTelemetry SDK for Go; merged upstream.
- On-call ~1 week / month; cut MTTR for ingestion incidents from 38m to 9m.

Junior Software Engineer · E-commerce platform "Brick"  (2017-2019, Warsaw)
- Shipped the first GraphQL gateway; designed schema reviews.
- Bootstrapped the FE team's Storybook + visual regression infrastructure.

EDUCATION
M.Sc. Computer Science, AGH UST, Krakow (2017)

SKILLS
TypeScript, Python, Rust, Go, Kafka, Flink, PostgreSQL, Kubernetes, Terraform,
OpenTelemetry, Datadog, GraphQL, gRPC, Linux internals.`;

const CV_KARAN = `Karan Patel
Engineering Manager · London, UK · karan.patel@example.io

PROFILE
Engineering manager with 11 years total experience (5 in IC, 6 in management).
Led teams of 4-12 engineers across SaaS, fintech, and biotech. Strongest at
forming new teams, levelling up senior ICs, and unblocking cross-functional work.

EXPERIENCE
Engineering Manager · HealthTech series-B "Lumora" (2023-present, London)
- Built and now leads the Patient Identity team (8 engineers, 2 squads).
- Owned the migration from monolithic Rails to a federated GraphQL platform.
- Quarterly hiring loop: 6 hires in 12 months, 0 regrettable departures.

Tech Lead Manager · Klarna-adjacent fintech (2020-2023, Stockholm)
- Coached two engineers to senior; one promoted to staff.
- Co-authored the post-incident review template, used company-wide.

Senior Engineer → Tech Lead · Adtech "Adelphi" (2014-2020, London)
- Built the bid-router (Go, 200k QPS).

EDUCATION
B.Eng. Computer Science, Imperial College London (2014)`;

const CV_LUDOVICA = `Ludovica Moretti
ML Researcher · Milan, IT · ludovica.m@example.io

OVERVIEW
PhD in computer vision (Politecnico di Milano, 2022). Two years in industry
research at a top robotics startup. Published 4 first-author papers (CVPR, ECCV,
NeurIPS). Strong applied math foundation; comfortable shipping production models
to embedded targets.

EXPERIENCE
Research Scientist · Robotics Unicorn "Helix.AI" (2023-present, Zurich)
- Lead author of the on-board perception stack (PyTorch → TensorRT, 30 fps).
- Cut the failure rate on dim-light obstacle detection by 47%.

Visiting Researcher · ETH Zurich Vision Lab (2022)
- Co-authored "Continuous Self-Supervised Depth", CVPR 2023.

EDUCATION
PhD Computer Vision · Politecnico di Milano (2022)
M.Sc. Engineering Mathematics, Politecnico di Milano (2018)

KEY SKILLS
PyTorch, JAX, CUDA, TensorRT, ROS2, embedded C++, classical CV, MLOps.`;

const CV_JONAS = `Jonas Weiss
Full-Stack Developer · Cologne, DE · j.weiss@example.io

ABOUT
Self-taught developer with 4 years building web products end-to-end. Most
energized by 0-to-1 product work and tight UI craft. Switching from agency life
to look for a product engineering role.

EXPERIENCE
Full-Stack Developer (contract) · UX-led agency "Nordlys" (2021-present, Cologne)
- Shipped ~15 client projects: marketing sites, dashboards, internal tools.
- TypeScript + Next.js + Postgres on most. Some React Native.
- Bootstrapped the agency's design-system package (Radix + shadcn-style tokens).

Junior Developer · Hyperlocal social app "Kiez" (2020-2021)
- Built the post-composer + feed; co-owned a 25 → 60k DAU growth window.

EDUCATION
No degree. Self-taught + community college (HTW Berlin, partial 2018-2019).

SKILLS
TypeScript, React, Next.js, PostgreSQL, Prisma, Tailwind CSS, Figma, design systems.`;

const CV_RACHEL = `Rachel Okonkwo
Junior Backend Engineer · Lagos, NG / remote · rachel.okonkwo@example.io

PROFILE
Backend-leaning developer, 2 years experience, looking for a remote-friendly
position on a mid-size team. Strong with API design, ergonomic tooling for
other developers, and writing tests first.

EXPERIENCE
Backend Engineer · Pan-African paytech "Korabox" (2023-present, Lagos)
- Owns the payouts microservice (Go, ~300 RPS). Built the idempotency layer.
- Migrated 4 services from Heroku to AWS ECS. Trimmed bill by 31%.

Software Engineering Intern · Open-source CDN "Lumen" (2022, remote)
- Wrote the rate-limiter spec accepted into the OSS core.

EDUCATION
B.Sc. Computer Science, University of Lagos (2023)`;

export function sampleCandidates(): Candidate[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: newId("cnd"),
      name: "Ava Rosenberg",
      title: "Senior Software Engineer",
      location: "Berlin, DE",
      email: "ava.rosenberg@example.io",
      status: "interview",
      createdAt: now - 4 * day,
      updatedAt: now - 2 * day,
      cv: CV_AVA,
      tags: ["data-infra", "kafka", "rust"],
      starred: true,
    },
    {
      id: newId("cnd"),
      name: "Karan Patel",
      title: "Engineering Manager",
      location: "London, UK",
      email: "karan.patel@example.io",
      status: "offer",
      createdAt: now - 7 * day,
      updatedAt: now - 12 * 60 * 60 * 1000,
      cv: CV_KARAN,
      tags: ["em", "leadership", "hiring"],
    },
    {
      id: newId("cnd"),
      name: "Ludovica Moretti",
      title: "ML Researcher",
      location: "Milan, IT",
      email: "ludovica.m@example.io",
      status: "screening",
      createdAt: now - 2 * day,
      updatedAt: now - 1 * day,
      cv: CV_LUDOVICA,
      tags: ["ml", "computer-vision", "robotics"],
    },
    {
      id: newId("cnd"),
      name: "Jonas Weiss",
      title: "Full-Stack Developer",
      location: "Cologne, DE",
      email: "j.weiss@example.io",
      status: "sourced",
      createdAt: now - 1 * day,
      updatedAt: now - 6 * 60 * 60 * 1000,
      cv: CV_JONAS,
      tags: ["full-stack", "design-systems", "agency"],
    },
    {
      id: newId("cnd"),
      name: "Rachel Okonkwo",
      title: "Junior Backend Engineer",
      location: "Lagos, NG · remote",
      email: "rachel.okonkwo@example.io",
      status: "screening",
      createdAt: now - 3 * day,
      updatedAt: now - 1 * day,
      cv: CV_RACHEL,
      tags: ["backend", "go", "fintech"],
    },
  ];
}

// ─ Sample Jobs ────────────────────────────────────────────────────────────

export function sampleJobs(): Job[] {
  const now = Date.now();
  return [
    {
      id: newId("job"),
      title: "Senior Backend Engineer · Data Platform",
      team: "Platform",
      location: "Remote (EU)",
      seniority: "senior",
      status: "open",
      description: `We're looking for a senior backend engineer to join the Data Platform team.
You'll own large parts of our streaming pipeline (Kafka, Flink, Postgres) and
work with the product teams to make their analytics fast and trustworthy.

The team is 6 engineers, fully remote in EU time zones. We're series-B, fintech-
adjacent, and the codebase is mostly TypeScript with critical paths in Rust.`,
      mustHave: [
        "5+ years backend",
        "Kafka or Flink in production",
        "Postgres at scale",
        "Strong code review culture",
      ],
      niceToHave: [
        "Rust",
        "On-call experience",
        "Observability tooling",
        "SOC2 / compliance work",
      ],
      createdAt: now - 6 * 24 * 60 * 60 * 1000,
      applicants: 47,
    },
    {
      id: newId("job"),
      title: "Engineering Manager · Patient Platform",
      team: "Engineering",
      location: "London, UK (hybrid)",
      seniority: "staff",
      status: "open",
      description: `Lead a team of 6-10 engineers building our patient identity layer.
You'll be expected to recruit, level-up ICs, and partner closely with product and
clinical operations. Domain experience in healthtech or fintech is a strong plus.

Reporting to the VP Eng. Equity-heavy comp.`,
      mustHave: [
        "5+ years managing engineers",
        "Hired and grown engineers",
        "Tech leadership on a platform",
      ],
      niceToHave: [
        "Healthtech or regulated industry",
        "Hands-on coding still encouraged",
      ],
      createdAt: now - 11 * 24 * 60 * 60 * 1000,
      applicants: 23,
    },
    {
      id: newId("job"),
      title: "Computer Vision Engineer",
      team: "Perception",
      location: "Zurich, CH (onsite preferred)",
      seniority: "mid",
      status: "open",
      description: `Join our perception team to ship real-time computer vision on resource-
constrained hardware. The role is heavy on PyTorch / TensorRT and embedded
C++. You'll work side-by-side with our research scientists to turn papers into
shipping models running on robots in production.`,
      mustHave: [
        "Strong CV / DL background",
        "PyTorch in production",
        "Embedded or constrained-resource deployment",
      ],
      niceToHave: [
        "TensorRT",
        "ROS2",
        "Research publication track record",
      ],
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      applicants: 18,
    },
    {
      id: newId("job"),
      title: "Product Engineer (Full-Stack)",
      team: "Product",
      location: "Remote / Berlin",
      seniority: "mid",
      status: "open",
      description: `Build front-end and back-end for our flagship product. You'll own
features end-to-end and pair with our design partner closely. The stack is
Next.js, Tailwind, PostgreSQL with Prisma. UI taste matters a lot.`,
      mustHave: [
        "3+ years shipping production web apps",
        "React / Next.js fluency",
        "Strong UI / UX taste",
      ],
      niceToHave: [
        "Design systems experience",
        "Comfortable in Figma",
      ],
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
      applicants: 64,
    },
  ];
}
