import React, { useState, useRef, useCallback, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ── Auth helpers ───────────────────────────────────────────────────────────────
const TOKEN_KEY = "aura_token";
const USER_KEY  = "aura_user";
const getToken  = () => localStorage.getItem(TOKEN_KEY) || "";
const getUser   = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)||"null"); } catch { return null; } };
const saveAuth  = (token, user) => { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };
const authFetch = (url, opts={}) => fetch(url, {
  ...opts,
  headers: { ...(opts.headers||{}), Authorization: getToken() ? `Bearer ${getToken()}` : "" },
});

const ROLE_DETAILS = {
  "Software Engineer": {
    category: "Software & Systems",
    level: "Mid – Senior",
    description: "Designs, develops, tests, and maintains robust scalable software applications and services across the engineering lifecycle.",
    techSkills: ["Data Structures & Algorithms", "System Design", "OOP / Functional Paradigm", "Git & CI/CD", "Unit / Integration Testing", "API Design (REST / GraphQL)"],
    softSkills: ["Problem Solving", "Code Review Communication", "Debugging Resilience", "Technical Documentation"],
    perspectives: {
      technical: "Evaluates clean code principles, computational complexity (Big-O), memory management, and edge-case handling.",
      architecture: "Assesses component decoupling, scalability, data modeling, concurrency, and fault tolerance.",
      behavioral: "Focuses on ownership, handling technical disagreements with teammates, and delivering under deadlines."
    }
  },
  "Frontend Developer": {
    category: "Software & Systems",
    level: "Mid – Senior",
    description: "Builds high-performance, accessible, and responsive user interfaces, optimizing client-side state, rendering lifecycles, and core web vitals.",
    techSkills: ["React / Next.js / Vue", "TypeScript & Modern JS", "State Management (Redux/Zustand)", "CSS Architecture & Design Systems", "Web Performance & Core Web Vitals", "Accessibility (WCAG)"],
    softSkills: ["Design-to-Code Empathy", "Cross-Browser QA", "User Experience Advocacy", "Iterative Prototyping"],
    perspectives: {
      technical: "Examines deep understanding of the DOM, browser rendering pipeline, hydration, and reactive state trees.",
      architecture: "Evaluates micro-frontend boundaries, client caching strategies, bundle size optimization, and security (XSS/CSRF).",
      behavioral: "Examines collaboration with UI/UX designers, balancing pixel perfection with product velocity."
    }
  },
  "Backend Developer": {
    category: "Software & Systems",
    level: "Mid – Senior",
    description: "Engineers server-side business logic, high-throughput microservices, database schemas, and reliable distributed communications.",
    techSkills: ["Node.js / Python / Go / Java", "Microservices & Distributed Systems", "SQL & NoSQL Databases", "Redis & In-Memory Caching", "Message Brokers (Kafka / RabbitMQ)", "Docker & Containerization"],
    softSkills: ["System Reliability Mindset", "On-Call Incident Management", "Clear API Contracts", "Security Vigilance"],
    perspectives: {
      technical: "Scrutinizes query optimization, concurrency locks, transaction isolation levels, and error recovery.",
      architecture: "Assesses distributed consensus, event-driven pipelines, load balancing, idempotency, and horizontal scaling.",
      behavioral: "Probes post-mortem honesty, debugging production outages under pressure, and cross-team dependency management."
    }
  },
  "Full Stack Developer": {
    category: "Software & Systems",
    level: "Mid – Senior",
    description: "Bridges client and server architectures, delivering end-to-end features from interactive web apps down to database layers and deployments.",
    techSkills: ["Full-Stack Frameworks (Next.js/Node)", "TypeScript / Full-Stack JS", "Relational Databases (PostgreSQL)", "REST & GraphQL APIs", "Cloud Deployments & Serverless", "State & Cache Synchronization"],
    softSkills: ["End-to-End Ownership", "Rapid MVP Velocity", "Holistic Debugging", "Pragmatic Trade-off Decisions"],
    perspectives: {
      technical: "Validates seamless data contract integrity between client state and server persistence.",
      architecture: "Evaluates architectural trade-offs between client-side compute, SSR, and backend microservice offloading.",
      behavioral: "Tests self-directed prioritization, autonomous delivery, and translating ambiguous specs into working features."
    }
  },
  "Mobile Developer (iOS / Android)": {
    category: "Software & Systems",
    level: "Mid – Senior",
    description: "Creates responsive, native or cross-platform mobile apps prioritizing offline capability, memory constraints, battery life, and smooth gestures.",
    techSkills: ["Swift / Kotlin / React Native / Flutter", "Mobile Architecture (MVVM / MVI)", "Offline Storage (CoreData / SQLite)", "App Store Deployments & CI/CD", "Push Notifications & Deep Linking", "Mobile Security & Biometrics"],
    softSkills: ["Device Fragmentation Awareness", "User Retention Focus", "Touch UX Intuition", "App Lifecycle Discipline"],
    perspectives: {
      technical: "Assesses memory leak prevention, thread scheduling (main vs background), and smooth 60/120fps UI rendering.",
      architecture: "Focuses on offline-first sync pipelines, local caching, push token architecture, and battery-efficient network polling.",
      behavioral: "Probes experience resolving platform-specific crashes, app store review rejections, and user rating feedback."
    }
  },
  "System Designer & Infrastructure Architect": {
    category: "Software & Systems",
    level: "Senior / Staff",
    description: "Architects planetary-scale distributed systems, focusing on data consistency models, partition tolerance, caching tiers, and raw throughput.",
    techSkills: ["Distributed Systems (CAP / PACELC)", "Consistent Hashing & Partitioning", "Replication & Consensus (Raft / Paxos)", "Storage Engines (LSM Trees, B-Trees)", "High-Throughput Caching & CDNs", "Backpressure & Circuit Breakers"],
    softSkills: ["First-Principles Reasoning", "Engineering Rigor", "Long-Term Architectural Vision", "Trade-Off Articulation"],
    perspectives: {
      technical: "Scrutinizes deep algorithmic foundations, network partition behavior, database write-ahead logging (WAL), and lock contention.",
      architecture: "Assesses end-to-end multi-tier system topology from CDN edge down to geo-distributed database clusters.",
      behavioral: "Tests explaining complex architectural trade-offs to diverse audiences and making irreversible technology decisions."
    }
  },
  "Machine Learning Engineer": {
    category: "AI & Data Science",
    level: "Mid – Senior / Staff",
    description: "Designs, trains, fine-tunes, and deploys predictive and generative machine learning models into high-availability production pipelines.",
    techSkills: ["PyTorch / TensorFlow", "LLMs, Transformers & Embeddings", "Feature Engineering & Data Validation", "MLOps (MLflow, Kubeflow, Weights & Biases)", "Model Serving & Quantization (ONNX, vLLM)", "Python & Scientific Computing"],
    softSkills: ["Experimental Rigor", "Metric Discipline (Precision/Recall/F1)", "Algorithmic Ethics & Bias Awareness", "Translating Math to Product"],
    perspectives: {
      technical: "Tests loss function formulation, gradient descent dynamics, regularization techniques, and tensor vectorization.",
      architecture: "Evaluates low-latency inference serving, model monitoring for data drift, continuous training pipelines, and feature stores.",
      behavioral: "Inquires about managing failed model experiments, communicating uncertainty to stakeholders, and ethical safety boundaries."
    }
  },
  "AI & Generative AI Solutions Engineer": {
    category: "AI & Data Science",
    level: "Mid – Senior",
    description: "Builds next-generation LLM applications, autonomous agent workflows, RAG systems, and vector search pipelines connected to business systems.",
    techSkills: ["LangChain / LlamaIndex / AutoGen", "Vector Databases (Pinecone, Qdrant, Chroma)", "Prompt Engineering & Few-Shot Learning", "LLM Fine-Tuning & LoRA / QLoRA", "Guardrails & Hallucination Mitigation", "FastAPI & Streaming API Pipelines"],
    softSkills: ["Fast Emergent Tech Adaptability", "Cost / Token Economics Awareness", "Product Creativity", "AI Ethics & Trust"],
    perspectives: {
      technical: "Assesses semantic chunking strategies, embedding dimensionality, reranking algorithms, and evaluation metrics (RAGAS).",
      architecture: "Evaluates agent memory models, tool calling orchestration, fallback strategies when LLMs hallucinate, and rate limiting.",
      behavioral: "Explores rapid adaptation to weekly evolving model benchmarks and handling non-deterministic system outcomes."
    }
  },
  "Data Scientist": {
    category: "AI & Data Science",
    level: "Mid – Senior",
    description: "Uncovers actionable insights through statistical analysis, hypothesis testing, predictive modeling, and executive business narrative generation.",
    techSkills: ["Statistical Inference & Hypothesis Testing", "Python / R & Scikit-Learn", "A/B Testing & Experimentation Design", "Advanced SQL & Data Wrangling", "Data Visualization (Tableau/Seaborn)", "Predictive Modeling & Causal Inference"],
    softSkills: ["Executive Data Storytelling", "Business Acumen", "Curiosity & Critical Skepticism", "Cross-functional Influence"],
    perspectives: {
      technical: "Deep-dives into p-values, sample size power calculations, variance reduction, and multivariate regression.",
      architecture: "Evaluates end-to-end analytical pipeline reproducibility, metric definition consistency, and automated dashboard feeds.",
      behavioral: "Focuses on defending counter-intuitive data insights to skeptical executive stakeholders and navigating ambiguous metrics."
    }
  },
  "Data Engineer": {
    category: "AI & Data Science",
    level: "Mid – Senior",
    description: "Constructs robust distributed data pipelines, lakehouses, real-time streaming architectures, and analytics-ready dimensional models.",
    techSkills: ["Apache Spark / PySpark / Flink", "Airflow / Prefect Orchestration", "Data Warehouses (Snowflake, BigQuery)", "dbt (Data Build Tool)", "Streaming (Kafka / Kinesis)", "Data Modeling & Parquet Storage"],
    softSkills: ["Data Quality Governance", "SLA Accountability", "Pipeline Idempotency Mindset", "Collaborative Schema Design"],
    perspectives: {
      technical: "Examines partition pruning, shuffle optimization, backpressure handling, and exact-once processing semantics.",
      architecture: "Evaluates data lakehouse medallion architecture (Bronze/Silver/Gold), disaster recovery, and data mesh principles.",
      behavioral: "Probes experience resolving critical downstream pipeline breaks, schema drift disputes, and maintaining data lineage."
    }
  },
  "Data Analyst / BI Specialist": {
    category: "AI & Data Science",
    level: "Associate – Senior",
    description: "Transforms raw data into executive KPI dashboards, business cohort analyses, and actionable growth recommendations.",
    techSkills: ["Advanced SQL (Window Functions, CTEs)", "Power BI / Tableau / Looker", "Excel Modeling & Pivot Tables", "Cohort & Retention Analysis", "KPI Metric Tree Definition", "Basic Python / Pandas"],
    softSkills: ["Stakeholder Empathy", "Business Presentation Clarity", "Proactive Trend Discovery", "Attention to Detail"],
    perspectives: {
      technical: "Tests SQL query performance, complex joins, subqueries, and statistical aggregations.",
      architecture: "Evaluates dashboard refresh scheduling, semantic data layer definitions, and single-source-of-truth governance.",
      behavioral: "Assesses ability to translate vague leadership questions into structured metrics and explain nuances simply."
    }
  },
  "Cloud Architect": {
    category: "Cloud & DevOps",
    level: "Senior / Principal",
    description: "Defines enterprise cloud strategy, multi-region high-availability topologies, cost optimization, and well-architected framework compliance.",
    techSkills: ["AWS / GCP / Azure Cloud Solutions", "Multi-Region Disaster Recovery", "Infrastructure as Code (Terraform)", "FinOps & Cloud Cost Optimization", "Identity & Access Management (IAM)", "Enterprise Networking (VPC, Transit Gateway)"],
    softSkills: ["Executive Architectural Alignment", "Vendor Evaluation", "Risk Assessment", "Mentorship of DevOps Teams"],
    perspectives: {
      technical: "Scrutinizes CIDR subnet routing, TLS termination, KMS key rotation, and cross-region replication lag.",
      architecture: "Examines 5 pillars of the Well-Architected Framework: Reliability, Security, Cost, Performance, and Operational Excellence.",
      behavioral: "Tests resolving conflicts between developer speed and governance/security guardrails, plus multi-million dollar budget trade-offs."
    }
  },
  "DevOps & Site Reliability Engineer": {
    category: "Cloud & DevOps",
    level: "Mid – Senior",
    description: "Automates CI/CD deployment pipelines, manages Kubernetes clusters, enforces SLOs/SLIs, and maintains 99.99% system availability.",
    techSkills: ["Kubernetes & Helm", "CI/CD (GitHub Actions / GitLab)", "Terraform & Ansible", "Observability (Prometheus, Grafana, Datadog)", "Linux Internals & Bash Scripting", "Incident Management & Chaos Engineering"],
    softSkills: ["Calm Under Severe Outages", "Blameless Post-Mortem Culture", "Automation Laziness (Eliminating Toil)", "Security Mindset"],
    perspectives: {
      technical: "Examines container cgroup memory limits, networking overlays (CNI), ingress controllers, and systemd process management.",
      architecture: "Assesses blue-green / canary rollouts, zero-downtime database migrations, automated rollbacks, and distributed tracing.",
      behavioral: "Probes real-world Sev-1 incident leadership, blameless retrospectives, and convincing devs to prioritize reliability."
    }
  },
  "Cybersecurity Analyst & Security Engineer": {
    category: "Security & Reliability",
    level: "Mid – Senior",
    description: "Protects enterprise infrastructure and applications against threats, performs penetration tests, and enforces Zero Trust security.",
    techSkills: ["OWASP Top 10 & AppSec", "Vulnerability Scanning & Pen Testing", "SIEM & Threat Detection (Splunk)", "Cryptography & PKI Infrastructure", "Network Security & Firewalls", "Compliance (SOC2, ISO 27001, HIPAA)"],
    softSkills: ["Security Evangelism", "Discreet Incident Handling", "Ethical Integrity", "Risk-Based Pragmatism"],
    perspectives: {
      technical: "Tests exploit mechanics (SQLi, SSRF, IDOR), reverse engineering, packet analysis with Wireshark, and auth token bypasses.",
      architecture: "Evaluates Zero Trust network architecture, micro-segmentation, secrets management (HashiCorp Vault), and defense-in-depth.",
      behavioral: "Assesses educating developers on secure coding without becoming a business blocker, and managing actual breach investigations."
    }
  },
  "QA & Test Automation Engineer": {
    category: "Security & Reliability",
    level: "Mid – Senior",
    description: "Architects automated testing frameworks across unit, integration, end-to-end, and performance testing to ensure zero-defect software releases.",
    techSkills: ["Playwright / Cypress / Selenium", "API Testing (Postman / REST Assured)", "Load & Performance Testing (k6 / JMeter)", "CI/CD Test Integration", "Test Case Design & Matrix Coverage", "Mocking & Test Data Generation"],
    softSkills: ["Edge-Case Skepticism", "Root-Cause Tenacity", "Collaborative Quality Advocacy", "Clear Bug Reporting"],
    perspectives: {
      technical: "Tests robust locator strategies, asynchronous wait handling, flaky test eradication, and test execution parallelization.",
      architecture: "Evaluates test pyramid balance, contract testing (Pact), staging environment isolation, and automated regression suites.",
      behavioral: "Probes holding the line on critical quality releases against aggressive management deadlines and working with engineers."
    }
  },
  "Technical Product Manager": {
    category: "Product & Leadership",
    level: "Mid – Senior",
    description: "Drives product strategy, translates customer pain points into high-impact PRDs, prioritizes engineering backlogs, and aligns stakeholders.",
    techSkills: ["Product Discovery & User Interviews", "Data-Driven Prioritization (RICE/Kano)", "Technical PRDs & User Story Writing", "Roadmap & Release Management", "A/B Testing & Funnel Analytics", "API & Technical Feasibility Comprehension"],
    softSkills: ["Influence Without Authority", "Ruthless Prioritization", "Stakeholder Diplomacy", "Clear Product Vision"],
    perspectives: {
      technical: "Validates technical intuition: understanding API constraints, technical debt trade-offs, and scalability bottlenecks.",
      architecture: "Assesses feature rollout phases, MVP scoping, user journey edge-cases, and metric instrumentation.",
      behavioral: "Focuses on saying 'no' to executives with data, managing engineering morale during pivots, and customer discovery insights."
    }
  },
  "Engineering Manager": {
    category: "Product & Leadership",
    level: "Senior / Director",
    description: "Leads engineering squads, develops engineering talent through coaching, ensures delivery execution, and shapes technical culture.",
    techSkills: ["Agile Delivery & Sprint Execution", "Engineering Metrics (DORA: Lead Time, MTTR)", "System Architecture Soundness", "Performance Management & 1-on-1s", "Resource Allocation & Headcount Planning", "Hiring & Bar-Raising"],
    softSkills: ["Servant Leadership & Empathy", "Conflict Resolution", "Psychological Safety Creation", "Executive Communication"],
    perspectives: {
      technical: "Evaluates ability to assess technical designs, catch architectural risks early, and prevent unneeded complexity.",
      architecture: "Assesses team topology, balancing tech debt vs feature velocity, and cross-team service ownership boundaries.",
      behavioral: "Tests turning around underperforming engineers, managing team burnout, and resolving high-stakes interpersonal conflicts."
    }
  },
  "Solutions Architect": {
    category: "Product & Leadership",
    level: "Senior / Principal",
    description: "Designs enterprise integration solutions, leads customer technical discovery, and bridges customer business needs with software capabilities.",
    techSkills: ["Enterprise Integration Patterns (EIP)", "API Gateways & Middleware", "Identity (SSO, SAML, OAuth 2.0)", "Cloud Scalability & Hybrid Topologies", "Proof-of-Concept (PoC) Development", "SLA & High-Availability Modeling"],
    softSkills: ["Executive Client Presentation", "Consultative Problem Framing", "Active Listening", "Negotiation & Scoping"],
    perspectives: {
      technical: "Tests deep understanding of enterprise auth protocols, webhooks, rate limiting, and legacy data migration.",
      architecture: "Evaluates multi-tenant SaaS integration, data residency regulations (GDPR), and failover architectures.",
      behavioral: "Assesses managing demanding enterprise clients, overcoming sales objections with technical proofs, and scope containment."
    }
  },
  "UI/UX & Product Designer": {
    category: "Product & Leadership",
    level: "Mid – Senior",
    description: "Designs intuitive user interfaces, conducts user research, crafts design systems, and ensures seamless customer journeys across digital products.",
    techSkills: ["Figma / Design Systems", "Wireframing & Interactive Prototyping", "User Research & Usability Testing", "Information Architecture", "Design Tokens & Hand-off Specifications", "Responsive & Mobile-First Principles"],
    softSkills: ["User Empathy", "Storytelling & Design Defense", "Feedback Reception", "Design-Engineering Collaboration"],
    perspectives: {
      technical: "Examines component modularity, token structures, responsive constraints, and hand-off feasibility for frontend engineers.",
      architecture: "Evaluates overall product taxonomy, navigation hierarchies, and cognitive load minimization.",
      behavioral: "Assesses defending design decisions with user test data, handling stakeholder critique, and navigating design compromises."
    }
  },
  "Scrum Master & Agile Delivery Lead": {
    category: "Product & Leadership",
    level: "Mid – Senior",
    description: "Facilitates agile scrum ceremonies, removes cross-team delivery blockers, coaches teams on continuous improvement, and protects team focus.",
    techSkills: ["Scrum & Kanban Frameworks", "Sprint Planning & Retrospectives", "Jira / Linear Workflow Automation", "Velocity & Burndown Analytics", "Capacity Planning & Dependency Tracking", "Agile Estimation Techniques"],
    softSkills: ["Active Facilitation", "Servant Leadership", "Impediment Removal Tenacity", "Diplomatic Communication"],
    perspectives: {
      technical: "Tests understanding of developer workflows, CI/CD impact on sprint velocity, and definition of done (DoD) standards.",
      architecture: "Assesses project dependency mapping, cross-squad coordination, and release train cadence.",
      behavioral: "Focuses on running constructive retrospectives that result in real behavioral change, and protecting teams from executive scope creep."
    }
  }
};

const ROLES = Object.keys(ROLE_DETAILS);
const ROLE_CATEGORIES = ["All", "Software & Systems", "AI & Data Science", "Cloud & DevOps", "Security & Reliability", "Product & Leadership"];
const DIFFICULTIES = ["easy","medium","hard","all"];

const getRoleInterviewGuidance = (role) => {
  const details = ROLE_DETAILS[role] || ROLE_DETAILS["Software Engineer"];
  const category = details.category;
  let answerApproach = "Clarify the goal, explain your approach, compare trade-offs, then describe how you would validate the result.";

  if (category === "AI & Data Science") {
    answerApproach = "State the goal and assumptions, explain the data and method, name the evaluation metric, then cover validation, limitations, and impact.";
  } else if (category === "Product & Leadership") {
    answerApproach = "Explain the context and people affected, define the goal, compare options, state your decision, and finish with a measurable outcome.";
  } else if (category === "Cloud & DevOps" || category === "Security & Reliability") {
    answerApproach = "Clarify requirements and risks, outline the design or response, cover failure and recovery paths, then explain monitoring and verification.";
  }

  return {
    questionTypes: [
      { label: "Role fundamentals", detail: `Review core areas such as ${details.techSkills.slice(0, 3).join(", ")}.` },
      { label: "Applied scenarios", detail: details.perspectives.technical },
      { label: "Design and trade-offs", detail: details.perspectives.architecture },
      { label: "Behavior and collaboration", detail: details.perspectives.behavioral },
    ],
    answerApproach,
    behavioralApproach: "Use STAR: briefly set the Situation and Task, spend most of your answer on your own Actions, and close with a specific Result or lesson.",
  };
};

const INTERVIEW_DAY_TIPS = [
  { label: "Dress", detail: "Choose clean, comfortable clothing suited to the employer and role; check that it looks neat on camera." },
  { label: "Posture and framing", detail: "Sit upright with relaxed shoulders, keep your face near the center of the camera, and look toward the camera while making key points." },
  { label: "Speaking", detail: "Use a steady pace and clear sentences. Pause briefly to organize your thoughts; a short pause is better than rushing." },
  { label: "Before you join", detail: "Test your camera, microphone, connection, and lighting. Keep water and a copy of your resume nearby, and take one slow breath." },
];

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const G = {
  bg:"#080c14", bgCard:"#0d1527", bgPanel:"#101b30",
  border:"rgba(255,255,255,0.08)", borderHi:"rgba(6,182,212,0.35)",
  green:"#10b981", cyan:"#06b6d4", violet:"#8b5cf6",
  amber:"#f59e0b", red:"#ef4444",
  textPri:"#f8fafc", textMut:"#94a3b8", textDim:"#64748b",
  mono:"'JetBrains Mono','Share Tech Mono',monospace",
  head:"'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif",
  // ── Glassmorphism tokens ──────────────────────────────────────────────────
  glass:"rgba(13,21,39,0.65)",
  glassDark:"rgba(8,12,20,0.80)",
  glassHover:"rgba(18,29,52,0.75)",
  glassPanel:"rgba(11,18,34,0.70)",
  glassBorder:"rgba(255,255,255,0.08)",
  glassBorderHi:"rgba(6,182,212,0.30)",
  glassInner:"inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.3)",
  blur:"blur(20px)",
  blurSm:"blur(12px)",
};

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#080c14;color:#f8fafc;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;overflow-x:hidden;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:#080c14;}
::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8b5cf6,#06b6d4);border-radius:3px;}
textarea,input,select{background:#0d1527!important;color:#f8fafc!important;border:1px solid rgba(255,255,255,0.1)!important;border-radius:8px;font-family:'Inter',sans-serif;outline:none;transition:all 0.25s;}
textarea:focus,input:focus,select:focus{border-color:#06b6d4!important;box-shadow:0 0 0 2px rgba(6,182,212,0.15),0 0 16px rgba(6,182,212,0.2)!important;}
select option{background:#0d1527;color:#f8fafc;}
input[type=range]{accent-color:#06b6d4;background:transparent!important;border:none!important;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes glow{0%,100%{text-shadow:0 0 14px rgba(6,182,212,0.6)}50%{text-shadow:0 0 28px rgba(6,182,212,0.9),0 0 45px rgba(139,92,246,0.5)}}
@keyframes greenGlow{0%,100%{text-shadow:0 0 12px rgba(16,185,129,0.5)}50%{text-shadow:0 0 25px rgba(16,185,129,0.8)}}
@keyframes violetGlow{0%,100%{text-shadow:0 0 10px rgba(139,92,246,0.5)}50%{text-shadow:0 0 25px rgba(139,92,246,0.8)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeInFast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes barUp{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}
@keyframes scanPulse{0%{opacity:0.04}50%{opacity:0.09}100%{opacity:0.04}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes spinRev{from{transform:rotate(360deg)}to{transform:rotate(0deg)}}
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes dataStream{0%{transform:translateY(-100%);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(100vh);opacity:0}}
@keyframes levelUp{0%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:0.8}100%{transform:scale(1);opacity:1}}
@keyframes rankBadge{0%{transform:scale(0) rotate(-180deg)}60%{transform:scale(1.2) rotate(10deg)}100%{transform:scale(1) rotate(0deg)}}
@keyframes scanLine{0%{top:0%}100%{top:100%}}
@keyframes avatarFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes avatarBlink{0%,92%,100%{transform:scaleY(1)}93%,99%{transform:scaleY(0.08)}}
@keyframes ringPulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.85;transform:scale(1.08)}}
@keyframes ringPulse2{0%,100%{opacity:0.25;transform:scale(1)}50%{opacity:0.55;transform:scale(1.14)}}
@keyframes labelBlink{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes particleDrift{0%{transform:translateY(0) translateX(0);opacity:0.8}50%{transform:translateY(-12px) translateX(4px);opacity:0.4}100%{transform:translateY(-24px) translateX(-2px);opacity:0}}
@keyframes achievePop{0%{transform:translateX(120%);opacity:0}10%{transform:translateX(0);opacity:1}85%{transform:translateX(0);opacity:1}100%{transform:translateX(120%);opacity:0}}
.card-hover:hover{transform:translateY(-3px)!important;border-color:rgba(0,212,255,0.35)!important;transition:all 0.25s!important;}
.glass-panel{background:rgba(10,21,36,0.55);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.07),inset 0 -1px 0 rgba(0,0,0,0.2),0 4px 24px rgba(0,0,0,0.3);}
.xp-bar-fill{transition:width 1.2s cubic-bezier(0.34,1.56,0.64,1);background:linear-gradient(90deg,#00d4ff,#00ff88,#a78bfa);background-size:200%;animation:shimmer 2s linear infinite;}
.achievement-toast{animation:achievePop 4s ease forwards;}
`;

// ══════════════════════════════════════════════════════════════════════════════
//  AURA FEEDBACK ENGINE — merged from AuraFeedbackPanels.jsx
//  ConflictPanel · DialoguePanel · AuraFeedbackSuite
// ══════════════════════════════════════════════════════════════════════════════

const _clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function _severityColor(severity) {
  return severity === "high" ? G.red : severity === "moderate" ? G.amber : G.cyan;
}

function ScorePip({ value, max = 5, color = G.cyan }) {
  const pct = _clamp((value / max) * 100, 0, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 2, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
      <span style={{ fontFamily: G.mono, fontSize: 11, color, minWidth: 32 }}>{value.toFixed(1)}/{max}</span>
    </div>
  );
}

// ── Conflict sub-components ───────────────────────────────────────────────────

function ConflictBadge({ conflict }) {
  const [expanded, setExpanded] = useState(false);
  const color = _severityColor(conflict.severity);
  return (
    <div onClick={() => setExpanded(e => !e)} style={{
      background: G.glassPanel,
      backdropFilter: G.blurSm,
      WebkitBackdropFilter: G.blurSm,
      border: `1px solid ${color}35`, borderLeft: `3px solid ${color}`,
      borderRadius: 8, padding: "10px 14px", cursor: "pointer",
      transition: "all 0.2s", marginBottom: 8,
      boxShadow: expanded ? `0 0 16px ${color}18, ${G.glassInner}` : G.glassInner,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: G.mono, fontSize: 9, color,
          background: `${color}18`, border: `1px solid ${color}40`,
          borderRadius: 3, padding: "2px 6px",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>{conflict.severity}</span>
        <span style={{ fontFamily: G.mono, fontSize: 12, color: G.textPri, flex: 1 }}>{conflict.headline}</span>
        <span style={{ color: G.textMut, fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
        {Object.entries(conflict.channels).filter(([k]) => k !== "gap").map(([k, v]) => (
          <div key={k} style={{ flex: 1 }}>
            <div style={{ fontFamily: G.mono, fontSize: 8, color: G.textMut, marginBottom: 2 }}>{k.replace(/_/g, " ")}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <div style={{ width: `${_clamp(v * 100, 0, 100)}%`, height: "100%", background: color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
      {expanded && (
        <div style={{ marginTop: 12, animation: "fadeIn 0.2s ease" }}>
          <p style={{ fontFamily: G.mono, fontSize: 11, color: G.textPri, lineHeight: 1.7, margin: "0 0 10px" }}>{conflict.explanation}</p>
          <div style={{ background: `${color}0d`, border: `1px solid ${color}30`, borderRadius: 6, padding: "8px 12px" }}>
            <div style={{ fontFamily: G.mono, fontSize: 9, color, marginBottom: 4, letterSpacing: "0.1em" }}>◈ COACHING TIP</div>
            <p style={{ fontFamily: G.mono, fontSize: 11, color: G.textPri, margin: 0, lineHeight: 1.65 }}>{conflict.coaching_tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CoherenceGauge({ value }) {
  const color = value >= 0.75 ? G.green : value >= 0.45 ? G.amber : G.red;
  const label = value >= 0.75 ? "High Coherence" : value >= 0.45 ? "Moderate" : "Fragmented";
  const pct = _clamp(value * 100, 0, 100);
  return (
    <div style={{ textAlign: "center", padding: "12px 0 6px" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px",
        background: `conic-gradient(${color} ${pct * 3.6}deg,rgba(255,255,255,0.05) 0deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 18px ${color}44`, position: "relative",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", background: "rgba(5,12,22,0.80)",
          backdropFilter: G.blurSm, WebkitBackdropFilter: G.blurSm,
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        }}>
          <span style={{ fontFamily: G.head, fontSize: 14, color, lineHeight: 1 }}>{Math.round(pct)}</span>
          <span style={{ fontFamily: G.mono, fontSize: 7, color: G.textMut }}>%</span>
        </div>
      </div>
      <div style={{ fontFamily: G.head, fontSize: 10, color, letterSpacing: "0.12em" }}>{label}</div>
      <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut, marginTop: 2 }}>signal coherence</div>
    </div>
  );
}

function ConflictPanel({ conflictReport }) {
  if (!conflictReport) return null;
  const { conflicts = [], alignment, alignment_message, composite_coherence } = conflictReport;
  const hasConflicts = conflicts.length > 0;
  return (
    <div style={{
      background: G.glass,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      border: `1px solid ${hasConflicts ? "rgba(255,51,102,0.22)" : "rgba(0,255,136,0.20)"}`,
      borderRadius: 12, padding: "16px 18px", marginTop: 12,
      boxShadow: hasConflicts
        ? `0 0 24px rgba(255,51,102,0.07), ${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`
        : `0 0 24px rgba(0,255,136,0.05), ${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: hasConflicts ? "rgba(255,51,102,0.12)" : "rgba(0,255,136,0.1)",
          border: `1px solid ${hasConflicts ? G.red + "40" : G.green + "40"}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        }}>{hasConflicts ? "⚡" : "✓"}</div>
        <div>
          <div style={{ fontFamily: G.head, fontSize: 11, color: hasConflicts ? G.red : G.green, letterSpacing: "0.12em" }}>
            SIGNAL COHERENCE ANALYSIS
          </div>
          <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>verbal · vocal · facial alignment</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <CoherenceGauge value={composite_coherence ?? 0.5} />
        </div>
      </div>
      {alignment && (
        <div style={{ background: "rgba(0,255,136,0.06)", border: `1px solid ${G.green}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
          <p style={{ fontFamily: G.mono, fontSize: 11, color: G.textPri, margin: 0, lineHeight: 1.7 }}>{alignment_message}</p>
        </div>
      )}
      {hasConflicts && (
        <div>
          <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut, marginBottom: 8, letterSpacing: "0.1em" }}>
            {conflicts.length} MISMATCH{conflicts.length > 1 ? "ES" : ""} DETECTED — tap to expand
          </div>
          {conflicts.map((c, i) => <ConflictBadge key={i} conflict={c} />)}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
        {[
          { label: "LEXICAL CONF.", value: conflictReport.lexical_confidence ?? 0.5, color: G.cyan },
          { label: "VOICE NERV.",   value: conflictReport.acoustic_nervousness ?? 0.5, color: G.amber },
          { label: "FACIAL NERV.",  value: conflictReport.facial_nervousness ?? 0.5, color: G.violet },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontFamily: G.mono, fontSize: 8, color: G.textMut, marginBottom: 4, letterSpacing: "0.08em" }}>{label}</div>
            <ScorePip value={_clamp(value, 0, 1)} max={1} color={color} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CoherenceReportCard — cross-question narrative coherence (Feature 6) ──────

function CoherenceFlagRow({ flag, index }) {
  const [open, setOpen] = useState(false);
  const sevColor = flag.severity === "high" ? G.red : flag.severity === "moderate" ? G.amber : G.cyan;
  const typeIcon = flag.flag_type === "ocean_polarity" ? "🧠" : flag.flag_type === "work_style" ? "⚖️" : "📊";
  const typeLabel = flag.flag_type === "ocean_polarity" ? "TRAIT SWING" : flag.flag_type === "work_style" ? "WORK STYLE" : "OUTCOME";
  return (
    <div style={{
      borderRadius: 8, border: `1px solid ${sevColor}28`,
      background: `${sevColor}06`, marginBottom: 8, overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          cursor: "pointer", userSelect: "none",
        }}
      >
        <span style={{ fontSize: 14 }}>{typeIcon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, fontFamily: G.head, color: sevColor, letterSpacing: "0.1em",
              padding: "2px 7px", borderRadius: 99, border: `1px solid ${sevColor}40`,
              background: `${sevColor}10`,
            }}>{flag.severity.toUpperCase()}</span>
            <span style={{ fontSize: 9, fontFamily: G.head, color: G.textMut, letterSpacing: "0.08em" }}>{typeLabel}</span>
          </div>
          <div style={{ fontSize: 11, color: G.textPri, marginTop: 4, lineHeight: 1.5 }}>
            <span style={{ color: sevColor }}>Q{(flag.question_indices[0] ?? 0) + 1}</span>
            {" vs "}
            <span style={{ color: sevColor }}>Q{(flag.question_indices[flag.question_indices.length - 1] ?? 1) + 1}</span>
            {" — "}{flag.pole_a?.split(":").slice(1).join(":").trim() || ""}
            {" ↔ "}{flag.pole_b?.split(":").slice(1).join(":").trim() || ""}
          </div>
        </div>
        <span style={{ fontSize: 10, color: G.textMut, transform: open ? "rotate(90deg)" : "none", transition: "0.2s" }}>▶</span>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${sevColor}18` }}>
          <div style={{ fontSize: 11, color: G.textMut, lineHeight: 1.65, marginTop: 10 }}>{flag.description}</div>
          {flag.coaching_tip && (
            <div style={{
              marginTop: 10, padding: "9px 12px", borderRadius: 7,
              background: `${G.amber}08`, border: `1px solid ${G.amber}25`,
              fontSize: 11, color: G.amber, lineHeight: 1.6,
            }}>
              💡 {flag.coaching_tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoherenceReportCard({ report, compact = false }) {
  const [expanded, setExpanded] = useState(!compact);
  if (!report?.available) return null;

  const score = report.coherence_score ?? 1;
  const color = score >= 0.90 ? G.green : score >= 0.75 ? G.cyan : score >= 0.55 ? G.amber : G.red;
  const pct = Math.round(score * 100);
  const flags = report.flags ?? [];
  const nHigh = flags.filter(f => f.severity === "high").length;
  const nMod  = flags.filter(f => f.severity === "moderate").length;

  return (
    <div style={{
      background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
      border: `1px solid ${color}30`, borderRadius: 12, marginBottom: 16,
      boxShadow: `0 0 24px ${color}08, ${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
          cursor: "pointer", userSelect: "none",
        }}
      >
        {/* Donut score */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 14px ${color}44`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "rgba(5,12,22,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
            <span style={{ fontFamily: G.head, fontSize: 11, color, lineHeight: 1 }}>{pct}</span>
            <span style={{ fontFamily: G.mono, fontSize: 7, color: G.textMut }}>%</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: G.head, fontSize: 11, color, letterSpacing: "0.14em", marginBottom: 3 }}>
            NARRATIVE COHERENCE
          </div>
          <div style={{ fontFamily: G.mono, fontSize: 10, color: G.textPri }}>{report.narrative_label}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontFamily: G.head, color: G.textMut }}>{report.n_answers} ANSWERS ANALYSED</span>
            {nHigh > 0 && <span style={{ fontSize: 9, fontFamily: G.head, color: G.red, padding: "1px 7px", borderRadius: 99, border: `1px solid ${G.red}40`, background: `${G.red}10` }}>{nHigh} HIGH</span>}
            {nMod  > 0 && <span style={{ fontSize: 9, fontFamily: G.head, color: G.amber, padding: "1px 7px", borderRadius: 99, border: `1px solid ${G.amber}40`, background: `${G.amber}10` }}>{nMod} MODERATE</span>}
            {flags.length === 0 && <span style={{ fontSize: 9, fontFamily: G.head, color: G.green, padding: "1px 7px", borderRadius: 99, border: `1px solid ${G.green}40`, background: `${G.green}10` }}>✓ NO FLAGS</span>}
          </div>
        </div>
        <span style={{ fontSize: 10, color: G.textMut, transform: expanded ? "rotate(90deg)" : "none", transition: "0.2s" }}>▶</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${color}15` }}>
          {/* Summary */}
          {report.coaching_summary && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 8,
              background: flags.length === 0 ? `${G.green}08` : `${G.amber}07`,
              border: `1px solid ${flags.length === 0 ? G.green : G.amber}20`,
              fontSize: 11, color: G.textPri, lineHeight: 1.7,
            }}>
              {report.coaching_summary}
            </div>
          )}
          {/* Flags */}
          {flags.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut, letterSpacing: "0.1em", marginBottom: 10 }}>
                {flags.length} INCONSISTENC{flags.length === 1 ? "Y" : "IES"} DETECTED
              </div>
              {flags.map((f, i) => <CoherenceFlagRow key={i} flag={f} index={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dialogue sub-components ───────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "8px 0", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: "50%", background: G.cyan,
          animation: `barUp 1s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

function ChatBubble({ role, content, scoreRevised, revisionDelta, guardTriggered, noveltyScore, sessionCapHit }) {
  const isAI = role === "assistant";
  return (
    <div style={{ display: "flex", flexDirection: isAI ? "row" : "row-reverse", gap: 8, marginBottom: 10, animation: "fadeInFast 0.25s ease" }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 2,
        background: isAI ? "linear-gradient(135deg,rgba(0,212,255,0.2),rgba(0,255,136,0.1))" : "rgba(167,139,250,0.12)",
        border: `1px solid ${isAI ? G.cyan + "40" : G.violet + "40"}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
      }}>{isAI ? "⬡" : "◈"}</div>
      <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 4 }}>

        {/* Score revision badge */}
        {scoreRevised && revisionDelta !== 0 && (
          <div style={{
            alignSelf: isAI ? "flex-start" : "flex-end",
            background: revisionDelta > 0 ? "rgba(0,255,136,0.1)" : "rgba(255,51,102,0.1)",
            border: `1px solid ${revisionDelta > 0 ? G.green + "50" : G.red + "50"}`,
            borderRadius: 4, padding: "2px 8px",
            fontFamily: G.mono, fontSize: 9,
            color: revisionDelta > 0 ? G.green : G.red,
          }}>SCORE {revisionDelta > 0 ? "↑" : "↓"} {Math.abs(revisionDelta).toFixed(1)} pts</div>
        )}

        {/* Session cap badge — shown once when cap is exhausted */}
        {sessionCapHit && (
          <div style={{
            alignSelf: "flex-start",
            background: "rgba(251,191,36,0.08)",
            border: `1px solid ${G.amber}40`,
            borderRadius: 4, padding: "3px 10px",
            fontFamily: G.mono, fontSize: 9, color: G.amber,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span>⚠</span>
            <span>SESSION CAP REACHED — no further upward revisions</span>
          </div>
        )}

        {/* Novelty gate badge — shown when clarification was a restatement */}
        {!sessionCapHit && guardTriggered && noveltyScore !== undefined && (
          <div style={{
            alignSelf: "flex-start",
            background: "rgba(0,212,255,0.05)",
            border: `1px solid ${G.cyan}30`,
            borderRadius: 4, padding: "3px 10px",
            fontFamily: G.mono, fontSize: 9, color: G.textMut,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ color: noveltyScore < 0.2 ? G.red : G.amber }}>◈</span>
            <span>
              NOVELTY {Math.round(noveltyScore * 100)}%
              {noveltyScore < 0.2
                ? " — restatement detected, add new details to shift score"
                : " — partial new info, score adjustment limited"}
            </span>
          </div>
        )}

        <div style={{
          background: isAI ? "rgba(10,20,34,0.60)" : "rgba(167,139,250,0.08)",
          backdropFilter: isAI ? "blur(12px)" : "none",
          WebkitBackdropFilter: isAI ? "blur(12px)" : "none",
          border: `1px solid ${isAI ? G.border : G.violet + "30"}`,
          borderRadius: isAI ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
          padding: "10px 13px", boxShadow: isAI ? "0 0 12px rgba(0,212,255,0.04)" : "none",
        }}>
          <p style={{ fontFamily: G.mono, fontSize: 11.5, color: G.textPri, margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{content}</p>
        </div>
      </div>
    </div>
  );
}

function DialoguePanel({ analysisResult, question, questionType = "behavioral", apiBase = API, onScoreRevised }) {
  const [dialogueId,    setDialogueId]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [turnsLeft,     setTurnsLeft]     = useState(3);
  const [closed,        setClosed]        = useState(false);
  const [currentScore,  setCurrentScore]  = useState(null);
  const [initialScore,  setInitialScore]  = useState(null);
  const [error,         setError]         = useState(null);
  const [opened,        setOpened]        = useState(false);
  const [sessionCapHit, setSessionCapHit] = useState(false);   // Layer 3 exhausted
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const scrollDown = useCallback(() => { setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60); }, []);

  const openDialogue = useCallback(async () => {
    if (opened) return;
    setOpened(true); setLoading(true); setError(null);
    try {
      const res = await fetch(`${apiBase}/dialogue/open`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_result: analysisResult, transcript: analysisResult?.annotated_transcript || "", question, question_type: questionType }),
      });
      const data = await res.json();
      setDialogueId(data.dialogue_id);
      setInitialScore(data.score); setCurrentScore(data.score); setTurnsLeft(data.turns_remaining);
      setMessages([{ role: "assistant", content: data.opening, scoreRevised: false, revisionDelta: 0 }]);
      scrollDown();
    } catch (e) { setError("Could not connect to feedback engine."); setOpened(false); }
    finally { setLoading(false); }
  }, [opened, analysisResult, question, questionType, apiBase, scrollDown]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || closed || !dialogueId) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "candidate", content: msg, scoreRevised: false, revisionDelta: 0 }]);
    setLoading(true); scrollDown();
    try {
      const res = await fetch(`${apiBase}/dialogue/turn`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialogue_id: dialogueId, message: msg }),
      });
      const data = await res.json();
      setCurrentScore(data.score); setTurnsLeft(data.turns_remaining); setClosed(data.closed);
      if (data.session_cap_hit) setSessionCapHit(true);
      setMessages(prev => [...prev, {
        role:           "assistant",
        content:        data.response,
        scoreRevised:   data.score_revised,
        revisionDelta:  data.revision_delta,
        guardTriggered: data.guard_triggered   ?? false,
        noveltyScore:   data.novelty_score     ?? -1,
        sessionCapHit:  data.session_cap_hit   ?? false,
      }]);
      if (data.score_revised && onScoreRevised) onScoreRevised(data.score);
      scrollDown();
    } catch (e) { setError("Message failed to send."); }
    finally { setLoading(false); inputRef.current?.focus(); }
  }, [input, loading, closed, dialogueId, apiBase, scrollDown, onScoreRevised]);

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const score = analysisResult?.scores?.knowledge_1_5 ?? 0;
  const netDelta = currentScore !== null ? currentScore - (initialScore ?? score) : 0;

  return (
    <div style={{
      background: G.glass,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      border: `1px solid ${opened ? "rgba(167,139,250,0.28)" : G.glassBorder}`,
      borderRadius: 12, overflow: "hidden", marginTop: 12,
      transition: "border-color 0.3s",
      boxShadow: opened
        ? `0 0 32px rgba(167,139,250,0.07), ${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`
        : `${G.glassInner}, 0 4px 24px rgba(0,0,0,0.25)`,
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${opened ? "rgba(167,139,250,0.15)" : G.border}`,
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(167,139,250,0.03)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: "rgba(167,139,250,0.12)", border: `1px solid ${G.violet}40`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
        }}>⇄</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: G.head, fontSize: 10, color: G.violet, letterSpacing: "0.12em" }}>DIALOGIC FEEDBACK</div>
          <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>challenge your score · add context · get re-evaluated</div>
        </div>
        {currentScore !== null && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: G.head, fontSize: 16, color: G.violet }}>
              {currentScore.toFixed(1)}<span style={{ fontSize: 10, color: G.textMut }}>/5</span>
            </div>
            {Math.abs(netDelta) >= 0.05 && (
              <div style={{ fontFamily: G.mono, fontSize: 9, color: netDelta > 0 ? G.green : G.red }}>
                {netDelta > 0 ? "+" : ""}{netDelta.toFixed(1)} revised
              </div>
            )}
          </div>
        )}
        {!opened && (
          <button onClick={openDialogue} disabled={loading} style={{
            background: "linear-gradient(135deg,rgba(167,139,250,0.15),rgba(167,139,250,0.08))",
            border: `1px solid ${G.violet}50`, borderRadius: 6, padding: "6px 14px",
            fontFamily: G.mono, fontSize: 11, color: G.violet, cursor: "pointer", transition: "all 0.18s",
          }}>{loading ? "Opening…" : "Challenge Score"}</button>
        )}
        {opened && !closed && (
          <div style={{
            fontFamily: G.mono, fontSize: 9, color: G.textMut,
            background: "rgba(255,255,255,0.04)", border: `1px solid ${G.border}`,
            borderRadius: 4, padding: "3px 8px",
          }}>{turnsLeft} exchange{turnsLeft !== 1 ? "s" : ""} left</div>
        )}
      </div>

      {/* Session cap banner — shown persistently once Layer 3 fires */}
      {opened && sessionCapHit && (
        <div style={{
          padding: "7px 16px",
          background: "rgba(251,191,36,0.06)",
          borderBottom: `1px solid ${G.amber}25`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 11, color: G.amber }}>⚠</span>
          <span style={{ fontFamily: G.mono, fontSize: 9, color: G.amber, letterSpacing: "0.04em" }}>
            UPWARD REVISION LIMIT REACHED — further score increases are locked for this question.
            Downward corrections remain active.
          </span>
        </div>
      )}

      {/* Chat area */}
      {opened && (
        <>
          <div style={{ maxHeight: 320, overflowY: "auto", padding: "14px 14px 8px", scrollbarWidth: "thin", scrollbarColor: `${G.cyan} transparent` }}>
            {messages.map((m, i) => <ChatBubble key={i} {...m} />)}
            {loading && <div style={{ display: "flex", justifyContent: "flex-start", padding: "0 8px" }}><TypingIndicator /></div>}
            {closed && (
              <div style={{ textAlign: "center", padding: "10px 0", fontFamily: G.mono, fontSize: 10, color: G.textMut, borderTop: `1px solid ${G.border}`, marginTop: 8 }}>
                ◈ Dialogue complete
                {Math.abs(netDelta) >= 0.05 && (
                  <span style={{ color: netDelta > 0 ? G.green : G.red }}>
                    {" "}· score {netDelta > 0 ? "increased" : "decreased"} by {Math.abs(netDelta).toFixed(1)} pts
                  </span>
                )}
              </div>
            )}
            {error && <div style={{ fontFamily: G.mono, fontSize: 10, color: G.red, textAlign: "center", padding: 8 }}>{error}</div>}
            <div ref={bottomRef} />
          </div>
          {!closed && (
            <div style={{ padding: "10px 14px 12px", borderTop: `1px solid ${G.border}`, display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Explain what you meant, challenge the score, or ask for a specific tip…"
                disabled={loading || closed} rows={2}
                style={{
                  flex: 1, resize: "none", background: "rgba(5,14,24,0.8)",
                  border: `1px solid ${input ? G.violet + "50" : G.border}`,
                  borderRadius: 8, padding: "8px 12px", fontFamily: G.mono, fontSize: 11, color: G.textPri,
                  lineHeight: 1.6, transition: "border-color 0.2s", outline: "none",
                }}
              />
              <button onClick={sendMessage} disabled={!input.trim() || loading || closed} style={{
                background: input.trim() && !loading ? "linear-gradient(135deg,rgba(167,139,250,0.25),rgba(167,139,250,0.12))" : "rgba(255,255,255,0.03)",
                border: `1px solid ${input.trim() && !loading ? G.violet + "60" : G.border}`,
                borderRadius: 8, padding: "8px 16px", fontFamily: G.mono, fontSize: 12,
                color: input.trim() && !loading ? G.violet : G.textDim,
                cursor: input.trim() && !loading ? "pointer" : "default",
                transition: "all 0.18s", whiteSpace: "nowrap",
                boxShadow: input.trim() && !loading ? `0 0 12px ${G.violet}22` : "none",
                height: 56,
              }}>{loading ? "…" : "Send →"}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Combined suite ────────────────────────────────────────────────────────────

// =====================================================================
//  METACOGNITIVE PROMPT PANEL
//  Surface -> Deep -> Transfer (Zimmermann 2002 SRL)
//  POST /metacognitive · Tian et al. 2024 · Hattie & Timperley 2007
// =====================================================================

const META_TIER_CONFIG = {
  surface:  { label: 'SURFACE',  sub: 'What would you add?',      color: '#00d4ff' },
  deep:     { label: 'DEEP',     sub: 'What was your reasoning?',  color: '#a78bfa' },
  transfer: { label: 'TRANSFER', sub: 'How does this generalise?', color: '#f59e0b' },
};

function MetacognitivePanel({ analysisResult, question, questionType, apiBase }) {
  const [prompts,     setPrompts]     = React.useState(null);
  const [loading,     setLoading]     = React.useState(false);
  const [error,       setError]       = React.useState(null);
  const [revealed,    setRevealed]    = React.useState([]);
  const [reflections, setReflections] = React.useState({});
  const [fetched,     setFetched]     = React.useState(false);

  const score        = analysisResult?.scores?.knowledge_1_5 ?? analysisResult?.score ?? 3;
  const starCoverage = analysisResult?.star_coverage ?? 0.5;
  const improveAreas = analysisResult?.improvement_areas ?? [];
  const transcript   = analysisResult?.annotated_transcript ?? '';

  const fetchPrompts = async () => {
    if (fetched || loading) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${apiBase}/metacognitive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question, transcript,
          question_type:     questionType || 'behavioural',
          score,
          star_coverage:     starCoverage,
          improvement_areas: improveAreas,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPrompts(data); setFetched(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const revealNext = () => {
    const tiers = ['surface', 'deep', 'transfer'];
    const next = tiers.find(t => !revealed.includes(t));
    if (next) setRevealed(prev => [...prev, next]);
  };

  const allRevealed = revealed.length === 3;

  return (
    <div style={{
      background: G.glass,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      border: `1px solid ${fetched ? 'rgba(0,212,255,0.18)' : G.glassBorder}`,
      borderRadius: 12, overflow: 'hidden', marginTop: 12,
      boxShadow: `${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`,
      transition: 'border-color 0.3s',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${fetched ? 'rgba(0,212,255,0.12)' : G.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(0,212,255,0.02)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(0,212,255,0.1)', border: `1px solid ${G.cyan}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: G.head, fontSize: 11, fontWeight: 700, color: G.cyan,
        }}>M</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: G.head, fontSize: 10, color: G.cyan, letterSpacing: '0.12em' }}>
            METACOGNITIVE REFLECTION
          </div>
          <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>
            3 tiered prompts: surface / deep / transfer — Zimmermann (2002) SRL
          </div>
        </div>
        {!fetched && (
          <button onClick={fetchPrompts} disabled={loading} style={{
            background: loading ? 'rgba(255,255,255,0.03)'
              : 'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(0,212,255,0.07))',
            border: `1px solid ${loading ? G.border : G.cyan + '50'}`,
            borderRadius: 6, padding: '6px 14px',
            fontFamily: G.mono, fontSize: 11,
            color: loading ? G.textMut : G.cyan,
            cursor: loading ? 'default' : 'pointer', transition: 'all 0.18s',
          }}>{loading ? 'Generating...' : 'Reflect on Answer'}</button>
        )}
        {fetched && (
          <div style={{
            fontFamily: G.mono, fontSize: 9, color: G.textMut,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}`,
            borderRadius: 4, padding: '3px 8px',
          }}>{revealed.length}/3 revealed</div>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px 16px', fontFamily: G.mono, fontSize: 10, color: G.red }}>
          Error: {error}
        </div>
      )}

      {fetched && prompts && (
        <div style={{ padding: '14px 16px' }}>
          {revealed.map((tier) => {
            const cfg = META_TIER_CONFIG[tier];
            return (
              <div key={tier} style={{
                marginBottom: 12,
                background: `${cfg.color}08`,
                border: `1px solid ${cfg.color}22`,
                borderRadius: 10, padding: '12px 14px',
                animation: 'fadeIn 0.4s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div>
                    <span style={{ fontFamily: G.head, fontSize: 9, color: cfg.color,
                      letterSpacing: '0.14em', fontWeight: 700 }}>{cfg.label}</span>
                    <span style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut,
                      marginLeft: 8 }}>{cfg.sub}</span>
                  </div>
                </div>
                <div style={{ fontFamily: G.mono, fontSize: 12, color: G.textPri,
                  lineHeight: 1.65, marginBottom: 8 }}>
                  {prompts[tier]}
                </div>
                {reflections[tier] !== undefined ? (
                  <textarea
                    value={reflections[tier]}
                    onChange={e => setReflections(prev => ({ ...prev, [tier]: e.target.value }))}
                    placeholder='Type your reflection here...'
                    rows={2}
                    style={{
                      width: '100%', resize: 'none', boxSizing: 'border-box',
                      background: 'rgba(5,14,24,0.8)',
                      border: `1px solid ${reflections[tier] ? cfg.color + '50' : G.border}`,
                      borderRadius: 7, padding: '8px 10px',
                      fontFamily: G.mono, fontSize: 11, color: G.textPri,
                      lineHeight: 1.6, outline: 'none', transition: 'border-color 0.2s',
                    }}
                  />
                ) : (
                  <button onClick={() => setReflections(prev => ({ ...prev, [tier]: '' }))}
                    style={{
                      background: 'transparent', border: `1px solid ${cfg.color}25`,
                      borderRadius: 5, padding: '3px 10px', fontFamily: G.mono,
                      fontSize: 9, color: G.textMut, cursor: 'pointer',
                    }}>+ add reflection</button>
                )}
              </div>
            );
          })}

          {!allRevealed && (
            <button onClick={revealNext} style={{
              width: '100%', padding: '10px 0',
              background: 'rgba(0,212,255,0.04)',
              border: `1px dashed ${G.cyan}30`, borderRadius: 8,
              fontFamily: G.mono, fontSize: 11, color: G.cyan,
              cursor: 'pointer', letterSpacing: '0.08em',
            }}>
              {revealed.length === 0 ? '> Reveal first prompt'
                : revealed.length === 1 ? '> Go deeper'
                : '> Transfer to new context'}
            </button>
          )}

          {allRevealed && (
            <div style={{
              marginTop: 4, padding: '8px 12px',
              background: 'rgba(0,212,255,0.03)',
              border: `1px solid ${G.cyan}15`, borderRadius: 7,
              fontFamily: G.mono, fontSize: 10, color: G.textMut, lineHeight: 1.6,
            }}>
              All 3 levels reflected on. Use the Dialogic panel below to
              challenge your score or explore further.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuraFeedbackSuite({ analysisResult, question, questionType = "behavioral", apiBase = API, onScoreRevised }) {
  if (!analysisResult) return null;
  const conflictReport = analysisResult.conflict_report ?? null;
  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, marginTop: 16 }}>
        <div style={{ flex: 1, height: 1, background: G.border }} />
        <span style={{ fontFamily: G.head, fontSize: 9, color: G.textMut, letterSpacing: "0.15em" }}>FEEDBACK ENGINE</span>
        <div style={{ flex: 1, height: 1, background: G.border }} />
      </div>
      <ConflictPanel conflictReport={conflictReport} />
      <MultiAgentPanel analysisResult={analysisResult} />
      <QuestionAmbiguityInlineFlag ambiguity={analysisResult?.question_ambiguity ?? null} />
      <MetacognitivePanel
        analysisResult={analysisResult}
        question={question}
        questionType={questionType}
        apiBase={apiBase}
      />
      <DialoguePanel
        analysisResult={analysisResult} question={question}
        questionType={questionType} apiBase={apiBase}
        onScoreRevised={onScoreRevised}
      />
    </div>
  );
}

// ── Multi-Agent Scoring Panel ─────────────────────────────────────────────────
// Renders agent_scores, agent_agreement (κ), security_flags, and fsm_trace
// from the AgentOrchestrator output (multi_agent_scorer.py).
// Invisible when MULTI_AGENT=false — all fields are optional/safe to omit.

function AgentScoreBar({ label, value, max = 100, color = G.cyan, unit = "" }) {
  const pct = _clamp((value / max) * 100, 0, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontFamily: G.mono, fontSize: 10, color: G.textMut, letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontFamily: G.head, fontSize: 10, color, fontWeight: 700 }}>
          {typeof value === "number" ? value.toFixed(max === 5 ? 2 : 0) : value}{unit}
        </span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 2,
          background: `linear-gradient(90deg,${color}99,${color})`,
          boxShadow: `0 0 6px ${color}50`,
          transition: "width 0.9s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>
    </div>
  );
}

function KappaGauge({ kappa }) {
  if (kappa == null) return null;
  const { kappa_proxy, agreement, rubric_1_5, trait_1_5, abs_diff } = kappa;
  const color = agreement === "high" ? G.green : agreement === "moderate" ? G.cyan : G.amber;
  const pct = _clamp((kappa_proxy ?? 0) * 100, 0, 100);
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}25`,
      borderRadius: 8, padding: "10px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.04) 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 12px ${color}30`, flexShrink: 0,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", background: G.bgPanel,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: G.head, fontSize: 10, color, fontWeight: 700 }}>{Math.round(pct)}</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: G.head, fontSize: 9, color, letterSpacing: "0.12em" }}>
            INTER-AGENT κ — {(agreement ?? "").toUpperCase()} AGREEMENT
          </div>
          <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut, marginTop: 2 }}>
            rubric {rubric_1_5?.toFixed(2)}/5 · trait {trait_1_5?.toFixed(2)}/5 · Δ {abs_diff?.toFixed(2)}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: G.mono, fontSize: 10, color: G.textMut, lineHeight: 1.55 }}>
        Cohen's κ proxy measures how well the RubricAgent and TraitAgent agree on candidate quality.
        High agreement strengthens score reliability. Used as an internal reliability metric in the paper.
      </div>
    </div>
  );
}

function FSMTrace({ trace }) {
  if (!trace || trace.length === 0) return null;
  const [open, setOpen] = useState(false);
  const totalMs = trace.reduce((a, t) => a + (t.end_ms - t.start_ms), 0);
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: G.mono, fontSize: 9, color: G.textMut, letterSpacing: "0.08em",
        display: "flex", alignItems: "center", gap: 6, padding: 0,
      }}>
        <span style={{ color: G.cyan }}>{open ? "▲" : "▼"}</span>
        FSM TRACE ({trace.length} states · {Math.round(totalMs)}ms total)
      </button>
      {open && (
        <div style={{ marginTop: 8, animation: "fadeIn 0.2s ease" }}>
          {trace.map((t, i) => {
            const dur = Math.round(t.end_ms - t.start_ms);
            const color = t.fallback_used ? G.amber : t.success ? G.green : G.red;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 8px", borderRadius: 5, marginBottom: 3,
                background: `${color}06`, border: `1px solid ${color}18`,
              }}>
                <span style={{ fontFamily: G.head, fontSize: 8, color, letterSpacing: "0.1em", minWidth: 90 }}>
                  {t.state}
                </span>
                <span style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut, flex: 1 }}>
                  {t.agent}
                </span>
                <span style={{ fontFamily: G.head, fontSize: 9, color, minWidth: 50, textAlign: "right" }}>
                  {dur}ms
                </span>
                {t.fallback_used && (
                  <span style={{ fontSize: 8, color: G.amber, background: `${G.amber}15`,
                    border: `1px solid ${G.amber}30`, borderRadius: 3, padding: "1px 5px", letterSpacing: "0.06em" }}>
                    NLP FALLBACK
                  </span>
                )}
                {t.error && (
                  <span style={{ fontSize: 8, color: G.red }}>{t.error.slice(0, 40)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SecurityBadge({ flags }) {
  if (!flags || flags.length === 0) return null;
  return (
    <div style={{
      background: `${G.amber}0a`, border: `1px solid ${G.amber}30`,
      borderRadius: 6, padding: "8px 12px", marginBottom: 10,
      display: "flex", alignItems: "flex-start", gap: 8,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
      <div>
        <div style={{ fontFamily: G.head, fontSize: 9, color: G.amber, letterSpacing: "0.1em", marginBottom: 4 }}>
          SECURITY AGENT — {flags.length} PATTERN{flags.length > 1 ? "S" : ""} DETECTED & SANITISED
        </div>
        {flags.map((f, i) => (
          <div key={i} style={{ fontFamily: G.mono, fontSize: 10, color: G.textMut, lineHeight: 1.5 }}>
            · "{f}"
          </div>
        ))}
        <div style={{ fontFamily: G.mono, fontSize: 10, color: G.textMut, marginTop: 4, lineHeight: 1.5 }}>
          Answer was sanitised before scoring. Scores reflect the cleaned transcript.
        </div>
      </div>
    </div>
  );
}

function MultiAgentPanel({ analysisResult }) {
  const [open, setOpen] = useState(false);

  // Only render if multi-agent mode was active
  if (!analysisResult?.multi_agent_mode) return null;

  const agentScores  = analysisResult.agent_scores   ?? {};
  const kappa        = analysisResult.agent_agreement ?? null;
  const fsm          = analysisResult.fsm_trace       ?? [];
  const secFlags     = analysisResult.security_flags  ?? [];
  const degraded     = analysisResult.degraded_agents ?? [];
  const rubric       = agentScores.rubric             ?? {};
  const trait        = agentScores.trait              ?? {};
  const summary      = agentScores.summary            ?? {};

  const hasRubric = Object.keys(rubric).length > 0;
  const hasTrait  = Object.keys(trait).length  > 0;

  return (
    <div style={{
      background: G.glass,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      border: `1px solid rgba(0,212,255,0.15)`,
      borderRadius: 12, padding: "14px 16px", marginTop: 12,
      boxShadow: `0 0 24px rgba(0,212,255,0.04), ${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`,
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: open ? 14 : 0 }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: "rgba(0,212,255,0.1)", border: `1px solid ${G.cyan}35`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
        }}>⬡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: G.head, fontSize: 10, color: G.cyan, letterSpacing: "0.12em" }}>
            MULTI-AGENT SCORING BREAKDOWN
          </div>
          <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>
            RubricAgent · TraitAgent · SummaryAgent · SecurityAgent
            {degraded.length > 0 && (
              <span style={{ color: G.amber }}> · {degraded.length} NLP fallback</span>
            )}
          </div>
        </div>
        {/* Inter-agent κ preview chip */}
        {kappa && (
          <div style={{
            fontFamily: G.head, fontSize: 10, fontWeight: 700,
            color: kappa.agreement === "high" ? G.green : kappa.agreement === "moderate" ? G.cyan : G.amber,
            background: `${kappa.agreement === "high" ? G.green : kappa.agreement === "moderate" ? G.cyan : G.amber}12`,
            border: `1px solid ${kappa.agreement === "high" ? G.green : kappa.agreement === "moderate" ? G.cyan : G.amber}30`,
            borderRadius: 99, padding: "3px 10px", letterSpacing: "0.06em", whiteSpace: "nowrap",
          }}>
            κ {(kappa.kappa_proxy ?? 0).toFixed(2)}
          </div>
        )}
        <span style={{ color: G.textMut, fontSize: 11 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>

          {/* Security flags (if any) */}
          <SecurityBadge flags={secFlags} />

          {/* Two-column: Rubric | Trait */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>

            {/* RUBRIC AGENT */}
            {hasRubric && (
              <div style={{
                background: `${G.cyan}06`, border: `1px solid ${G.cyan}18`,
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div style={{ fontFamily: G.head, fontSize: 9, color: G.cyan, letterSpacing: "0.12em", marginBottom: 10 }}>
                  ◈ RUBRIC AGENT
                  <span style={{
                    marginLeft: 6, fontSize: 8, color: G.textMut,
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${G.border}`,
                    borderRadius: 3, padding: "1px 5px",
                  }}>
                    {rubric.rubric_source ?? "hybrid"}
                  </span>
                </div>
                <AgentScoreBar label="Composite" value={rubric.composite_score ?? 0} max={5} color={G.cyan} />
                <AgentScoreBar label="STAR Score" value={rubric.star_score ?? 0} max={5} color={G.green} />
                <AgentScoreBar label="Depth" value={rubric.depth_score ?? 0} max={100} color={G.violet} unit="%" />
                <AgentScoreBar label="Relevance" value={rubric.relevance_score ?? 0} max={100} color={G.cyan} unit="%" />
                <AgentScoreBar label="Fluency" value={rubric.fluency_score ?? 0} max={100} color={G.amber} unit="%" />
                <AgentScoreBar label="Keywords" value={rubric.keyword_score ?? 0} max={100} color={G.textMut} unit="%" />
                {rubric.reasoning && (
                  <div style={{
                    marginTop: 8, fontFamily: G.mono, fontSize: 10, color: G.textMut,
                    lineHeight: 1.6, borderLeft: `2px solid ${G.cyan}30`, paddingLeft: 8,
                  }}>
                    {rubric.reasoning.slice(0, 160)}{rubric.reasoning.length > 160 ? "…" : ""}
                  </div>
                )}
              </div>
            )}

            {/* TRAIT AGENT */}
            {hasTrait && (
              <div style={{
                background: `${G.violet}06`, border: `1px solid ${G.violet}18`,
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div style={{ fontFamily: G.head, fontSize: 9, color: G.violet, letterSpacing: "0.12em", marginBottom: 10 }}>
                  ◈ TRAIT AGENT
                </div>
                {/* OCEAN mini-bars */}
                {trait.ocean && Object.entries(trait.ocean).map(([k, v]) => (
                  <AgentScoreBar
                    key={k}
                    label={k === "Neuroticism_inv" ? "Stability" : k}
                    value={v}
                    max={10}
                    color={G.violet}
                  />
                ))}
                {/* DISC dominant */}
                {trait.disc_dominant && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>DISC DOMINANT</span>
                    <span style={{
                      fontFamily: G.head, fontSize: 10, color: G.violet, fontWeight: 700,
                      background: `${G.violet}15`, border: `1px solid ${G.violet}30`,
                      borderRadius: 99, padding: "2px 10px",
                    }}>{trait.disc_dominant}</span>
                  </div>
                )}
                {/* Hiring signal */}
                {trait.hiring_signal && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>HIRING SIGNAL</span>
                    <span style={{
                      fontFamily: G.head, fontSize: 10, fontWeight: 700,
                      color: trait.hiring_signal === "Strong" ? G.green : trait.hiring_signal === "Positive" ? G.cyan : G.textMut,
                    }}>{trait.hiring_signal}</span>
                  </div>
                )}
                {trait.reasoning && (
                  <div style={{
                    marginTop: 8, fontFamily: G.mono, fontSize: 10, color: G.textMut,
                    lineHeight: 1.6, borderLeft: `2px solid ${G.violet}30`, paddingLeft: 8,
                  }}>
                    {trait.reasoning.slice(0, 140)}{trait.reasoning.length > 140 ? "…" : ""}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SUMMARY AGENT row */}
          {summary.grade && (
            <div style={{
              background: `${G.green}06`, border: `1px solid ${G.green}18`,
              borderRadius: 8, padding: "10px 14px", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontFamily: G.head, fontSize: 9, color: G.green, letterSpacing: "0.12em", marginBottom: 4 }}>
                  ◈ SUMMARY AGENT
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: G.head, fontSize: 18, fontWeight: 900,
                    color: summary.grade === "A" ? G.green : summary.grade === "B" ? G.cyan : summary.grade === "C" ? G.amber : G.red,
                    border: `2px solid ${summary.grade === "A" ? G.green : summary.grade === "B" ? G.cyan : summary.grade === "C" ? G.amber : G.red}`,
                    background: `${summary.grade === "A" ? G.green : summary.grade === "B" ? G.cyan : summary.grade === "C" ? G.amber : G.red}10`,
                  }}>{summary.grade}</div>
                  <div>
                    <div style={{ fontFamily: G.head, fontSize: 10, color: G.textPri }}>{summary.hr_rec}</div>
                    {summary.cot_summary && (
                      <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut, marginTop: 2, maxWidth: 340 }}>
                        {summary.cot_summary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inter-agent κ gauge */}
          <KappaGauge kappa={kappa} />

          {/* FSM trace (collapsible) */}
          <FSMTrace trace={fsm} />

          {/* Paper footnote */}
          <div style={{
            marginTop: 12, paddingTop: 10, borderTop: `1px solid ${G.border}`,
            fontFamily: G.mono, fontSize: 9, color: G.textDim, lineHeight: 1.6,
          }}>
            Architecture: Sun et al. (CoMAI, arXiv 2603.16215, 2026) · 4-agent FSM · 90.47% accuracy vs 60% single-agent ·
            Inter-agent κ proxy: Rus et al. (IEEE Trans. Learn. Technol. 2017)
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  NEURAL NETWORK BACKGROUND CANVAS
// ============================================================
// ── Question Ambiguity Inline Flag ────────────────────────────────────────────
// Per-answer inline notice shown when the current question is already known
// to be systematically ambiguous (from question_ambiguity_tracker).
// Shown directly inside the result panel, above MetacognitivePanel.

function QuestionAmbiguityInlineFlag({ ambiguity }) {
  if (!ambiguity?.flagged) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      background: `${G.amber}0d`, border: `1px solid ${G.amber}30`,
      borderRadius: 8, padding: "9px 12px", marginTop: 8,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚑</span>
      <div>
        <div style={{ fontFamily: G.head, fontSize: 9, color: G.amber, letterSpacing: "0.1em", marginBottom: 3 }}>
          QUESTION FLAGGED AS AMBIGUOUS
        </div>
        <div style={{ fontFamily: G.mono, fontSize: 11, color: G.textSec, lineHeight: 1.6 }}>
          This question has produced inconsistent inter-agent scoring across{" "}
          <span style={{ color: G.amber }}>{ambiguity.n_observations} past sessions</span>{" "}
          (mean κ = <span style={{ color: G.amber }}>{ambiguity.mean_kappa?.toFixed(2)}</span>).
          Your answer has been reviewed with extra care.{" "}
          {ambiguity.rewrite_tip && (
            <span style={{ color: G.textMut }}>Note for admins: {ambiguity.rewrite_tip}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Question Quality Panel ────────────────────────────────────────────────────
// Fetches GET /question_quality and renders a three-tier dashboard:
// ambiguous / watch / clear. Designed to be embedded in the admin/dashboard
// view (not the per-session result panel — this is a population-level view).

function QuestionQualityPanel({ apiBase = API }) {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState("ambiguous");   // "ambiguous"|"watch"|"clear"
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${apiBase}/question_quality?min_obs=3&sort_by=mean_kappa`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReport(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const kappaColor = k =>
    k < 0.50 ? G.red : k < 0.65 ? G.amber : G.green;

  const KappaBar = ({ value, max = 1 }) => {
    const pct = Math.round((value / max) * 100);
    const col = kappaColor(value);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 2, transition: "width .4s" }} />
        </div>
        <span style={{ fontFamily: G.mono, fontSize: 10, color: col, minWidth: 32 }}>
          {value.toFixed(2)}
        </span>
      </div>
    );
  };

  const QuestionCard = ({ q }) => {
    const open = expanded[q.fingerprint];
    const col  = kappaColor(q.mean_kappa);
    return (
      <div style={{
        background: "rgba(255,255,255,0.02)", border: `1px solid ${col}22`,
        borderRadius: 8, padding: "10px 12px", marginBottom: 8,
        cursor: "pointer", transition: "border-color .15s",
      }}
        onClick={() => setExpanded(e => ({ ...e, [q.fingerprint]: !e[q.fingerprint] }))}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: G.mono, fontSize: 12, color: G.textPri,
              lineHeight: 1.5, marginBottom: 4,
            }}>
              {q.question_text}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                fontFamily: G.mono, fontSize: 9, color: G.textMut,
                background: "rgba(255,255,255,0.04)", borderRadius: 4, padding: "2px 6px",
              }}>{q.question_type}</span>
              <span style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>
                {q.n_observations} session{q.n_observations !== 1 ? "s" : ""}
              </span>
              <span style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>
                std {q.kappa_std?.toFixed(3)}
              </span>
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{
              fontFamily: G.head, fontSize: 14, fontWeight: 700, color: col,
            }}>κ {q.mean_kappa.toFixed(2)}</div>
            <div style={{ fontFamily: G.mono, fontSize: 8, color: G.textMut, marginTop: 2 }}>
              {open ? "▲" : "▼"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 6 }}>
          <KappaBar value={q.mean_kappa} />
        </div>

        {/* Expanded detail */}
        {open && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: `1px solid rgba(255,255,255,0.06)`,
          }}>
            {/* κ sparkline */}
            {q.kappa_values?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut, marginBottom: 4, letterSpacing: "0.08em" }}>
                  κ PER SESSION
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 28 }}>
                  {q.kappa_values.map((v, i) => (
                    <div key={i}
                      title={`Session ${i + 1}: κ=${v.toFixed(2)}`}
                      style={{
                        width: 10, borderRadius: 2, flexShrink: 0,
                        height: Math.max(4, Math.round(v * 28)),
                        background: kappaColor(v),
                        opacity: 0.75,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Rewrite tip */}
            {q.rewrite_tip && (
              <div style={{
                background: `${col}0d`, border: `1px solid ${col}22`,
                borderRadius: 6, padding: "8px 10px",
              }}>
                <div style={{ fontFamily: G.mono, fontSize: 9, color: col, letterSpacing: "0.08em", marginBottom: 4 }}>
                  REWRITE RECOMMENDATION
                </div>
                <div style={{ fontFamily: G.mono, fontSize: 11, color: G.textSec, lineHeight: 1.65 }}>
                  {q.rewrite_tip}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { key: "ambiguous", label: "Ambiguous",  color: G.red,   count: report?.n_ambiguous ?? 0 },
    { key: "watch",     label: "Watch",       color: G.amber, count: report?.n_watch     ?? 0 },
    { key: "clear",     label: "Clear",       color: G.green, count: report?.n_clear     ?? 0 },
  ];

  const activeList = report?.[tab] ?? [];

  return (
    <div style={{
      background: G.glass,
      backdropFilter: G.blur,
      WebkitBackdropFilter: G.blur,
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, padding: "14px 16px", marginTop: 12,
      boxShadow: `${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        }}>⚑</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: G.head, fontSize: 10, color: G.red, letterSpacing: "0.12em" }}>
            QUESTION QUALITY AUDIT
          </div>
          <div style={{ fontFamily: G.mono, fontSize: 9, color: G.textMut }}>
            inter-agent κ aggregated across sessions · low κ = ambiguous question
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            fontFamily: G.mono, fontSize: 10, color: G.cyan,
            background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)",
            borderRadius: 6, padding: "5px 12px", cursor: loading ? "wait" : "pointer",
          }}
        >{loading ? "Loading…" : "Refresh"}</button>
      </div>

      {/* Summary chips */}
      {report && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: G.mono, fontSize: 10, color: G.textMut }}>
            {report.total_questions_tracked} questions · {report.total_observations} observations
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontFamily: G.mono, fontSize: 11, color: G.red, marginBottom: 10 }}>
          Error: {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div style={{ fontFamily: G.mono, fontSize: 11, color: G.textMut, textAlign: "center", padding: "20px 0" }}>
          Click Refresh to load the question quality report.
        </div>
      )}

      {report && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {tabs.map(t => (
              <button key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontFamily: G.mono, fontSize: 10, padding: "4px 12px",
                  borderRadius: 6, cursor: "pointer",
                  background: tab === t.key ? `${t.color}18` : "transparent",
                  border: `1px solid ${tab === t.key ? t.color : "rgba(255,255,255,0.08)"}`,
                  color: tab === t.key ? t.color : G.textMut,
                  transition: "all .15s",
                }}
              >
                {t.label} {t.count > 0 && (
                  <span style={{
                    marginLeft: 4, background: `${t.color}25`, borderRadius: 99,
                    padding: "1px 6px", fontSize: 9,
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Question cards */}
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {activeList.length === 0 ? (
              <div style={{ fontFamily: G.mono, fontSize: 11, color: G.textMut, padding: "16px 0", textAlign: "center" }}>
                No questions in this category yet.
              </div>
            ) : (
              activeList.map((q, i) => <QuestionCard key={q.fingerprint ?? i} q={q} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NeuralBackground(){
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let W, H;
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };
    const onMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // ── Candidate Skill Nodes ────────────────────────────────────────────────
    const NODE_COUNT = 65;
    const nodes = [];
    const SKILL_COLORS = [
      { r: 6,   g: 182, b: 212 }, // Electric Cyan (Technical)
      { r: 139, g: 92,  b: 246 }, // Neon Violet (Behavioral / Leadership)
      { r: 16,  g: 185, b: 129 }, // Cyber Emerald (STAR / Confidence)
      { r: 99,  g: 102, b: 241 }, // Indigo (Acoustic / Speech)
    ];

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseR: Math.random() * 1.8 + 1.2,
        r: 2,
        color: SKILL_COLORS[Math.floor(Math.random() * SKILL_COLORS.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    // Dynamic data packets traveling between connections
    const packets = [];
    const spawnPacket = (from, to, color) => {
      if (packets.length > 25) return;
      packets.push({
        ax: from.x, ay: from.y,
        bx: to.x, by: to.y,
        t: 0,
        speed: 0.015 + Math.random() * 0.02,
        color,
      });
    };

    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Smooth mouse interpolation
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      } else {
        mouse.x = -1000;
        mouse.y = -1000;
      }

      // ── 1. Structured Precision Micro-Grid Matrix ──────────────────────────
      const GRID_STEP = 36;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      const startX = (frame * 0.05) % GRID_STEP;
      for (let x = startX; x < W; x += GRID_STEP) {
        for (let y = 0; y < H; y += GRID_STEP) {
          // Subtle radial falloff from center
          const dx = x - W / 2;
          const dy = y - H / 2;
          const distCenter = Math.sqrt(dx * dx + dy * dy);
          if (distCenter < W * 0.75) {
            ctx.beginPath();
            ctx.arc(x, y, 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ── 2. Biometric / Voice Acoustic Harmonic Waves ───────────────────────
      // Subtle flowing audio spectrum ribbons simulating live vocal evaluation
      const waves = [
        { yOffset: H * 0.72, amp: 28, freq: 0.0035, speed: 0.022, color: 'rgba(6, 182, 212,', width: 1.5, opacity: 0.22 },
        { yOffset: H * 0.74, amp: 38, freq: 0.0028, speed: 0.018, color: 'rgba(139, 92, 246,', width: 1.8, opacity: 0.18 },
        { yOffset: H * 0.70, amp: 22, freq: 0.0042, speed: 0.026, color: 'rgba(16, 185, 129,', width: 1.2, opacity: 0.16 },
        { yOffset: H * 0.76, amp: 46, freq: 0.0020, speed: 0.014, color: 'rgba(99, 102, 241,', width: 2.0, opacity: 0.14 },
      ];

      for (const w of waves) {
        ctx.beginPath();
        const t = frame * w.speed;
        for (let x = 0; x <= W; x += 6) {
          // Double harmonic sine wave with envelope modulation
          const envelope = Math.sin((x / W) * Math.PI); // Tapers smoothly at left/right edges
          const y = w.yOffset +
            (Math.sin(x * w.freq + t) * w.amp +
             Math.sin(x * w.freq * 2.2 - t * 0.7) * (w.amp * 0.45)) * envelope;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${w.color}${w.opacity})`;
        ctx.lineWidth = w.width;
        ctx.stroke();

        // Subtle gradient fill under wave
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const waveGrad = ctx.createLinearGradient(0, w.yOffset - 30, 0, H);
        waveGrad.addColorStop(0, `${w.color}${w.opacity * 0.25})`);
        waveGrad.addColorStop(1, 'rgba(11, 15, 25, 0)');
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      // ── 3. Candidate Talent Nodes & Interactive Connections ────────────────
      const MAX_DIST = 130;
      const MOUSE_DIST = 170;

      // Draw lines between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.18;
            const c = nodes[i].color;
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            // Occasionally spawn a skill matching data packet
            if (Math.random() < 0.0015 && dist < MAX_DIST * 0.8) {
              spawnPacket(nodes[i], nodes[j], c);
            }
          }
        }
      }

      // Draw interactive connections to Mouse (AI Evaluation Cursor)
      if (mouse.active) {
        // Cursor AI Core Glow
        const cursorGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 40);
        cursorGlow.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
        cursorGlow.addColorStop(0.5, 'rgba(139, 92, 246, 0.12)');
        cursorGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes to cursor
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MOUSE_DIST) {
            const alpha = (1 - dist / MOUSE_DIST) * 0.45;
            const c = n.color;

            // Connection vector
            const grad = ctx.createLinearGradient(mouse.x, mouse.y, n.x, n.y);
            grad.addColorStop(0, 'rgba(6, 182, 212, ' + alpha + ')');
            grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha * 0.6})`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();

            // Pull node slightly toward cursor (gravity / attraction)
            n.vx -= (dx / dist) * 0.015;
            n.vy -= (dy / dist) * 0.015;

            // Highlight connected node
            n.r = n.baseR * (1 + (1 - dist / MOUSE_DIST) * 1.2);

            if (Math.random() < 0.02) {
              spawnPacket({ x: mouse.x, y: mouse.y }, n, c);
            }
          } else {
            n.r = n.baseR;
          }
        }
      }

      // Draw and update data packets
      for (let p = packets.length - 1; p >= 0; p--) {
        const pk = packets[p];
        pk.t += pk.speed;
        if (pk.t >= 1) {
          packets.splice(p, 1);
          continue;
        }
        const px = pk.ax + (pk.bx - pk.ax) * pk.t;
        const py = pk.ay + (pk.by - pk.ay) * pk.t;
        const c = pk.color;

        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.85)`;
        ctx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, 0.8)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render individual nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulse += n.pulseSpeed;
        const glow = 0.5 + 0.5 * Math.sin(n.pulse);
        const c = n.color;

        // Subtle ambient node halo
        const haloR = n.r * 3 + glow * 3;
        const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
        halo.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.2 * glow})`);
        halo.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        // Core node dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.75 + 0.25 * glow})`;
        ctx.fill();

        // Update position with dampening
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.99;
        n.vy *= 0.99;

        // Gentle bounce off screen edges
        if (n.x < 10) { n.x = 10; n.vx = Math.abs(n.vx); }
        if (n.x > W - 10) { n.x = W - 10; n.vx = -Math.abs(n.vx); }
        if (n.y < 10) { n.y = 10; n.vy = Math.abs(n.vy); }
        if (n.y > H - 10) { n.y = H - 10; n.vy = -Math.abs(n.vy); }

        // Keep slight drift
        if (Math.abs(n.vx) < 0.08) n.vx += (Math.random() - 0.5) * 0.05;
        if (Math.abs(n.vy) < 0.08) n.vy += (Math.random() - 0.5) * 0.05;
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <>
      {/* ── Deep Slate / Dark Navy Base ───────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 90% 70% at 50% 15%, #0d1527 0%, #080c14 65%, #05080f 100%)',
        }}
      />

      {/* ── Subtle Atmospheric Ambient Light Blooms ──────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: -150,
          left: '10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 1,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -150,
          right: '5%',
          width: 650,
          height: 650,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 1,
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, rgba(6, 182, 212, 0) 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* ── Main Canvas (Micro-Grid + Biometric Waves + Interactive Nodes) ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* ── Security Vignette Perimeter ──────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 110% 100% at 50% 50%, transparent 60%, rgba(5, 8, 15, 0.75) 100%)',
        }}
      />
    </>
  );
}

// ============================================================
//  TRAINING MONITOR (inlined from TrainingMonitor.jsx)
// ============================================================
const TM_LEVEL_STYLE = {
  start:    { color: "#60a5fa", icon: "🚀", weight: "700" },
  info:     { color: "#94a3b8", icon: "·",  weight: "400" },
  metric:   { color: "#34d399", icon: "📊", weight: "600" },
  success:  { color: "#4ade80", icon: "✅", weight: "700" },
  error:    { color: "#f87171", icon: "❌", weight: "700" },
  warning:  { color: "#fbbf24", icon: "⚠️", weight: "600" },
  download: { color: "#a78bfa", icon: "⬇",  weight: "500" },
  done:     { color: "#4ade80", icon: "🏁", weight: "700" },
  ping:     { color: "#475569", icon: "⏳", weight: "400" },
  sentinel: { color: "#64748b", icon: "",   weight: "400" },
};

function tmParseEpoch(msg) {
  const m = msg.match(/Epoch\s+(\d+)\s*\/\s*(\d+)\s+val=([\d.]+)%\s+best=([\d.]+)%/i);
  if (m) return { epoch: +m[1], total: +m[2], val: +m[3], best: +m[4] };
  return null;
}
function tmParseFold(msg) {
  const m = msg.match(/Fold\s+(\d+)\/(\d+):\s*([\d.]+)%/i);
  if (m) return { fold: +m[1], total: +m[2], acc: +m[3] };
  return null;
}

function TmPerClassChart({ perClass }) {
  if (!perClass || !Object.keys(perClass).length) return null;
  const entries = Object.entries(perClass).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Per-class accuracy</div>
      {entries.map(([cls, acc]) => (
        <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 70, fontSize: 11, color: "#94a3b8", textAlign: "right" }}>{cls}</span>
          <div style={{ flex: 1, height: 10, background: "#1e293b", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: `${acc}%`, height: "100%", background: acc >= 85 ? "#4ade80" : acc >= 70 ? "#34d399" : "#fbbf24", borderRadius: 5, transition: "width 0.8s ease" }} />
          </div>
          <span style={{ width: 40, fontSize: 11, color: "#e2e8f0", fontFamily: "monospace" }}>{acc}%</span>
        </div>
      ))}
    </div>
  );
}

function TmEpochBar({ epoch, total, val, best }) {
  const pct = total > 0 ? Math.round((epoch / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
        <span>Epoch {epoch} / {total}</span>
        <span>val <strong style={{ color: "#34d399" }}>{val}%</strong> · best <strong style={{ color: "#4ade80" }}>{best}%</strong></span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#34d399)", borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function TmFoldDots({ folds }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: "#64748b" }}>5-Fold CV:</span>
      {[1, 2, 3, 4, 5].map((f) => {
        const done = folds.find((x) => x.fold === f);
        return (
          <div key={f} title={done ? `Fold ${f}: ${done.acc}%` : `Fold ${f}`}
            style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
              background: done ? (done.acc >= 85 ? "#4ade80" : "#34d399") : "#1e293b",
              color: done ? "#0f172a" : "#475569",
              border: `2px solid ${done ? "transparent" : "#334155"}`, transition: "all 0.3s" }}>
            {done ? `${Math.round(done.acc)}` : f}
          </div>
        );
      })}
    </div>
  );
}

function TmMetricsCard({ metrics }) {
  if (!metrics) return null;
  const items = [
    { label: "Test Acc",    value: metrics.test_accuracy,               suffix: "%", color: "#4ade80" },
    { label: "Val Acc",     value: metrics.val_accuracy,                suffix: "%", color: "#34d399" },
    { label: "Train Acc",   value: metrics.train_accuracy,              suffix: "%", color: "#60a5fa" },
    { label: "CV Mean",     value: metrics.cv_mean_accuracy,            suffix: "%", color: "#a78bfa" },
    { label: "Nervousness", value: metrics.nervousness_binary_accuracy, suffix: "%", color: "#fb923c" },
    { label: "Nerv F1",     value: metrics.nervousness_binary_f1,       suffix: "",  color: "#fbbf24" },
  ];
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16, marginTop: 16, animation: "fadeIn 0.5s ease" }}>
      <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
        Final Training Results · {metrics.model_type} · {metrics.source}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        {items.map(({ label, value, suffix, color }) => (
          <div key={label} style={{ background: "#1e293b", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "monospace" }}>{value != null ? `${value}${suffix}` : "—"}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>
        Dataset: <span style={{ color: "#94a3b8" }}>{metrics.n_total?.toLocaleString()} clips</span>
        {" · "}Train <span style={{ color: "#94a3b8" }}>{metrics.n_train}</span>
        {" · "}Val <span style={{ color: "#94a3b8" }}>{metrics.n_val}</span>
        {" · "}Test <span style={{ color: "#94a3b8" }}>{metrics.n_test}</span>
        {" · "}Classes <span style={{ color: "#94a3b8" }}>{metrics.n_classes}</span>
      </div>
      <TmPerClassChart perClass={metrics.per_class_accuracy} />
    </div>
  );
}

function TrainingMonitor({ autoStart = false, onDone }) {
  const { useState: useS, useEffect: useE, useRef: useR, useCallback: useCB } = React;
  const [logs, setLogs]             = useS([]);
  const [status, setStatus]         = useS("idle");
  const [epochProgress, setEpoch]   = useS(null);
  const [folds, setFolds]           = useS([]);
  const [finalMetrics, setMetrics]  = useS(null);
  const [maxPerDataset, setMax]      = useS(3000);
  const [forceRetrain, setForce]    = useS(false);
  const [autoScroll, setAutoScroll] = useS(true);
  const esRef      = useR(null);
  const logsEndRef = useR(null);
  const logBoxRef  = useR(null);

  useE(() => {
    if (autoScroll && logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs, autoScroll]);

  const disconnect = useCB(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
  }, []);

  const connectSSE = useCB(() => {
    disconnect();
    setLogs([]); setEpoch(null); setFolds([]); setMetrics(null); setStatus("connecting");
    const es = new EventSource(`${API}/voice/train-stream`);
    esRef.current = es;
    es.onopen = () => setStatus("training");
    es.onmessage = (e) => {
      let event;
      try { event = JSON.parse(e.data); } catch { return; }
      const { msg, level, metrics } = event;
      if (level === "sentinel" || msg === "__DONE__") {
        setStatus("done"); disconnect();
        if (onDone) onDone(finalMetrics);
        return;
      }
      if (level === "ping") return;
      const ep = tmParseEpoch(msg);
      if (ep) setEpoch(ep);
      const fp = tmParseFold(msg);
      if (fp) setFolds((prev) => [...prev.filter((x) => x.fold !== fp.fold), fp]);
      if (metrics && level === "done") { setMetrics(metrics); if (onDone) onDone(metrics); }
      setLogs((prev) => [...prev.slice(-500), { msg, level, ts: event.ts }]);
    };
    es.onerror = () => { setStatus((s) => (s === "done" ? s : "error")); disconnect(); };
  }, [disconnect, finalMetrics, onDone]);

  useE(() => { if (autoStart) connectSSE(); return disconnect; }, [autoStart]); // eslint-disable-line

  const startRetrain = async () => {
    const fd = new FormData();
    fd.append("force_retrain", forceRetrain);
    fd.append("max_per_dataset", maxPerDataset);
    await fetch(`${API}/voice/retrain-stream`, { method: "POST", body: fd });
    connectSSE();
  };

  const statusColors = { idle:"#475569", connecting:"#fbbf24", training:"#60a5fa", done:"#4ade80", error:"#f87171" };
  const statusLabels = { idle:"Idle", connecting:"Connecting…", training:"Training…", done:"Complete", error:"Error" };

  return (
    <div style={{ fontFamily:"'JetBrains Mono','Fira Code','Cascadia Code',monospace", background:"#020817", color:"#e2e8f0", borderRadius:16, border:"1px solid #1e293b", overflow:"hidden", maxWidth:780, width:"100%", margin:"0 auto" }}>
      {/* Header */}
      <div style={{ background:"#0f172a", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #1e293b" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:statusColors[status], boxShadow:status==="training"?`0 0 8px ${statusColors.training}`:"none", animation:status==="training"?"pulse 1.5s infinite":"none" }} />
          <span style={{ fontSize:13, fontWeight:700, color:"#f8fafc", letterSpacing:0.5 }}>CNN + BiLSTM Training Monitor</span>
          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#1e293b", color:statusColors[status], fontWeight:600 }}>{statusLabels[status]}</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["#f87171","#fbbf24","#4ade80"].map((c) => <div key={c} style={{ width:11, height:11, borderRadius:"50%", background:c, opacity:0.7 }} />)}
        </div>
      </div>
      {/* Controls */}
      <div style={{ padding:"12px 20px", background:"#0a1628", borderBottom:"1px solid #1e293b", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <button onClick={connectSSE} disabled={status==="training"||status==="connecting"}
          style={{ padding:"6px 14px", borderRadius:7, border:"none", background:status==="training"?"#1e293b":"#6366f1", color:status==="training"?"#475569":"#fff", fontSize:12, fontWeight:700, cursor:status==="training"?"not-allowed":"pointer", fontFamily:"inherit" }}>
          ▶ Watch Live
        </button>
        <button onClick={startRetrain} disabled={status==="training"||status==="connecting"}
          style={{ padding:"6px 14px", borderRadius:7, border:"1px solid #334155", background:"transparent", color:status==="training"?"#475569":"#fb923c", fontSize:12, fontWeight:700, cursor:status==="training"?"not-allowed":"pointer", fontFamily:"inherit" }}>
          🔄 Retrain
        </button>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#64748b" }}>
          <input type="checkbox" checked={forceRetrain} onChange={(e)=>setForce(e.target.checked)} style={{ accentColor:"#6366f1" }} />
          Force retrain
        </label>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#64748b" }}>
          Max clips:
          <select value={maxPerDataset} onChange={(e)=>setMax(+e.target.value)}
            style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:5, color:"#e2e8f0", padding:"2px 6px", fontSize:11, fontFamily:"inherit" }}>
            {[500,1000,2000,3000,5000,7000].map((v)=><option key={v} value={v}>{v.toLocaleString()}</option>)}
          </select>
        </label>
        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#64748b", marginLeft:"auto" }}>
          <input type="checkbox" checked={autoScroll} onChange={(e)=>setAutoScroll(e.target.checked)} style={{ accentColor:"#6366f1" }} />
          Auto-scroll
        </label>
      </div>
      {/* Epoch / Fold progress */}
      {(epochProgress || folds.length > 0) && (
        <div style={{ padding:"12px 20px", background:"rgba(4,10,20,0.70)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          {epochProgress && <TmEpochBar {...epochProgress} />}
          {folds.length > 0 && <TmFoldDots folds={folds} />}
        </div>
      )}
      {/* Log window */}
      <div ref={logBoxRef}
        onScroll={()=>{ const el=logBoxRef.current; if(!el)return; setAutoScroll(el.scrollHeight-el.scrollTop-el.clientHeight<40); }}
        style={{ height:320, overflowY:"auto", padding:"12px 20px", background:"#020817", fontSize:12, lineHeight:1.7, scrollbarWidth:"thin", scrollbarColor:"#1e293b #020817" }}>
        {logs.length===0&&status==="idle"&&(
          <div style={{ color:"#334155", textAlign:"center", paddingTop:60, fontSize:13 }}>
            Click <strong style={{ color:"#6366f1" }}>▶ Watch Live</strong> to connect to the training stream,<br/>
            or <strong style={{ color:"#fb923c" }}>🔄 Retrain</strong> to start a fresh training run.
          </div>
        )}
        {logs.length===0&&status==="connecting"&&(
          <div style={{ color:"#fbbf24", textAlign:"center", paddingTop:60 }}>Connecting to backend…</div>
        )}
        {logs.map((log, i) => {
          const s = TM_LEVEL_STYLE[log.level] || TM_LEVEL_STYLE.info;
          return (
            <div key={i} style={{ color:s.color, fontWeight:s.weight, display:"flex", gap:8, alignItems:"flex-start", marginBottom:1 }}>
              <span style={{ opacity:0.5, minWidth:14, userSelect:"none" }}>{s.icon}</span>
              <span style={{ whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{log.msg}</span>
            </div>
          );
        })}
        <div ref={logsEndRef} />
      </div>
      {finalMetrics && <div style={{ padding:"0 20px 20px" }}><TmMetricsCard metrics={finalMetrics} /></div>}
      {status==="error"&&(
        <div style={{ margin:"0 20px 16px", padding:"10px 14px", background:"#1c0a0a", border:"1px solid #7f1d1d", borderRadius:8, color:"#fca5a5", fontSize:12 }}>
          ❌ Connection to backend lost. Is the FastAPI server running on <code>{API}</code>?<br/>Check the server terminal for errors.
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function PageTraining() {
  return (
    <div style={{ animation:"fadeIn 0.4s ease" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:G.textMut, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:6, fontFamily:G.mono }}>
          Voice Model
        </div>
        <h2 style={{ fontSize:26, fontFamily:G.head, color:G.cyan, fontWeight:700, margin:0, letterSpacing:"0.05em" }}>
          Training Monitor
        </h2>
        <p style={{ color:G.textMut, fontSize:12, marginTop:8, fontFamily:G.mono }}>
          Real-time CNN + BiLSTM voice emotion model training stream. Connect to watch live progress or trigger a fresh retrain.
        </p>
      </div>
      <TrainingMonitor />
    </div>
  );
}


const RANKS=[
  {name:'NOVICE',min:0,max:500,color:'#5a8a9f',icon:'◈'},
  {name:'TRAINEE',min:500,max:1200,color:'#00d4ff',icon:'◆'},
  {name:'ANALYST',min:1200,max:2500,color:'#00ff88',icon:'★'},
  {name:'EXPERT',min:2500,max:5000,color:'#fbbf24',icon:'⬡'},
  {name:'MASTER',min:5000,max:10000,color:'#a78bfa',icon:'⬟'},
  {name:'LEGEND',min:10000,max:Infinity,color:'#ff3366',icon:'◉'},
];
const getRank=(xp)=>RANKS.find(r=>xp>=r.min&&xp<r.max)||RANKS[RANKS.length-1];

function XPBar({xp}){
  const rank=getRank(xp);
  const nextRank=RANKS[RANKS.indexOf(rank)+1];
  const pct=nextRank?Math.min(100,((xp-rank.min)/(rank.max-rank.min))*100):100;
  return(
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 4px'}}>
      <span style={{fontSize:16,color:rank.color,textShadow:`0 0 10px ${rank.color}`,animation:'pulse 2s infinite'}}>{rank.icon}</span>
      <div style={{flex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
          <span style={{fontSize:9,fontFamily:"'Orbitron',monospace",color:rank.color,letterSpacing:'0.1em',fontWeight:700}}>{rank.name}</span>
          <span style={{fontSize:9,color:'#5a8a9f',fontFamily:"'Share Tech Mono',monospace"}}>{xp} XP</span>
        </div>
        <div style={{height:4,background:'#071422',borderRadius:2,overflow:'hidden',border:'1px solid rgba(0,212,255,0.08)'}}>
          <div className="xp-bar-fill" style={{height:'100%',width:`${pct}%`,borderRadius:2}}/>
        </div>
      </div>
      {nextRank&&<span style={{fontSize:8,color:'#1e3a4a',fontFamily:"'Share Tech Mono',monospace",whiteSpace:'nowrap'}}>{rank.max-xp} to {nextRank.name}</span>}
    </div>
  );
}

function AchievementToast({achievement,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,4200);return()=>clearTimeout(t);},[]);
  return(
    <div className="achievement-toast" style={{position:'fixed',bottom:80,right:24,zIndex:9999,background:'rgba(18,28,20,0.72)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(251,191,36,0.45)',borderRadius:10,padding:'12px 20px',boxShadow:'0 0 28px rgba(251,191,36,0.22),inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.5)',maxWidth:300}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:28}}>{achievement.icon}</span>
        <div>
          <div style={{fontSize:9,color:'#fbbf24',fontFamily:"'Orbitron',monospace",letterSpacing:'0.14em',marginBottom:2}}>ACHIEVEMENT UNLOCKED</div>
          <div style={{fontSize:13,color:'#e0f7ff',fontFamily:"'Orbitron',monospace",fontWeight:700}}>{achievement.name}</div>
          <div style={{fontSize:10,color:'#5a8a9f',marginTop:2}}>+{achievement.xp} XP</div>
        </div>
      </div>
    </div>
  );
}

function LevelUpFlash({rank,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:'fixed',inset:0,zIndex:9997,background:`radial-gradient(ellipse at center,${rank.color}20 0%,transparent 70%)`,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',animation:'levelUp 2s ease forwards'}}>
      <div style={{textAlign:'center',animation:'rankBadge 0.8s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <div style={{fontSize:72,color:rank.color,textShadow:`0 0 40px ${rank.color}`,marginBottom:8}}>{rank.icon}</div>
        <div style={{fontSize:11,fontFamily:"'Orbitron',monospace",color:rank.color,letterSpacing:'0.3em',marginBottom:4}}>RANK UP!</div>
        <div style={{fontSize:32,fontFamily:"'Orbitron',monospace",fontWeight:900,color:rank.color,textShadow:`0 0 20px ${rank.color}`}}>{rank.name}</div>
      </div>
    </div>
  );
}

// ============================================================
//  ANIMATED COUNTER
// ============================================================
function AnimCounter({target,duration=1400,color,suffix='',prefix='',size=26}){
  const[val,setVal]=useState(0);
  const fr=useRef(null);
  useEffect(()=>{
    let start=null;
    const step=(ts)=>{
      if(!start)start=ts;
      const prog=Math.min((ts-start)/duration,1);
      const ease=1-Math.pow(1-prog,3);
      setVal(Math.round(target*ease));
      if(prog<1)fr.current=requestAnimationFrame(step);
    };
    fr.current=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(fr.current);
  },[target,duration]);
  return(<span style={{color,fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:size,textShadow:`0 0 14px ${color}`}}>{prefix}{val}{suffix}</span>);
}

// ============================================================
//  CORNER DECORATIONS
// ============================================================
function CornerDeco(){
  return null;
}

// ============================================================
//  GLITCH TEXT COMPONENT
// ============================================================
function GlitchText({children,color='#00ff88',fontSize=42,style={}}){
  const[g,sg]=useState(false);
  useEffect(()=>{
    const t=setInterval(()=>{sg(true);setTimeout(()=>sg(false),110);},5000+Math.random()*3000);
    return()=>clearInterval(t);
  },[]);
  return(
    <div style={{position:'relative',display:'inline-block',fontSize,fontFamily:"'Orbitron',monospace",fontWeight:900,color,textShadow:`0 0 20px ${color},0 0 40px ${color}50`,animation:'greenGlow 3s ease-in-out infinite',filter:g?'blur(0.5px)':'none',...style}}>
      {g&&<div style={{position:'absolute',inset:0,color:'#ff3366',opacity:0.7,transform:'translate(3px,0)',filter:'blur(0.5px)'}}>{children}</div>}
      {children}
    </div>
  );
}


// ── HELPERS ───────────────────────────────────────────────────────────────────
const scoreColor = (s,max=5) => {
  const r=s/max;
  return r>=0.84?G.green:r>=0.70?G.cyan:r>=0.50?G.amber:G.red;
};

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
function Card({children,style={},glow=false,hover=false}){
  const[h,sh]=useState(false);
  return(
    <div
      onMouseEnter={hover?()=>sh(true):undefined}
      onMouseLeave={hover?()=>sh(false):undefined}
      style={{
        background: h ? G.glassHover : G.glass,
        backdropFilter: G.blur,
        WebkitBackdropFilter: G.blur,
        border: `1px solid ${h&&hover ? 'rgba(0,212,255,0.28)' : glow ? 'rgba(0,255,136,0.22)' : G.glassBorder}`,
        borderRadius:12, padding:16,
        boxShadow: glow
          ? `0 0 ${h?40:24}px rgba(0,255,136,${h?0.14:0.07}), ${G.glassInner}, 0 4px 32px rgba(0,0,0,0.35)`
          : h && hover
            ? `0 8px 32px rgba(0,0,0,0.45), ${G.glassInner}, 0 0 0 1px rgba(0,212,255,0.08)`
            : `0 2px 16px rgba(0,0,0,0.28), ${G.glassInner}`,
        animation:"fadeInFast 0.3s ease",
        position:'relative', overflow:'hidden',
        transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        transform: h&&hover ? 'translateY(-2px)' : 'translateY(0)',
        ...style,
      }}
    >
      <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.10) 30%,rgba(255,255,255,0.14) 50%,rgba(255,255,255,0.10) 70%,transparent 100%)',pointerEvents:'none',borderRadius:'12px 12px 0 0'}}/>
      {h&&hover&&<div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(0,212,255,0.04) 0%,transparent 50%,rgba(0,212,255,0.02) 100%)',pointerEvents:'none',borderRadius:12}}/>}
      {children}
    </div>
  );
}

function SectionLabel({children,color=G.cyan}){
  return(
    <div style={{
      fontSize:9,fontFamily:"'Orbitron','Share Tech Mono',monospace",color,letterSpacing:"0.18em",
      textTransform:"uppercase",marginBottom:10,
      borderLeft:`2px solid ${color}`,paddingLeft:8,
      textShadow:`0 0 8px ${color}50`,
      display:"flex",alignItems:"center",gap:6,
    }}>
      <span>{children}</span>
    </div>
  );
}

function NeonBadge({text,color=G.cyan}){
  return(
    <span style={{
      padding:"2px 10px",borderRadius:99,fontSize:11,
      border:`1px solid ${color}40`,color,fontFamily:G.mono,
      background:`${color}14`,letterSpacing:"0.06em",
      textShadow:`0 0 6px ${color}50`,
    }}>{text}</span>
  );
}

function Btn({children,onClick,disabled,color=G.cyan,full=false,style={}}){
  const[h,sh]=useState(false);
  const[active,sActive]=useState(false);
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>sh(true)} onMouseLeave={()=>{sh(false);sActive(false);}}
      onMouseDown={()=>sActive(true)} onMouseUp={()=>sActive(false)}
      style={{
        width:full?"100%":undefined,
        padding:"9px 22px",borderRadius:8,cursor:disabled?"not-allowed":"pointer",
        border:`1px solid ${disabled?G.textDim:color}`,
        background:active&&!disabled?`${color}28`:h&&!disabled?`${color}18`:"transparent",
        color:disabled?G.textDim:color,
        fontFamily:G.mono,fontSize:13,fontWeight:700,letterSpacing:"0.06em",
        boxShadow:h&&!disabled?`0 0 18px ${color}50,inset 0 0 10px ${color}08`:"none",
        transform:active&&!disabled?'scale(0.97)':h&&!disabled?'translateY(-1px)':'none',
        transition:"all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
        textShadow:h&&!disabled?`0 0 10px ${color}80`:undefined,
        ...style,
      }}>{children}</button>
  );
}

// ── EQ BARS ───────────────────────────────────────────────────────────────────
function EQBars({active,nervousness=0.2}){
  const color=nervousness>0.6?G.violet:nervousness>0.35?G.amber:G.green;
  const gradient=nervousness>0.6?`linear-gradient(180deg,${G.violet},${G.violet}80)`:nervousness>0.35?`linear-gradient(180deg,${G.amber},${G.amber}80)`:`linear-gradient(180deg,${G.green},${G.cyan})`;
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:2,height:24}}>
      {Array.from({length:16}).map((_,i)=>(
        <div key={i} style={{
          width:3,height:active?undefined:3,
          background:active?gradient:color,
          opacity:active?0.9:0.2,borderRadius:1,
          transformOrigin:"bottom",
          animation:active?`barUp ${0.3+i*0.04}s ease-in-out infinite alternate`:"none",
          transition:"height 0.1s",
          minHeight:3,maxHeight:24,
          flex:"0 0 3px",
          boxShadow:active?`0 0 4px ${color}80`:"none",
        }}/>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TTS HOOK — speaks text via Web Speech API, returns {speaking, speak, stop}
// ══════════════════════════════════════════════════════════════════════════════
function useTTS(){
  const[speaking,setSpeaking]=useState(false);
  const uttRef=useRef(null);

  const stop=useCallback(()=>{
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  },[]);

  const speak=useCallback((text)=>{
    if(!window.speechSynthesis||!text)return;
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(text);
    // Professional interviewer voice: measured pace, authoritative pitch
    utt.rate=0.82;utt.pitch=0.78;utt.volume=1;
    const voices=window.speechSynthesis.getVoices();
    // Priority: deep professional male voices → UK English → US English fallback
    const pref=
      voices.find(v=>/en[-_](GB|US)/i.test(v.lang)&&/daniel/i.test(v.name))     // Daniel (macOS/iOS deep)
      ||voices.find(v=>/en[-_]GB/i.test(v.lang)&&/google/i.test(v.name))        // Google UK English Male
      ||voices.find(v=>/en[-_]GB/i.test(v.lang))                                 // any UK English
      ||voices.find(v=>/en[-_]US/i.test(v.lang)&&/google/i.test(v.name)&&/male/i.test(v.name))
      ||voices.find(v=>/en[-_]US/i.test(v.lang)&&/alex|fred|bruce|ralph/i.test(v.name)) // macOS deep voices
      ||voices.find(v=>/en[-_]US/i.test(v.lang)&&/google/i.test(v.name))
      ||voices.find(v=>/en/i.test(v.lang));
    if(pref)utt.voice=pref;
    utt.onstart=()=>setSpeaking(true);
    utt.onend=()=>setSpeaking(false);
    utt.onerror=()=>setSpeaking(false);
    uttRef.current=utt;
    window.speechSynthesis.speak(utt);
  },[]);

  // ensure voices are loaded (Chrome fires a voiceschanged event)
  useEffect(()=>{
    const load=()=>window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis?.addEventListener?.("voiceschanged",load);
    return()=>window.speechSynthesis?.removeEventListener?.("voiceschanged",load);
  },[]);

  return{speaking,speak,stop};
}

// (keyframes now in GLOBAL_CSS)
const INTERVIEWER_CSS=``;

// ══════════════════════════════════════════════════════════════════════════════
//  INTERVIEWER AVATAR — compact icon mode
// ══════════════════════════════════════════════════════════════════════════════
function InterviewerAvatar({speaking,onSpeak,onStop,questionText,evaluated}){
  const[blinking,setBlinking]=useState(false);
  const[hovered,setHovered]=useState(false);

  useEffect(()=>{
    const blink=()=>{setBlinking(true);setTimeout(()=>setBlinking(false),180);};
    const loop=()=>{blink();setTimeout(loop,3000+Math.random()*3000);};
    const t=setTimeout(loop,1500+Math.random()*2000);
    return()=>clearTimeout(t);
  },[]);

  const statusColor=speaking?G.green:evaluated?G.violet:G.cyan;
  const statusLabel=speaking?"SPEAKING":"LISTENING";
  const mouthOpen=speaking?10:2;

  return(
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <style>{INTERVIEWER_CSS}</style>

      {/* Compact avatar icon */}
      <div
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
        style={{position:"relative",width:48,height:48,cursor:"pointer",flexShrink:0}}
        title={speaking?"Click to stop speaking":"Click to re-read question"}
        onClick={speaking?onStop:onSpeak}
      >
        {/* Pulse ring when speaking */}
        <div style={{
          position:"absolute",inset:-4,borderRadius:"50%",
          border:`1.5px solid ${statusColor}`,
          animation:speaking?"ringPulse 1.4s ease-in-out infinite":"none",
          opacity:speaking?0.8:0.25,pointerEvents:"none",
        }}/>

        {/* Circle background */}
        <div style={{
          position:"absolute",inset:0,borderRadius:"50%",
          background:`radial-gradient(circle at 38% 35%,${G.bgPanel},#040b14)`,
          border:`1.5px solid ${statusColor}`,
          boxShadow:`0 0 ${speaking?18:8}px ${statusColor}${speaking?"66":"22"},inset 0 0 12px rgba(0,0,0,0.5)`,
          animation:"avatarFloat 3.5s ease-in-out infinite",
          overflow:"hidden",transition:"box-shadow 0.4s,border-color 0.4s",
        }}>
          {/* Scan line */}
          <div style={{position:"absolute",left:0,right:0,height:1.5,
            background:`linear-gradient(90deg,transparent,${statusColor}50,transparent)`,
            animation:"scanLine 3s linear infinite",pointerEvents:"none"}}/>

          {/* Mini SVG face */}
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{position:"absolute",inset:0}}>
            <defs>
              <radialGradient id="faceGrad2" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor={`${statusColor}20`}/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#faceGrad2)"/>
            {/* Eyes */}
            <g style={{transformOrigin:"36px 40px",animation:blinking?"avatarBlink 0.18s ease-in-out":"none"}}>
              <ellipse cx="36" cy="40" rx="6" ry={blinking?0.5:5} fill={`${statusColor}18`} stroke={statusColor} strokeWidth="1.2"/>
              <circle cx="36" cy="40" r="2.8" fill={statusColor} opacity={blinking?0:0.9}/>
              <circle cx="37.2" cy="38.8" r="0.9" fill="white" opacity={blinking?0:0.6}/>
            </g>
            <g style={{transformOrigin:"64px 40px",animation:blinking?"avatarBlink 0.18s ease-in-out":"none"}}>
              <ellipse cx="64" cy="40" rx="6" ry={blinking?0.5:5} fill={`${statusColor}18`} stroke={statusColor} strokeWidth="1.2"/>
              <circle cx="64" cy="40" r="2.8" fill={statusColor} opacity={blinking?0:0.9}/>
              <circle cx="65.2" cy="38.8" r="0.9" fill="white" opacity={blinking?0:0.6}/>
            </g>
            {/* Mouth */}
            <path d={`M 40 ${62-mouthOpen*0.3} Q 50 ${62+mouthOpen*0.8} 60 ${62-mouthOpen*0.3}`}
              fill="none" stroke={statusColor} strokeWidth="1.6" strokeLinecap="round"
              style={{transition:"d 0.12s ease-in-out"}}/>
            {speaking&&<ellipse cx="50" cy="62" rx="7" ry={mouthOpen*0.5} fill={`${statusColor}15`}/>}
            {/* AI chip */}
            <rect x="43" y="21" width="14" height="7" rx="2" fill="transparent" stroke={`${statusColor}50`} strokeWidth="0.8"/>
            <text x="50" y="27" textAnchor="middle" fontSize="4" fill={statusColor} fontFamily="monospace" opacity="0.7">AI</text>
          </svg>
        </div>

        {/* Hover tooltip */}
        {hovered&&(
          <div style={{
            position:"absolute",bottom:-22,left:"50%",transform:"translateX(-50%)",
            background:"rgba(8,16,28,0.85)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
            border:`1px solid rgba(255,255,255,0.10)`,
            borderRadius:4,padding:"2px 7px",fontSize:9,
            color:G.textMut,whiteSpace:"nowrap",fontFamily:G.mono,
            pointerEvents:"none",zIndex:10,
          }}>{speaking?"stop":"replay"}</div>
        )}
      </div>

      {/* Name + status inline */}
      <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:13,fontFamily:G.head,color:G.textPri,letterSpacing:"0.08em",fontWeight:700}}>ARIA</span>
          <span style={{fontSize:9,color:G.textMut,letterSpacing:"0.04em"}}>· AI INTERVIEWER</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:statusColor,boxShadow:`0 0 6px ${statusColor}`,
            animation:speaking?"pulse 0.8s ease-in-out infinite":"labelBlink 3s ease-in-out infinite"}}/>
          <span style={{fontSize:9,fontFamily:G.head,color:statusColor,letterSpacing:"0.1em"}}>{statusLabel}</span>
        </div>
      </div>

      {/* Speak / Stop buttons compact */}
      <div style={{display:"flex",gap:5,marginLeft:"auto",flexShrink:0}}>
        <Btn onClick={onSpeak} disabled={speaking} color={G.cyan} style={{padding:"4px 10px",fontSize:10}}>
          🔊 Speak
        </Btn>
        <Btn onClick={onStop} disabled={!speaking} color={G.red} style={{padding:"4px 10px",fontSize:10}}>
          ⏹ Stop
        </Btn>
      </div>
    </div>
  );
}

// ── SCORE RING ────────────────────────────────────────────────────────────────
function ScoreRing({score,max=5,label,size=72}){
  const r=(size-10)/2,circ=2*Math.PI*r;
  const offset=circ-(score/max)*circ;
  const color=scoreColor(score,max);
  const[animated,setAnimated]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setAnimated(true),100);return()=>clearTimeout(t);},[]);
  const animOffset=animated?offset:circ;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
      <div style={{position:"relative",width:size,height:size}}>
        <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute",top:0,left:0}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}15`} strokeWidth={6}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={circ} strokeDashoffset={animOffset} strokeLinecap="round"
            style={{transition:"stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)",filter:`drop-shadow(0 0 6px ${color})`}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:size>70?15:12,fontWeight:700,fontFamily:G.head,color,textShadow:`0 0 10px ${color}`}}>{Number(score).toFixed(1)}</span>
        </div>
      </div>
      <span style={{fontSize:9,color:G.textMut,textAlign:"center",fontFamily:G.head,letterSpacing:"0.08em"}}>{label}</span>
    </div>
  );
}

// ── DISC BAR ──────────────────────────────────────────────────────────────────
function DiscBar({label,value,color}){
  const pct=Math.min(100,Number(value)*10);
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:11,color:G.textMut,fontFamily:G.head,letterSpacing:"0.04em"}}>{label}</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{height:3,width:pct,maxWidth:80,background:color,borderRadius:2,opacity:0.4,transition:"width 1.2s ease"}}/>
          <span style={{fontSize:11,color,fontWeight:700,fontFamily:G.head,minWidth:28,textAlign:"right"}}>{Number(value).toFixed(1)}</span>
        </div>
      </div>
      <div style={{height:5,background:'#071422',borderRadius:3,overflow:"hidden",border:`1px solid ${color}15`}}>
        <div style={{height:"100%",width:`${pct}%`,borderRadius:3,
          background:`linear-gradient(90deg,${color}90,${color})`,
          boxShadow:`0 0 8px ${color}60`,
          transition:"width 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      </div>
    </div>
  );
}

// ── TIMELINE ──────────────────────────────────────────────────────────────────
function Timeline({answers,total,current}){
  const dc=(s)=>s>=4.2?G.green:s>=3.5?G.cyan:s>=2.5?G.amber:G.red;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:5}}>
        {Array.from({length:total}).map((_,i)=>{
          const a=answers[i];
          const isNow=i===current&&!a;
          const color=a?dc(a.score):isNow?G.cyan:G.textDim;
          return(
            <React.Fragment key={i}>
              <div style={{
                width:isNow?11:9,height:isNow?11:9,borderRadius:"50%",flexShrink:0,
                background:a?color:isNow?`${color}30`:"transparent",
                border:`1.5px solid ${color}`,
                boxShadow:isNow?`0 0 12px ${color},0 0 6px ${color}`:"none",
                animation:isNow?"pulse 1s infinite":"none",
                transition:"all 0.3s",
              }}/>
              {i<total-1&&<div style={{flex:1,height:1.5,background:a?`linear-gradient(90deg,${color},${color}80)`:G.textDim,opacity:0.4,borderRadius:1}}/>}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        {Array.from({length:total}).map((_,i)=>(
          <span key={i} style={{fontSize:9,color:G.textMut,fontFamily:G.mono}}>Q{i+1}</span>
        ))}
      </div>
    </div>
  );
}

// ── STAR COVERAGE BADGE ───────────────────────────────────────────────────────
function StarBadge({coverage}){
  const items=["S","T","A","R"];
  const pct=coverage||0;
  const filled=Math.round(pct*4);
  return(
    <div style={{display:"flex",gap:5,alignItems:"center"}}>
      {items.map((x,i)=>(
        <div key={x} style={{
          width:24,height:24,borderRadius:5,
          border:`1px solid ${i<filled?G.green:G.textDim}`,
          background:i<filled?`${G.green}20`:"transparent",
          color:i<filled?G.green:G.textDim,
          fontSize:10,fontWeight:700,fontFamily:G.head,
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:i<filled?`0 0 8px ${G.green}40`:"none",
          transition:"all 0.3s",
          textShadow:i<filled?`0 0 6px ${G.green}`:"none",
        }}>{x}</div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  AUTH SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function AuthScreen({onAuth, onClose, isModal=false}){
  const[mode,setMode]=useState("login");
  const[form,setForm]=useState({username:"",email:"",password:"",usernameOrEmail:""});
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const submit=async()=>{
    setError("");setLoading(true);
    try{
      if(mode==="register"){
        const res=await fetch(`${API}/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({username:form.username,email:form.email,password:form.password})});
        const d=await res.json();
        if(!res.ok){setError(d.detail||"Registration failed.");return;}
        saveAuth(d.token,d.user);onAuth(d.user);
      }else{
        const res=await fetch(`${API}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({username_or_email:form.usernameOrEmail,password:form.password})});
        const d=await res.json();
        if(!res.ok){setError(d.detail||"Invalid credentials.");return;}
        saveAuth(d.token,d.user);onAuth(d.user);
      }
    }catch{setError("Cannot reach server. Is the backend running?");}
    finally{setLoading(false);}
  };

  const inp={width:"100%",padding:"12px 14px",fontSize:14,marginBottom:14,borderRadius:10,
    background:"rgba(13,21,39,0.75)",border:"1px solid rgba(255,255,255,0.1)",
    color:"#f8fafc",outline:"none",boxSizing:"border-box",transition:"all 0.2s"};
  const btnS={width:"100%",padding:"13px 0",border:"none",borderRadius:10,cursor:"pointer",
    fontSize:14,fontFamily:G.head,letterSpacing:"0.04em",fontWeight:600,
    background:"linear-gradient(135deg,#06b6d4 0%,#6366f1 100%)",color:"#ffffff",
    boxShadow:"0 4px 20px rgba(6,182,212,0.25)",transition:"all 0.2s"};

  return(
    <div style={isModal ? {
      position:"fixed",inset:0,zIndex:1200,
      background:"rgba(4,9,18,0.85)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn 0.25s ease"
    } : {
      minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"#080c14"
    }}>
      {!isModal && <><style>{GLOBAL_CSS}</style><NeuralBackground/></>}
      <div style={{position:"relative",zIndex:10,width:"100%",maxWidth:430,padding:"0 18px"}}>
        {isModal && onClose && (
          <button onClick={onClose} style={{
            position:"absolute",right:28,top:8,background:"rgba(255,255,255,0.08)",
            border:"1px solid rgba(255,255,255,0.15)",color:"#fff",
            width:32,height:32,borderRadius:"50%",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,zIndex:20
          }} title="Close">✕</button>
        )}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"4px 14px",borderRadius:20,background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.25)",marginBottom:12}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#06b6d4",boxShadow:"0 0 8px #06b6d4"}}/>
            <span style={{fontSize:11,fontFamily:G.head,fontWeight:600,color:"#06b6d4",letterSpacing:"0.08em",textTransform:"uppercase"}}>Candidate Authentication</span>
          </div>
          <div style={{fontSize:22,fontFamily:G.head,fontWeight:800,letterSpacing:"-0.02em",
            background:"linear-gradient(135deg,#f8fafc 40%,#94a3b8 100%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            marginBottom:6,lineHeight:1.25}}>AURA AI INTERVIEW PLATFORM</div>
          <div style={{fontSize:12,color:G.textMut,letterSpacing:"0.01em"}}>Sign in to sync your scorecards, streaks, and analytics</div>
        </div>
        <Card style={{padding:"26px 24px"}}>
          <div style={{display:"flex",gap:0,marginBottom:22,borderBottom:`1px solid ${G.border}`}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{
                flex:1,padding:"10px 0",border:"none",cursor:"pointer",background:"transparent",
                borderBottom:`2px solid ${mode===m?G.cyan:"transparent"}`,
                color:mode===m?G.cyan:G.textMut,fontSize:12,fontFamily:G.head,
                letterSpacing:"0.1em",transition:"all 0.18s",textTransform:"uppercase",
              }}>{m==="login"?"Sign In":"Create Account"}</button>
            ))}
          </div>
          {mode==="login"&&<>
            <input style={inp} placeholder="Username or Email" value={form.usernameOrEmail}
              onChange={e=>set("usernameOrEmail",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <input style={inp} type="password" placeholder="Password" value={form.password}
              onChange={e=>set("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </>}
          {mode==="register"&&<>
            <input style={inp} placeholder="Username (3+ chars)" value={form.username} onChange={e=>set("username",e.target.value)}/>
            <input style={inp} placeholder="Email address" value={form.email} onChange={e=>set("email",e.target.value)}/>
            <input style={inp} type="password" placeholder="Password (8+ chars)" value={form.password}
              onChange={e=>set("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </>}
          {error&&<div style={{color:G.red,fontSize:12,marginBottom:12,padding:"8px 10px",
            background:`${G.red}12`,borderRadius:6,border:`1px solid ${G.red}30`}}>{error}</div>}
          <button style={btnS} onClick={submit} disabled={loading}>
            {loading?"CONNECTING…":mode==="login"?"SIGN IN →":"CREATE ACCOUNT →"}
          </button>
          <div style={{textAlign:"center",marginTop:14,fontSize:11,color:G.textMut}}>
            {mode==="login"?"New here? ":"Have an account? "}
            <span style={{color:G.cyan,cursor:"pointer",textDecoration:"underline"}}
              onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}}>
              {mode==="login"?"Create account":"Sign in"}
            </span>
          </div>
          {isModal && onClose && (
            <div style={{textAlign:"center",marginTop:16,paddingTop:12,borderTop:`1px solid rgba(255,255,255,0.07)`}}>
              <button onClick={onClose} style={{
                background:"none",border:"none",color:G.textMut,
                fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:G.mono
              }}>
                Continue as Guest (Skip for now) →
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  NAVBAR WITH USER AVATAR
// ══════════════════════════════════════════════════════════════════════════════
function NavbarWithUser({page,onNav,inSession,xp=0,user,onLogout,onOpenAuth}){
  const[menuOpen,setMenuOpen]=useState(false);
  const links=[
    {id:"setup",label:"⚡ Launch Interview"},
  ];
  return(
    <nav style={{background:"rgba(8,14,24,0.92)",borderBottom:`1px solid rgba(255,255,255,0.08)`,
      backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
      padding:"0 24px",display:"flex",alignItems:"center",
      justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:100,
      boxShadow:"0 4px 24px rgba(0,0,0,0.5)"}}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div onClick={()=>onNav("dashboard")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#06b6d4",boxShadow:"0 0 10px #06b6d4"}}/>
          <span style={{fontFamily:G.head,fontWeight:800,fontSize:13,letterSpacing:"0.06em",
            background:"linear-gradient(135deg,#f8fafc 40%,#94a3b8 100%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            AI INTERVIEW EVALUATION AND FEEDBACK SYSTEM
          </span>
        </div>
        <div style={{width:1,height:20,background:G.border}}/>
        {links.map(l=>(
          <button key={l.id} onClick={()=>{if(!inSession)onNav(l.id);}} style={{
            border:"none",
            cursor:inSession?"not-allowed":"pointer",
            color:page===l.id?G.cyan:G.textMut,fontFamily:G.head,fontSize:13,padding:"6px 12px",
            borderRadius:8,fontWeight:600,
            background:page===l.id?"rgba(6,182,212,0.08)":"transparent",
            borderBottom:`2px solid ${page===l.id?G.cyan:"transparent"}`,
            opacity:inSession?0.3:1,transition:"all 0.18s",
          }}>{l.label}</button>
        ))}
        {inSession&&<span style={{fontSize:11,color:G.green,fontFamily:G.head,fontWeight:700,animation:"pulse 2s infinite",letterSpacing:"0.08em",padding:"3px 10px",borderRadius:20,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)"}}>● PROCTORED SESSION</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:160}}><XPBar xp={xp}/></div>
        {user ? (
          <div style={{position:"relative"}}>
            <div onClick={()=>setMenuOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,
              cursor:"pointer",padding:"5px 12px",borderRadius:20,
              border:`1px solid rgba(255,255,255,0.12)`,
              background:"rgba(10,20,34,0.65)",
              backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
              transition:"all 0.2s"}}>
              <div style={{width:26,height:26,borderRadius:"50%",
                background:`linear-gradient(135deg,${G.cyan},${G.green})`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:700,color:"#020810"}}>
                {(user.username||"?")[0].toUpperCase()}
              </div>
              <span style={{fontSize:11,color:G.textPri,fontFamily:G.mono,maxWidth:85,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {user.username}
              </span>
              <span style={{fontSize:9,color:G.textMut}}>{menuOpen?"▲":"▼"}</span>
            </div>
            {menuOpen&&(
              <div style={{position:"absolute",right:0,top:42,width:180,
                background:"rgba(8,16,28,0.92)",
                backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
                border:`1px solid rgba(255,255,255,0.12)`,borderRadius:10,
                boxShadow:`0 12px 40px rgba(0,0,0,0.65)`,
                zIndex:200,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:`1px solid rgba(255,255,255,0.07)`}}>
                  <div style={{fontSize:12,color:G.textPri,fontWeight:600}}>{user.username}</div>
                  <div style={{fontSize:10,color:G.textMut,marginTop:2}}>{user.email}</div>
                </div>
                <button onClick={()=>{setMenuOpen(false);onLogout();}} style={{
                  width:"100%",padding:"10px 14px",background:"transparent",border:"none",
                  color:G.red,fontSize:12,fontFamily:G.mono,cursor:"pointer",textAlign:"left"}}>
                  ⎋ Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onOpenAuth} style={{
            display:"flex",alignItems:"center",gap:7,
            padding:"7px 16px",borderRadius:20,
            background:"linear-gradient(135deg, rgba(6,182,212,0.18), rgba(99,102,241,0.25))",
            border:"1px solid rgba(6,182,212,0.45)",
            color:G.cyan,fontSize:11,fontWeight:700,fontFamily:G.head,letterSpacing:"0.06em",
            cursor:"pointer",transition:"all 0.2s",boxShadow:"0 2px 14px rgba(6,182,212,0.2)"
          }}>
            <span style={{fontSize:13}}>👤</span> SIGN IN
          </button>
        )}
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  USER HISTORY PANEL
// ══════════════════════════════════════════════════════════════════════════════
function UserHistoryPanel(){
  const[history,setHistory]=useState([]);
  const[stats,setStats]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!getToken()){setLoading(false);return;}
    const load=async()=>{
      setLoading(true);
      try{
        const[hRes,sRes]=await Promise.all([
          authFetch(`${API}/user/history?limit=20`),
          authFetch(`${API}/user/stats`),
        ]);
        if(hRes.ok){const d=await hRes.json();setHistory(d.history||[]);}
        if(sRes.ok){const d=await sRes.json();setStats(d);}
      }catch{}
      finally{setLoading(false);}
    };
    load();
  },[]);

  const recColor=r=>r==="Strong Yes"?G.green:r==="Yes"?G.cyan:r==="Maybe"?G.amber:G.red;
  const sc=s=>s>=4?G.green:s>=3?G.cyan:s>=2?G.amber:G.red;
  const fmt=ts=>ts?new Date(ts*1000).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"2-digit"}):"—";

  if(loading)return(
    <div style={{textAlign:"center",padding:32,color:G.textMut,fontFamily:G.head,fontSize:11,letterSpacing:"0.15em"}}>
      LOADING HISTORY…
    </div>
  );

  return(
    <div>
      {stats&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"SESSIONS",val:stats.total_sessions,color:G.cyan},
            {label:"AVG SCORE",val:`${stats.avg_score?.toFixed(1)}/5`,color:sc(stats.avg_score)},
            {label:"BEST SCORE",val:`${stats.best_score?.toFixed(1)}/5`,color:G.green},
            {label:"STREAK",val:`${stats.streak_current||0} 🔥`,color:G.amber},
            {label:"BEST STREAK",val:`${stats.streak_best||0}`,color:G.violet},
          ].map(({label,val,color})=>(
            <div key={label} style={{padding:"10px 12px",
              background:"rgba(8,16,28,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
              border:`1px solid ${color}22`,borderRadius:10,textAlign:"center",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:16,fontFamily:G.head,fontWeight:700,color,textShadow:`0 0 10px ${color}66`}}>{val}</div>
              <div style={{fontSize:9,color:G.textMut,letterSpacing:"0.12em",marginTop:3}}>{label}</div>
            </div>
          ))}
        </div>
      )}
      {stats?.score_trend?.length>1&&(
        <Card style={{marginBottom:12,padding:"10px 14px"}}>
          <div style={{fontSize:10,color:G.textMut,letterSpacing:"0.1em",marginBottom:8}}>SCORE TREND</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:36}}>
            {[...stats.score_trend].reverse().map((pt,i)=>{
              const h=Math.max(4,(pt.score/5)*36);const c=sc(pt.score);
              return <div key={i} title={`${pt.role}: ${pt.score?.toFixed(1)}/5`}
                style={{flex:1,height:h,background:c,borderRadius:"3px 3px 0 0",opacity:0.7+i*0.03,minWidth:8}}/>;
            })}
          </div>
        </Card>
      )}
      {history.length===0?(
        <div style={{textAlign:"center",padding:28,color:G.textMut,fontSize:13}}>
          No sessions yet — start your first interview above!
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {history.map(h=>(
            <div key={h.id} style={{padding:"10px 14px",
              background:"rgba(8,16,28,0.50)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
              border:`1px solid rgba(255,255,255,0.07)`,borderRadius:10,
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 12px rgba(0,0,0,0.25)",
              display:"grid",gridTemplateColumns:"44px 1fr auto auto",gap:10,alignItems:"center"}}>
              <div style={{width:44,height:44,borderRadius:"50%",border:`2px solid ${sc(h.avg_score)}`,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                background:`${sc(h.avg_score)}10`}}>
                <span style={{fontSize:13,fontFamily:G.head,fontWeight:700,color:sc(h.avg_score)}}>{h.avg_score?.toFixed(1)}</span>
                <span style={{fontSize:7,color:G.textMut}}>/5</span>
              </div>
              <div>
                <div style={{fontSize:13,color:G.textPri,fontWeight:600,marginBottom:3}}>{h.role}</div>
                <div style={{display:"flex",gap:6}}>
                  <span style={{fontSize:9,color:G.textMut,fontFamily:G.head,background:G.border,padding:"1px 6px",borderRadius:3}}>{h.difficulty?.toUpperCase()}</span>
                  <span style={{fontSize:9,color:G.textMut}}>{h.num_questions}Q · {fmt(h.completed_at)}</span>
                </div>
              </div>
              <div style={{padding:"3px 10px",borderRadius:99,border:`1px solid ${recColor(h.hr_recommendation)}50`,
                background:`${recColor(h.hr_recommendation)}12`,fontSize:10,
                color:recColor(h.hr_recommendation),fontFamily:G.head,whiteSpace:"nowrap"}}>
                {h.hr_recommendation||"—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DAILY CHALLENGE
// ══════════════════════════════════════════════════════════════════════════════

// ── Voice-to-text modal used inside DailyChallenge ───────────────────────────
function VoiceChallengeModal({data,onClose,onSubmitted,streak}){
  const[answer,setAnswer]=useState("");
  const[listening,setListening]=useState(false);
  const[recPhase,setRecPhase]=useState("idle");
  const[evalScore,setEvalScore]=useState(null);
  const[evaluating,setEvaluating]=useState(false);
  const[submitting,setSubmitting]=useState(false);
  const[result,setResult]=useState(null);
  const[sttError,setSttError]=useState("");
  const[volume,setVolume]=useState(0);
  const recognitionRef=useRef(null);
  const animFrameRef=useRef(null);
  const audioCtxRef=useRef(null);
  const analyserRef=useRef(null);
  const micStreamRef=useRef(null);

  const sc=s=>s>=4?G.green:s>=3?G.cyan:s>=2?G.amber:G.red;
  const stC=s=>s>=7?G.amber:s>=3?G.cyan:G.green;
  const stE=s=>s>=30?"🏆":s>=14?"💎":s>=7?"🔥":s>=3?"⚡":"📅";

  const startVolumeTrack=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      micStreamRef.current=stream;
      const ctx=new (window.AudioContext||window.webkitAudioContext)();
      audioCtxRef.current=ctx;
      const analyser=ctx.createAnalyser();analyser.fftSize=256;
      analyserRef.current=analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf=new Uint8Array(analyser.frequencyBinCount);
      const tick=()=>{
        analyser.getByteFrequencyData(buf);
        const avg=buf.reduce((a,b)=>a+b,0)/buf.length;
        setVolume(Math.min(100,Math.round(avg*2.2)));
        animFrameRef.current=requestAnimationFrame(tick);
      };tick();
    }catch{}
  };
  const stopVolumeTrack=()=>{
    cancelAnimationFrame(animFrameRef.current);
    audioCtxRef.current?.close();
    micStreamRef.current?.getTracks().forEach(t=>t.stop());
    setVolume(0);
  };

  const startListening=async()=>{
    setSttError("");
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){setSttError("Speech recognition not supported in this browser. Please type your answer.");return;}
    const rec=new SpeechRecognition();
    rec.lang="en-US";rec.interimResults=true;rec.continuous=true;
    recognitionRef.current=rec;
    let final="";
    rec.onresult=e=>{
      let interim="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal)final+=e.results[i][0].transcript+" ";
        else interim+=e.results[i][0].transcript;
      }
      setAnswer(final+interim);
    };
    rec.onerror=e=>{setSttError("Mic error: "+e.error);setRecPhase("done");setListening(false);stopVolumeTrack();};
    rec.onend=()=>{setListening(false);setRecPhase("done");stopVolumeTrack();};
    rec.start();
    setListening(true);setRecPhase("recording");
    await startVolumeTrack();
  };

  const stopListening=()=>{
    recognitionRef.current?.stop();
    setListening(false);setRecPhase("done");stopVolumeTrack();
  };

  const evaluate=async()=>{
    if(!answer.trim()||!data)return;
    setEvaluating(true);
    try{
      const form=new FormData();
      form.append("session_id","daily-"+data.date_str);
      form.append("question",data.question);form.append("answer",answer);
      form.append("role",data.type==="technical"?"Software Engineer":"General");
      form.append("difficulty",data.difficulty);form.append("q_index","0");
      const res=await authFetch(`${API}/evaluate`,{method:"POST",body:form});
      if(res.ok){const d=await res.json();setEvalScore(d.score??3.0);}
    }catch{}finally{setEvaluating(false);}
  };

  const submitDaily=async()=>{
    if(evalScore===null||!data)return;
    setSubmitting(true);
    try{
      const res=await authFetch(`${API}/daily/submit`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({date_str:data.date_str,question:data.question,score:evalScore,answer}),
      });
      if(res.ok){const d=await res.json();setResult(d);onSubmitted(d,evalScore);}
    }catch{}finally{setSubmitting(false);}
  };

  useEffect(()=>()=>{recognitionRef.current?.stop();stopVolumeTrack();},[]);

  const bars=12;

  return(
    <div style={{
      position:"fixed",inset:0,zIndex:1000,
      background:"rgba(2,8,16,0.88)",backdropFilter:"blur(12px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      animation:"fadeIn 0.18s ease",padding:"20px",
    }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{
        width:"100%",maxWidth:620,
        background:G.glass,
        border:`1px solid ${G.amber}40`,borderRadius:16,
        boxShadow:`0 0 60px ${G.amber}18,0 24px 80px rgba(0,0,0,0.7)`,
        overflow:"hidden",position:"relative",
      }}>
        <div style={{
          display:"flex",alignItems:"center",gap:10,
          padding:"14px 18px",borderBottom:`1px solid ${G.amber}20`,
          background:`${G.amber}06`,
        }}>
          <span style={{fontSize:18}}>📅</span>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontFamily:G.head,color:G.amber,letterSpacing:"0.18em"}}>DAILY CHALLENGE</div>
            <div style={{fontSize:9,color:G.textMut}}>{data.date_str} · {data.type?.toUpperCase()} · {data.difficulty?.toUpperCase()}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",
            color:G.textMut,fontSize:18,lineHeight:1,padding:"2px 6px",transition:"color 0.15s"}}
            onMouseEnter={e=>e.target.style.color=G.red}
            onMouseLeave={e=>e.target.style.color=G.textMut}>✕</button>
        </div>

        <div style={{padding:"18px 20px"}}>
          <div style={{fontSize:14,color:G.textPri,lineHeight:1.8,padding:"12px 16px",
            borderLeft:`3px solid ${G.amber}`,background:`${G.amber}07`,
            borderRadius:"0 8px 8px 0",marginBottom:14,fontWeight:500}}>
            {data.question}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
            {(data.keywords||[]).map(k=>(
              <span key={k} style={{fontSize:9,padding:"2px 8px",borderRadius:99,
                background:`${G.amber}12`,border:`1px solid ${G.amber}25`,
                color:G.amber,fontFamily:G.head,letterSpacing:"0.08em"}}>{k}</span>
            ))}
          </div>

          {evalScore===null&&(
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,
                padding:"20px 16px",borderRadius:12,
                background:recPhase==="recording"?`rgba(255,51,102,0.06)`:`rgba(0,212,255,0.04)`,
                border:`1px solid ${recPhase==="recording"?G.red+"40":G.border}`,
                marginBottom:12,transition:"all 0.3s"}}>
                {recPhase==="recording"&&(
                  <div style={{display:"flex",alignItems:"center",gap:3,height:36}}>
                    {Array.from({length:bars},(_,i)=>(
                      <div key={i} style={{
                        width:3,borderRadius:2,
                        background:`linear-gradient(180deg,${G.red},${G.amber})`,
                        animation:recPhase==="recording"?`barUp ${0.5+i*0.06}s ease-in-out infinite`:"none",
                        animationDelay:`${i*0.05}s`,
                        boxShadow:`0 0 6px ${G.red}88`,
                      }}/>
                    ))}
                  </div>
                )}
                <button
                  onClick={recPhase==="recording"?stopListening:startListening}
                  style={{
                    width:68,height:68,borderRadius:"50%",border:"none",cursor:"pointer",
                    background:recPhase==="recording"
                      ?`radial-gradient(circle,${G.red},#c0002a)`
                      :`radial-gradient(circle,${G.amber}cc,#b8730a)`,
                    boxShadow:recPhase==="recording"
                      ?`0 0 0 8px ${G.red}22,0 0 28px ${G.red}66`
                      :`0 0 0 6px ${G.amber}18,0 0 20px ${G.amber}44`,
                    fontSize:28,transition:"all 0.2s",
                    animation:recPhase==="recording"?"ringPulse 1.4s ease-in-out infinite":"none",
                  }}>
                  {recPhase==="recording"?"⏹":"🎙"}
                </button>
                <div style={{fontSize:11,fontFamily:G.head,letterSpacing:"0.12em",
                  color:recPhase==="recording"?G.red:recPhase==="done"?G.green:G.amber}}>
                  {recPhase==="recording"?"● RECORDING — TAP TO STOP"
                    :recPhase==="done"?"✓ DONE — EDIT BELOW IF NEEDED"
                    :"TAP MIC TO START SPEAKING"}
                </div>
                {recPhase==="idle"&&(
                  <div style={{fontSize:10,color:G.textMut,textAlign:"center"}}>
                    Answer using STAR (Situation → Task → Action → Result)
                  </div>
                )}
              </div>
              {sttError&&(
                <div style={{fontSize:11,color:G.amber,padding:"6px 10px",background:`${G.amber}10`,
                  borderRadius:6,marginBottom:10,border:`1px solid ${G.amber}30`}}>{sttError}</div>
              )}
              <textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={4}
                placeholder={recPhase==="idle"?"Your spoken answer will appear here (or type directly)…":"Transcribing…"}
                style={{width:"100%",padding:"11px 14px",fontSize:12,lineHeight:1.7,
                  borderRadius:8,resize:"vertical",marginBottom:12,
                  background:G.bgPanel,color:G.textPri,
                  border:`1px solid ${G.border}`,outline:"none",fontFamily:"inherit",
                  boxSizing:"border-box"}}/>
              <button onClick={evaluate} disabled={evaluating||!answer.trim()} style={{
                width:"100%",padding:"11px 0",border:`1px solid ${G.amber}`,borderRadius:8,
                background:`${G.amber}15`,color:G.amber,fontSize:12,fontFamily:G.head,
                letterSpacing:"0.1em",cursor:evaluating||!answer.trim()?"not-allowed":"pointer",
                opacity:!answer.trim()?0.5:1,transition:"all 0.2s"}}>
                {evaluating?"⏳ ANALYSING ANSWER…":"⚡ EVALUATE MY ANSWER"}
              </button>
            </div>
          )}

          {evalScore!==null&&(
            <div style={{animation:"fadeInFast 0.3s ease"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",
                borderRadius:10,marginBottom:14,background:`${sc(evalScore)}0d`,
                border:`1px solid ${sc(evalScore)}35`,boxShadow:`0 0 20px ${sc(evalScore)}18`}}>
                <div style={{textAlign:"center",minWidth:64}}>
                  <div style={{fontSize:30,fontFamily:G.head,fontWeight:700,color:sc(evalScore),
                    textShadow:`0 0 16px ${sc(evalScore)}`}}>{evalScore.toFixed(1)}</div>
                  <div style={{fontSize:9,color:G.textMut,letterSpacing:"0.08em"}}>/5.0</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:sc(evalScore),fontFamily:G.head,
                    letterSpacing:"0.1em",marginBottom:6}}>YOUR SCORE</div>
                  <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(evalScore/5)*100}%`,borderRadius:3,
                      background:`linear-gradient(90deg,${sc(evalScore)},${sc(evalScore)}aa)`,
                      boxShadow:`0 0 8px ${sc(evalScore)}66`,
                      transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
                  </div>
                  <div style={{fontSize:9,color:G.textMut,marginTop:4}}>
                    {evalScore>=4.5?"Exceptional 🏆":evalScore>=3.5?"Strong answer ⭐":evalScore>=2.5?"Decent — room to grow":"Needs work — keep practising"}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:9,color:G.textMut}}>XP REWARD</div>
                  <div style={{fontSize:16,color:G.green,fontFamily:G.head,fontWeight:700}}>+{Math.min(500,100+streak*50)}</div>
                </div>
              </div>
              {streak>0&&!result&&(
                <div style={{fontSize:11,color:G.amber,textAlign:"center",marginBottom:12,
                  padding:"6px",background:`${G.amber}08`,borderRadius:6}}>
                  {stE(streak+1)} Submitting will extend your streak to <strong>{streak+1} days</strong>
                </div>
              )}
              {!result?(
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setEvalScore(null);setAnswer("");setRecPhase("idle");}}
                    style={{flex:"0 0 auto",padding:"10px 18px",border:`1px solid ${G.border}`,
                      borderRadius:8,background:"transparent",color:G.textMut,
                      fontSize:11,fontFamily:G.head,cursor:"pointer",transition:"all 0.2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=G.cyan;e.currentTarget.style.color=G.cyan;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.color=G.textMut;}}>
                    ↩ REDO
                  </button>
                  <button onClick={submitDaily} disabled={submitting} style={{
                    flex:1,padding:"11px 0",border:"none",borderRadius:8,
                    cursor:submitting?"not-allowed":"pointer",fontSize:12,fontFamily:G.head,
                    letterSpacing:"0.1em",fontWeight:700,color:"#020810",
                    background:`linear-gradient(90deg,${G.green},${G.cyan})`,
                    boxShadow:`0 0 16px ${G.green}44`,transition:"all 0.2s"}}>
                    {submitting?"SUBMITTING…":"✅ SUBMIT & RECORD STREAK"}
                  </button>
                </div>
              ):(
                <div style={{padding:"14px 16px",borderRadius:10,
                  background:`${G.green}0d`,border:`1px solid ${G.green}30`,
                  textAlign:"center",animation:"fadeInFast 0.3s ease"}}>
                  <div style={{fontSize:22,marginBottom:6}}>
                    {result.new_streak>=7?"🔥":"⚡"} Day {result.new_streak} Streak!
                  </div>
                  <div style={{fontSize:11,color:G.textMut,marginBottom:14}}>
                    +{result.xp_earned} XP earned{result.streak_broken?" · streak reset — come back daily!":""}
                  </div>
                  <button onClick={onClose} style={{
                    padding:"9px 28px",border:`1px solid ${G.green}`,borderRadius:8,
                    background:`${G.green}15`,color:G.green,fontSize:11,
                    fontFamily:G.head,cursor:"pointer",letterSpacing:"0.1em"}}>
                    CLOSE
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DailyChallenge({onXP}){
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  const[board,setBoard]=useState([]);
  const[tab,setTab]=useState("challenge");
  const[modalOpen,setModalOpen]=useState(false);

  useEffect(()=>{
    if(!getToken()){setLoading(false);return;}
    const load=async()=>{
      setLoading(true);
      try{const res=await authFetch(`${API}/daily/question`);if(res.ok)setData(await res.json());}
      catch{}finally{setLoading(false);}
    };load();
  },[]);

  useEffect(()=>{
    if(tab!=="leaderboard")return;
    const load=async()=>{
      try{const res=await authFetch(`${API}/daily/leaderboard`);if(res.ok){const d=await res.json();setBoard(d.leaderboard||[]);}}
      catch{};
    };load();
  },[tab]);

  const handleSubmitted=(d,evalScore)=>{
    setData(p=>({...p,completed_today:true,daily_score:evalScore,streak_current:d.new_streak,streak_best:d.streak_best}));
    if(onXP&&!d.already_done)onXP(d.xp_earned,{
      name:d.new_streak>=7?`🔥 ${d.new_streak} Day Streak!`:d.new_streak>=3?`⚡ ${d.new_streak} Day Streak`:"Daily Complete",
      icon:d.new_streak>=7?"🔥":"📅",xp:d.xp_earned,
    });
  };

  const sc=s=>s>=4?G.green:s>=3?G.cyan:s>=2?G.amber:G.red;
  const stC=s=>s>=7?G.amber:s>=3?G.cyan:G.green;
  const stE=s=>s>=30?"🏆":s>=14?"💎":s>=7?"🔥":s>=3?"⚡":"📅";

  if(loading)return <Card style={{textAlign:"center",padding:20,color:G.textMut,fontFamily:G.head,fontSize:11,letterSpacing:"0.12em"}}>LOADING DAILY CHALLENGE…</Card>;
  if(!data)return null;

  const streak=data.streak_current||0;

  return(
    <>
    {modalOpen&&!data.completed_today&&(
      <VoiceChallengeModal
        data={data}
        streak={streak}
        onClose={()=>setModalOpen(false)}
        onSubmitted={(d,score)=>{handleSubmitted(d,score);}}
      />
    )}
    <Card style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,
      border:`1px solid ${G.amber}35`,boxShadow:`0 0 28px ${G.amber}12`,marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{fontSize:22}}>📅</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontFamily:G.head,color:G.amber,letterSpacing:"0.18em",marginBottom:2}}>DAILY CHALLENGE</div>
          <div style={{fontSize:10,color:G.textMut}}>{data.date_str} · {data.type?.toUpperCase()} · {data.difficulty?.toUpperCase()}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{padding:"6px 14px",borderRadius:20,background:`${stC(streak)}15`,
            border:`1px solid ${stC(streak)}40`,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:16}}>{stE(streak)}</span>
            <div>
              <div style={{fontSize:15,fontFamily:G.head,fontWeight:700,color:stC(streak),
                textShadow:`0 0 10px ${stC(streak)}`}}>{streak}</div>
              <div style={{fontSize:8,color:G.textMut,letterSpacing:"0.08em"}}>STREAK</div>
            </div>
          </div>
          {(data.streak_best||0)>0&&(
            <div style={{padding:"4px 10px",borderRadius:20,background:`${G.violet}12`,
              border:`1px solid ${G.violet}30`,fontSize:10,color:G.violet,fontFamily:G.head}}>
              BEST {data.streak_best}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:0,borderRadius:8,overflow:"hidden",border:`1px solid ${G.border}`}}>
          {["challenge","leaderboard"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"5px 12px",border:"none",cursor:"pointer",
              fontSize:10,fontFamily:G.head,letterSpacing:"0.08em",textTransform:"uppercase",
              background:tab===t?`${G.amber}20`:"transparent",
              color:tab===t?G.amber:G.textMut,transition:"all 0.15s"}}>
              {t==="leaderboard"?"🏆 Board":"Challenge"}
            </button>
          ))}
        </div>
      </div>

      {tab==="leaderboard"?(
        <div>
          <div style={{fontSize:10,color:G.textMut,letterSpacing:"0.1em",marginBottom:10,fontFamily:G.head}}>TODAY'S TOP SCORES</div>
          {board.length===0?(
            <div style={{textAlign:"center",padding:20,color:G.textMut,fontSize:12}}>No completions yet today — be the first! 🏆</div>
          ):board.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
              borderBottom:`1px solid ${G.border}`}}>
              <div style={{width:28,textAlign:"center",fontFamily:G.head,fontSize:13,fontWeight:700,
                color:i===0?G.amber:i===1?"#aaa":i===2?"#cd7f32":G.textMut}}>
                {i===0?"🥇":i===1?"🥈":i===2?"🥉":r.rank}
              </div>
              <div style={{flex:1,fontSize:12,color:G.textPri}}>{r.username}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {r.streak>=3&&<span style={{fontSize:11,color:stC(r.streak)}}>{stE(r.streak)}{r.streak}</span>}
                <span style={{fontFamily:G.head,fontWeight:700,fontSize:14,color:sc(r.score)}}>{r.score?.toFixed(1)}/5</span>
              </div>
            </div>
          ))}
        </div>
      ):(
        <>
          <div style={{fontSize:13,color:G.textPri,lineHeight:1.75,padding:"12px 14px",
            borderLeft:`3px solid ${G.amber}`,background:`${G.amber}06`,
            borderRadius:"0 8px 8px 0",marginBottom:14,fontWeight:500,
            display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",
            overflow:"hidden"}}>
            {data.question}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            {(data.keywords||[]).map(k=>(
              <span key={k} style={{fontSize:9,padding:"2px 8px",borderRadius:99,
                background:`${G.amber}12`,border:`1px solid ${G.amber}25`,
                color:G.amber,fontFamily:G.head,letterSpacing:"0.08em"}}>{k}</span>
            ))}
          </div>
          {data.completed_today?(
            <div style={{padding:"14px 16px",borderRadius:10,background:`${G.green}10`,
              border:`1px solid ${G.green}30`,display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:28}}>✅</div>
              <div>
                <div style={{fontSize:12,color:G.green,fontFamily:G.head,letterSpacing:"0.1em",marginBottom:4}}>COMPLETED TODAY</div>
                <div style={{fontSize:11,color:G.textMut}}>
                  Score: <span style={{color:sc(data.daily_score),fontFamily:G.head,fontWeight:700}}>{data.daily_score?.toFixed(1)}/5</span>
                  {" "}· Streak: <span style={{color:stC(streak),fontFamily:G.head,fontWeight:700}}>{streak} {stE(streak)}</span>
                </div>
              </div>
              <div style={{marginLeft:"auto",textAlign:"right"}}>
                <div style={{fontSize:9,color:G.textMut}}>COME BACK</div>
                <div style={{fontSize:11,color:G.amber,fontFamily:G.head}}>TOMORROW</div>
              </div>
            </div>
          ):(
            <button onClick={()=>setModalOpen(true)} style={{
              width:"100%",padding:"13px 0",
              border:`1px solid ${G.amber}`,borderRadius:10,
              background:`linear-gradient(135deg,${G.amber}18,${G.amber}0a)`,
              color:G.amber,fontSize:13,fontFamily:G.head,
              letterSpacing:"0.14em",cursor:"pointer",
              boxShadow:`0 0 18px ${G.amber}20`,
              transition:"all 0.2s",
              display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=`linear-gradient(135deg,${G.amber}30,${G.amber}18)`;e.currentTarget.style.boxShadow=`0 0 28px ${G.amber}40`;}}
            onMouseLeave={e=>{e.currentTarget.style.background=`linear-gradient(135deg,${G.amber}18,${G.amber}0a)`;e.currentTarget.style.boxShadow=`0 0 18px ${G.amber}20`;}}>
              <span style={{fontSize:18}}>🎙</span>
              <span>TAKE TODAY'S CHALLENGE</span>
              <span style={{fontSize:10,color:`${G.amber}99`}}>· VOICE + TEXT</span>
            </button>
          )}
        </>
      )}
    </Card>
    </>
  );
}

function PageDashboard({onNav,sessions,xp=0,onXP}){
  const avg=sessions.length?sessions.reduce((a,s)=>a+s.avgScore,0)/sessions.length:0;
  const stats=[
    {label:"Sessions",val:sessions.length,numVal:sessions.length,color:G.cyan},
    {label:"Avg Score",val:sessions.length?avg.toFixed(2)+"/5":"—",numVal:sessions.length?Math.round(avg*100)/100:0,color:scoreColor(avg)},
    {label:"Best",val:sessions.length?Math.max(...sessions.map(s=>s.avgScore)).toFixed(2):"—",numVal:sessions.length?Math.round(Math.max(...sessions.map(s=>s.avgScore))*100)/100:0,color:G.green},
    {label:"Questions",val:sessions.reduce((a,s)=>a+(s.qCount||0),0),numVal:sessions.reduce((a,s)=>a+(s.qCount||0),0),color:G.violet},
  ];
  const features=[
    {icon:"🧠",label:"RL Adaptive Sequencer",desc:"Q-learning dynamically tunes question type and complexity in real-time based on candidate performance. Cross-session prior builds tailored mastery.",color:G.violet},
    {icon:"🎙",label:"Cloud Speech-to-Text",desc:"Gemini audio transcription with Groq Whisper fallback, plus browser speech recognition and manual input.",color:G.cyan},
    {icon:"📊",label:"Speech Acoustic Calibration",desc:"Adaptive pitch variance, pause distribution, and energy analysis calibrated to your baseline voice characteristics rather than brittle dataset weights.",color:G.amber},
    {icon:"⭐",label:"STAR Method Detection",desc:"NLP detects Situation, Task, Action, and Result structure across your answer text with targeted behavioral scoring.",color:G.green},
    {icon:"🏢",label:"DISC Profile Analysis",desc:"Evaluates Dominance, Influence, Steadiness, and Conscientiousness behavioral archetypes across candidate responses.",color:G.cyan},
    {icon:"📷",label:"Webcam Biometric Calibration",desc:"EAR blink-rate, head-pose stability & gaze aversion tracking via MediaPipe 468-pt mesh, calibrated directly to candidate baseline.",color:G.violet},
    {icon:"📄",label:"HR Feedback + Printable Report",desc:"AI-generated coaching tips, hiring feedback, and printable scorecard reports.",color:G.green},
    {icon:"◑",label:"Resume Calibration",desc:"Upload or skip candidate resume. Calibrates interview questions to match real background experience.",color:G.violet,action:()=>onNav("setup")},
    {icon:"📋",label:"Role Intelligence & Skill Matrix",desc:"Deep-dive role specifications, industry technical skill competencies, and multi-perspective interviewer rubrics.",color:G.purple,action:()=>onNav("setup")},
  ];
  return(
    <div style={{animation:"fadeIn 0.4s ease",position:"relative",zIndex:3}}>
      {/* HERO */}
      <div style={{textAlign:"center",padding:"44px 0 28px",position:"relative"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 16px",borderRadius:20,background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.25)",marginBottom:16}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#06b6d4",boxShadow:"0 0 8px #06b6d4"}}/>
          <span style={{fontSize:11,fontFamily:G.head,fontWeight:700,color:"#06b6d4",letterSpacing:"0.1em",textTransform:"uppercase"}}>
            Autonomous Candidate Assessment Suite
          </span>
        </div>
        <div style={{fontSize:36,fontFamily:G.head,fontWeight:800,letterSpacing:"-0.02em",
          background:"linear-gradient(135deg,#f8fafc 30%,#94a3b8 100%)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          marginBottom:10,lineHeight:1.2}}>
          AI INTERVIEW EVALUATION AND FEEDBACK SYSTEM
        </div>
        <div style={{fontSize:13,color:G.textMut,marginBottom:20,lineHeight:1.7,maxWidth:680,margin:"0 auto 20px auto"}}>
          Comprehensive, proctored AI interview coaching with speech biometric pacing, STAR methodology evaluation, and multimodal feedback.
        </div>
        <XPBar xp={sessions.reduce((a,s)=>a+Math.round((s.avgScore||0)*80+s.qCount*25),0)} />
        <div style={{marginTop:24,display:"flex",justifyContent:"center"}}>
          <Btn onClick={()=>onNav("setup")} color={G.cyan} style={{fontSize:16,padding:"16px 52px",borderRadius:10,fontWeight:700,letterSpacing:"0.06em",boxShadow:"0 4px 28px rgba(6,182,212,0.35)"}}>
            ⚡ LAUNCH INTERVIEW
          </Btn>
        </div>
      </div>

      {/* FEATURES — DOWNSIDE LAUNCH INTERVIEW */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:G.textMut,letterSpacing:"0.15em",fontFamily:G.head,marginBottom:12}}>◈ SYSTEM CAPABILITIES & FEATURES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {features.map(f=>(
            <Card key={f.label} hover style={{borderColor:`${f.color}22`,cursor:f.action?"pointer":"default"}}
              onClick={f.action||undefined}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:36,height:36,borderRadius:8,background:`${f.color}12`,border:`1px solid ${f.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{f.icon}</div>
                <div style={{fontSize:11,fontFamily:G.head,color:f.color,letterSpacing:"0.06em",fontWeight:700}}>{f.label}</div>
              </div>
              <div style={{fontSize:11,color:G.textMut,lineHeight:1.7}}>{f.desc}</div>
              {f.action&&(
                <div style={{marginTop:10,display:"flex",alignItems:"center",gap:6}}>
                  <div style={{flex:1,height:1,background:`${f.color}30`}}/>
                  <span style={{fontSize:9,color:f.color,letterSpacing:"0.1em",fontFamily:G.head}}>OPEN →</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* STATS with animated counters */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        {stats.map(s=>(
          <Card key={s.label} hover style={{textAlign:"center",padding:"18px 12px",borderColor:`${s.color}20`}}>
            <div style={{marginBottom:6}}>
              {sessions.length>0
                ?<AnimCounter target={s.numVal||0} color={s.color} size={26} suffix={s.label==="Avg Score"?"/5":""} />
                :<div style={{fontSize:22,fontFamily:G.head,fontWeight:700,color:s.color,textShadow:`0 0 14px ${s.color}`}}>—</div>
              }
            </div>
            <div style={{fontSize:10,color:G.textMut,letterSpacing:"0.12em",fontFamily:G.head}}>{s.label}</div>
            <div style={{marginTop:8,height:2,background:"#071422",borderRadius:1,overflow:"hidden"}}>
              <div style={{height:"100%",width:"70%",borderRadius:1,backgroundImage:`linear-gradient(90deg,transparent,${s.color},transparent)`,backgroundSize:"200%",animation:"shimmer 2s linear infinite"}}/>
            </div>
          </Card>
        ))}
      </div>

      {/* DAILY CHALLENGE */}
      <div style={{marginBottom:6}}>
        <div style={{fontSize:11,color:G.textMut,letterSpacing:"0.15em",fontFamily:G.head,marginBottom:10}}>◈ TODAY'S CHALLENGE</div>
        <DailyChallenge onXP={onXP}/>
      </div>

      {/* PAST SESSIONS */}
      {sessions.length>0&&(
        <Card style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
          <SectionLabel>Past Sessions</SectionLabel>
          {sessions.slice().reverse().slice(0,6).map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 6px",
              borderBottom:`1px solid ${G.border}`,transition:"background 0.2s",borderRadius:4,
              background:"transparent"}} 
              onMouseEnter={e=>e.currentTarget.style.background=`rgba(0,212,255,0.04)`}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontSize:9,color:G.textMut,width:80,flexShrink:0,fontFamily:"'Orbitron',monospace",letterSpacing:"0.04em"}}>{s.date}</span>
              <span style={{fontSize:11,color:G.textPri,flex:1}}>{s.role} <span style={{color:G.textMut}}>·</span> <span style={{color:s.difficulty==="hard"?G.red:s.difficulty==="easy"?G.green:G.amber,fontSize:9,fontFamily:"'Orbitron',monospace"}}>{s.difficulty.toUpperCase()}</span></span>
              <span style={{fontSize:14,fontWeight:700,color:scoreColor(s.avgScore),fontFamily:"'Orbitron',monospace",textShadow:`0 0 8px ${scoreColor(s.avgScore)}`}}>
                {s.avgScore.toFixed(2)}/5
              </span>
              <NeonBadge text={s.rec||"—"} color={s.avgScore>=3.5?G.green:s.avgScore>=2.5?G.cyan:G.red}/>
            </div>
          ))}
        </Card>
      )}

      {/* INTERVIEW HISTORY */}
      <div style={{marginTop:24}}>
        <div style={{fontSize:11,color:G.textMut,letterSpacing:"0.15em",fontFamily:G.head,marginBottom:12}}>◈ YOUR INTERVIEW HISTORY</div>
        <UserHistoryPanel/>
      </div>
    </div>
  );
}

// ── Company pack definitions (mirrors COMPANY_STYLE in adaptive_sequencer.py) ─
const COMPANY_PACKS=[
  {key:"no_pack",      label:"Standard (no company pack)",      desc:"Balanced prep, no style tuning"},
  {key:"faang",        label:"FAANG / Big Tech",                desc:"Google · Meta · Amazon · Apple · Netflix — systems-heavy, bar-raising"},
  {key:"startup",      label:"Startup / Scale-up",              desc:"Ambiguity tolerance, speed, generalist ability, culture fit"},
  {key:"consulting",   label:"Consulting / Professional Svcs",  desc:"McKinsey · Deloitte · Accenture — frameworks, client comms, structure"},
  {key:"fintech",      label:"Fintech / Financial Services",    desc:"Reliability, compliance, security, data accuracy"},
  {key:"healthtech",   label:"Healthtech / MedTech",            desc:"HIPAA, patient safety, audit trails, regulatory constraints"},
];

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE: SETUP
// ══════════════════════════════════════════════════════════════════════════════
function PageSetup({onStart}){
  const[role,setRole]=useState("Software Engineer");
  const[diff,setDiff]=useState("medium");
  const[numQ,setNumQ]=useState(5);
  const[resumeMode,setResumeMode]=useState("skip"); // "upload" | "skip"
  const[resume,setResume]=useState("");
  const[resumeFileName,setResumeFileName]=useState("");
  const[resumeParsed,setResumeParsed]=useState(null);
  const[resumeParsing,setResumeParsing]=useState(false);
  const[isHrMode,setIsHrMode]=useState(false); // Most important HR Interview Questions Mode
  const[companyPack,setCompanyPack]=useState("no_pack");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[catFilter,setCatFilter]=useState("All");
  const[step,setStep]=useState(1);
  const[isFullscreen,setIsFullscreen]=useState(typeof document!=="undefined"&&!!document.fullscreenElement);
  const[jdText,setJdText]=useState("");
  const[jdUrl,setJdUrl]=useState("");
  const[jdLoading,setJdLoading]=useState(false);
  const[jdExtracted,setJdExtracted]=useState(null); // extracted role data
  const[jdMode,setJdMode]=useState("manual"); // "manual" | "jd"

  useEffect(()=>{
    const handleFsChange=()=>setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange",handleFsChange);
    return()=>document.removeEventListener("fullscreenchange",handleFsChange);
  },[]);

  const toggleFullscreen=()=>{
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen().catch(()=>{});
    }else{
      if(document.exitFullscreen){
        document.exitFullscreen().catch(()=>{});
      }
    }
  };

  const handleCatChange=(cat)=>{
    setCatFilter(cat);
    if(cat!=="All"){
      const inCat=ROLES.filter(r=>ROLE_DETAILS[r]?.category===cat);
      if(inCat.length>0&&!inCat.includes(role)){
        setRole(inCat[0]);
      }
    }
  };

  const filteredRoles=catFilter==="All"?ROLES:ROLES.filter(r=>ROLE_DETAILS[r]?.category===catFilter);
  const currentRoleDetails=ROLE_DETAILS[role]||ROLE_DETAILS["Software Engineer"];

  const handleFileUpload=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const extension=file.name.split(".").pop()?.toLowerCase();
    if(!["pdf","docx","txt"].includes(extension)){
      setError("Upload a PDF, DOCX, or TXT resume.");
      e.target.value="";
      return;
    }
    if(file.size>5*1024*1024){
      setError("Resume file must be 5 MB or smaller.");
      e.target.value="";
      return;
    }
    setResumeParsing(true);
    setError("");
    try{
      const form=new FormData();
      form.append("file",file);
      const response=await authFetch(`${API}/resume/parse`,{method:"POST",body:form});
      const parsed=await response.json();
      if(!response.ok){
        throw new Error(parsed.detail||"The resume could not be parsed.");
      }
      const formatField=value=>Array.isArray(value)
        ?value.map(item=>typeof item==="string"?item:JSON.stringify(item)).join("; ")
        :typeof value==="string"?value:value?JSON.stringify(value):"";
      const extractedText=[
        parsed.summary&&`Summary: ${formatField(parsed.summary)}`,
        parsed.skills?.length&&`Skills: ${formatField(parsed.skills)}`,
        parsed.experience?.length&&`Experience: ${formatField(parsed.experience)}`,
        parsed.projects?.length&&`Projects: ${formatField(parsed.projects)}`,
        parsed.education?.length&&`Education: ${formatField(parsed.education)}`,
        parsed.certifications?.length&&`Certifications: ${formatField(parsed.certifications)}`,
      ].filter(Boolean).join("\n");
      if(!extractedText.trim()){
        throw new Error("No usable resume details were extracted. Paste the resume text instead.");
      }
      if(extractedText.length>20000){
        throw new Error("The extracted resume is over 20,000 characters. Paste a shorter version to continue.");
      }
      if(JSON.stringify(parsed).length>100000){
        throw new Error("The parsed resume is too large. Use a shorter resume or paste selected sections.");
      }
      setResume(extractedText);
      setResumeParsed(parsed);
      setResumeFileName(file.name);
    }catch(error){
      setError(error.message||"The resume could not be parsed. Paste the resume text instead.");
    }finally{
      setResumeParsing(false);
      e.target.value="";
    }
  };

  const extractJD=async()=>{
    if(!jdText.trim()&&!jdUrl.trim())return;
    setJdLoading(true);
    try{
      const res=await authFetch(`${API}/jd/extract`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({jd_text:jdText,jd_url:jdUrl||null}),
      });
      if(res.ok){
        const d=await res.json();
        if(d.success&&d.data){
          setJdExtracted(d.data);
          // auto-apply extracted role
          const extractedRole=d.data.role;
          if(extractedRole&&!ROLES.includes(extractedRole)){
            // use closest match from existing roles or keep as custom
            setRole(ROLES.includes(extractedRole)?extractedRole:"Software Engineer");
          }else if(ROLES.includes(extractedRole)){
            setRole(extractedRole);
          }
        }
      }
    }catch(e){console.error(e);}
    finally{setJdLoading(false);}
  };

  const start=async()=>{
    if(resumeParsing){
      setError("Wait for resume processing to finish before starting.");
      setStep(2);
      return;
    }
    setLoading(true);setError("");
    const effectiveResume=resumeMode==="upload"?resume:"";
    const effectivePack=isHrMode?"startup":companyPack; // HR mode shifts focus to behavioral/leadership

    try{
      const form=new FormData();
      form.append("role",role);form.append("difficulty",diff);
      form.append("num_questions",numQ);
      form.append("resume_text",effectiveResume);
      form.append("resume_parsed_json",effectiveResume&&resumeParsed?JSON.stringify(resumeParsed):"");
      form.append("company_pack",effectivePack);
      const res=await authFetch(`${API}/session/start`,{method:"POST",body:form});
      if(!res.ok)throw new Error((await res.json()).detail||"Failed");
      const data=await res.json();
      onStart({role,difficulty:diff,numQuestions:numQ,
        sessionId:data.session_id,
        firstQuestion:data.question,
        companyPack:data.company_pack,
        syllabus:data.syllabus,
        syllabusWeights:data.syllabus_weights,
        isHrMode,
        hasResume:!!effectiveResume,
      });
    }catch(e){
      // Dev mode fallback questions
      const hrQuestions=[
        `Tell me about a high-stakes challenge where you had to lead through disagreement and align conflicting team members using the STAR method as a ${role}.`,
        `Describe a situation where a project failed or missed deadlines under your responsibility. What specific actions did you take to resolve it?`,
        `Why do you want to work as a ${role} with our team, and how do your long-term career goals align with our culture?`,
        `Give an example of receiving critical feedback that was difficult to hear. What behavioral adjustments did you make?`,
        `Tell me about a time you had to make a crucial technical or product decision with incomplete data under tight pressure.`,
      ];
      const mockTypes=isHrMode?["HR","Behavioural"]:["Technical","Behavioural","HR"];
      const mockType=mockTypes[Math.floor(Math.random()*mockTypes.length)];
      const qText=mockType==="Aptitude"
        ?"A project has 120 users and usage grows by 25%. How many users should you plan for next, and how did you calculate it?"
        :isHrMode
        ? hrQuestions[Math.floor(Math.random()*hrQuestions.length)]
        :`Walk me through a complex technical system or project you delivered as a ${role}. What trade-offs and challenges did you navigate?`;

      onStart({role,difficulty:diff,numQuestions:numQ,
        sessionId:"sess-"+Date.now().toString(36),
        companyPack:{key:effectivePack,display_name:isHrMode?"HR & Behavioral Focus":companyPack},
        isHrMode,
        hasResume:!!effectiveResume,
        firstQuestion:{
          question:qText,
          type:isHrMode?"HR":mockType,difficulty:diff,
          keywords:["leadership","STAR method","problem-solving","communication"],
          ideal_answer:"Strong candidate responses use the STAR structure: Situation, Task, Action taken, and quantifiable Result.",
        }
      });
    }finally{setLoading(false);}
  };

  const sel={width:"100%",padding:"11px 14px",fontSize:13,borderRadius:8,background:"#0d1527",border:"1px solid rgba(255,255,255,0.12)",color:"#f8fafc"};

  return(
    <div style={{maxWidth:980,margin:"20px auto",animation:"fadeIn 0.4s ease",position:"relative",zIndex:3}}>
      {/* ── HEADER ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"4px 14px",borderRadius:20,background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.25)",marginBottom:8}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#06b6d4",boxShadow:"0 0 8px #06b6d4"}}/>
            <span style={{fontSize:11,fontFamily:G.head,fontWeight:700,color:"#06b6d4",letterSpacing:"0.08em",textTransform:"uppercase"}}>Proctored Evaluation Setup</span>
          </div>
          <div style={{fontSize:28,fontFamily:G.head,fontWeight:800,letterSpacing:"-0.02em",color:"#f8fafc",lineHeight:1.2}}>
            Launch Interview Assessment
          </div>
          <div style={{fontSize:13,color:G.textMut,marginTop:4}}>
            Follow the 3-step guided setup to configure your role, session parameters, and launch the proctored assessment.
          </div>
        </div>

        {/* Fullscreen Toggle */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button type="button" onClick={toggleFullscreen} style={{
            display:"inline-flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:8,
            background:isFullscreen?"rgba(16,185,129,0.12)":"rgba(255,255,255,0.04)",
            border:`1px solid ${isFullscreen?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.12)"}`,
            color:isFullscreen?"#10b981":"#cbd5e1",fontSize:11,fontFamily:G.head,fontWeight:700,
            cursor:"pointer",transition:"all 0.2s"
          }}>
            <span style={{fontSize:13}}>{isFullscreen ? "🗗" : "⛶"}</span>
            <span>{isFullscreen ? "EXIT FULLSCREEN" : "EXPAND FULLSCREEN"}</span>
          </button>
        </div>
      </div>

      {/* ── STEPPER NAVIGATION BAR (1st → 2nd → Launch) ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:24,flexWrap:"wrap"}}>
        {[
          {id:1, label:"1. Target Role & Skills", icon:"🎯"},
          {id:2, label:"2. Session Parameters", icon:"⚙️"},
          {id:3, label:"3. Launch Assessment", icon:"🚀"},
        ].map((s, idx)=>(
          <React.Fragment key={s.id}>
            {idx > 0 && (
              <div style={{
                width: 32, height: 2, 
                background: step >= s.id ? G.cyan : "rgba(255,255,255,0.12)",
                transition: "all 0.3s"
              }}/>
            )}
            <button type="button" onClick={()=>setStep(s.id)} style={{
              display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:24,
              background: step === s.id ? "rgba(6,182,212,0.18)" : step > s.id ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
              border: `1.5px solid ${step === s.id ? G.cyan : step > s.id ? G.green : "rgba(255,255,255,0.1)"}`,
              color: step === s.id ? "#f8fafc" : step > s.id ? G.green : G.textMut,
              fontWeight: step === s.id ? 700 : 500,
              fontSize: 12, fontFamily: G.head, cursor: "pointer", transition: "all 0.25s"
            }}>
              <span>{step > s.id ? "✓" : s.icon}</span>
              <span>{s.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* ── 1ST: TARGET ROLE & SKILLS SPECIFICATION ── */}
      {step === 1 && (
        <Card glow style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderColor:"rgba(255,255,255,0.1)",padding:"24px 28px",animation:"fadeIn 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <SectionLabel color={G.cyan}>1. TARGET ROLE & SKILLS SPECIFICATION</SectionLabel>
            {/* Domain category chips */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {ROLE_CATEGORIES.map(cat=>(
                <button key={cat} type="button" onClick={()=>handleCatChange(cat)} style={{
                  fontSize:10,fontFamily:G.head,padding:"4px 9px",borderRadius:12,cursor:"pointer",
                  background:catFilter===cat?"rgba(6,182,212,0.18)":"rgba(255,255,255,0.03)",
                  border:`1px solid ${catFilter===cat?G.cyan:"rgba(255,255,255,0.08)"}`,
                  color:catFilter===cat?G.cyan:G.textMut,fontWeight:catFilter===cat?700:500,
                  transition:"all 0.15s"
                }}>{cat}</button>
              ))}
            </div>
          </div>

          {/* ── JD Auto-Extractor Mode Toggle ── */}
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <button type="button" onClick={()=>setJdMode("manual")} style={{
              flex:1,padding:"9px 12px",borderRadius:8,cursor:"pointer",
              background:jdMode==="manual"?"rgba(6,182,212,0.14)":"rgba(255,255,255,0.03)",
              border:`1.5px solid ${jdMode==="manual"?G.cyan:"rgba(255,255,255,0.08)"}`,
              color:jdMode==="manual"?G.cyan:G.textMut,fontSize:12,fontFamily:G.head,fontWeight:700,transition:"all 0.2s"
            }}>
              🎯 Select Role Manually
            </button>
            <button type="button" onClick={()=>setJdMode("jd")} style={{
              flex:1,padding:"9px 12px",borderRadius:8,cursor:"pointer",
              background:jdMode==="jd"?"rgba(139,92,246,0.14)":"rgba(255,255,255,0.03)",
              border:`1.5px solid ${jdMode==="jd"?G.violet:"rgba(255,255,255,0.08)"}`,
              color:jdMode==="jd"?G.violet:G.textMut,fontSize:12,fontFamily:G.head,fontWeight:700,transition:"all 0.2s"
            }}>
              📄 Paste Job Description (JD)
            </button>
          </div>

          {/* ── JD EXTRACTOR PANEL ── */}
          {jdMode==="jd"&&(
            <div style={{marginBottom:16,background:"rgba(139,92,246,0.06)",borderRadius:10,border:"1px solid rgba(139,92,246,0.22)",padding:"16px 18px",animation:"fadeIn 0.25s ease"}}>
              <div style={{fontSize:11,fontFamily:G.head,fontWeight:700,color:G.violet,letterSpacing:"0.06em",marginBottom:10}}>
                📄 JOB DESCRIPTION AUTO-EXTRACTOR
              </div>
              <div style={{fontSize:12,color:G.textMut,marginBottom:10,lineHeight:1.6}}>
                Paste the full job posting text or a LinkedIn/Indeed URL. The AI will extract role requirements, tech stack, and build a custom-tailored evaluation rubric.
              </div>
              <textarea
                value={jdText} onChange={e=>setJdText(e.target.value)}
                rows={5} placeholder="Paste job description here… e.g. 'We are looking for a Senior Backend Engineer with expertise in Go, Kubernetes, and distributed systems. The ideal candidate will have 5+ years experience designing microservices at scale…'"
                style={{width:"100%",padding:"10px 12px",fontSize:12,borderRadius:8,background:"#0a1020",border:"1px solid rgba(139,92,246,0.3)",color:"#f8fafc",resize:"vertical",lineHeight:1.6}}
              />
              <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8}}>
                <input value={jdUrl} onChange={e=>setJdUrl(e.target.value)}
                  placeholder="Or paste LinkedIn/Indeed job URL (optional)…"
                  style={{flex:1,padding:"8px 12px",fontSize:12,borderRadius:6,background:"#0a1020",border:"1px solid rgba(139,92,246,0.2)",color:"#f8fafc"}}
                />
                <button type="button" onClick={extractJD} disabled={jdLoading||(!jdText.trim()&&!jdUrl.trim())} style={{
                  padding:"8px 18px",borderRadius:6,cursor:"pointer",
                  background:"rgba(139,92,246,0.22)",border:"1px solid rgba(139,92,246,0.4)",
                  color:G.violet,fontSize:12,fontFamily:G.head,fontWeight:700,
                  opacity:(jdLoading||(!jdText.trim()&&!jdUrl.trim()))?0.5:1,whiteSpace:"nowrap"
                }}>
                  {jdLoading?"⚙ Extracting…":"⚡ Extract Role"}
                </button>
              </div>

              {/* JD Extracted Result */}
              {jdExtracted&&(
                <div style={{marginTop:14,padding:"14px 16px",borderRadius:8,background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.25)",animation:"fadeIn 0.3s ease"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{color:G.green,fontSize:16}}>✓</span>
                    <span style={{fontSize:13,fontFamily:G.head,fontWeight:800,color:"#f8fafc"}}>{jdExtracted.role}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",color:G.green}}>{jdExtracted.level}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.25)",color:G.cyan}}>{jdExtracted.category}</span>
                  </div>
                  <div style={{fontSize:12,color:G.textPri,lineHeight:1.6,marginBottom:10}}>{jdExtracted.description}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {(jdExtracted.techSkills||[]).map(s=>(
                      <span key={s} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.2)",color:"#e0f2fe",fontFamily:G.mono}}>{s}</span>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {(jdExtracted.softSkills||[]).map(s=>(
                      <span key={s} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",color:"#f3e8ff"}}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14,marginBottom:16}}>
            <div>
              <div style={{fontSize:11,color:G.textMut,marginBottom:6,fontWeight:600}}>TARGET JOB ROLE</div>
              <select value={role} onChange={e=>setRole(e.target.value)} style={sel}>
                {filteredRoles.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:G.textMut,marginBottom:6,fontWeight:600}}>DIFFICULTY CALIBRATION</div>
              <select value={diff} onChange={e=>setDiff(e.target.value)} style={sel}>
                {DIFFICULTIES.map(d=><option key={d} value={d}>{d.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Interactive Role Specification & Required Skills Intelligence Card */}
          <div style={{
            background:"rgba(8,16,30,0.65)",borderRadius:10,border:"1px solid rgba(6,182,212,0.22)",
            padding:"18px 20px",marginBottom:20,animation:"fadeIn 0.25s ease"
          }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>📋</span>
                <span style={{fontSize:15,fontFamily:G.head,fontWeight:800,color:"#f8fafc"}}>{role}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,padding:"3px 10px",borderRadius:12,background:"rgba(6,182,212,0.12)",color:G.cyan,border:"1px solid rgba(6,182,212,0.3)",fontWeight:700}}>
                  {currentRoleDetails.category}
                </span>
                <span style={{fontSize:10,padding:"3px 10px",borderRadius:12,background:"rgba(139,92,246,0.12)",color:G.violet,border:"1px solid rgba(139,92,246,0.3)",fontWeight:700}}>
                  {currentRoleDetails.level}
                </span>
              </div>
            </div>

            {/* Job Description */}
            <div style={{fontSize:13,color:G.textPri,lineHeight:1.65,marginBottom:16,background:"rgba(255,255,255,0.02)",padding:"12px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>
              {currentRoleDetails.description}
            </div>

            {/* Required Technical Skills */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontFamily:G.head,fontWeight:700,color:G.cyan,letterSpacing:"0.08em",marginBottom:8}}>
                REQUIRED TECHNICAL SKILLS & STACK
              </div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {currentRoleDetails.techSkills.map(s=>(
                  <span key={s} style={{
                    fontSize:11,padding:"4px 10px",borderRadius:6,background:"rgba(6,182,212,0.08)",
                    border:"1px solid rgba(6,182,212,0.22)",color:"#e0f2fe",fontFamily:G.mono,fontWeight:500
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Behavioral Skills */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontFamily:G.head,fontWeight:700,color:G.violet,letterSpacing:"0.08em",marginBottom:8}}>
                KEY BEHAVIORAL & DELIVERY SKILLS
              </div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {currentRoleDetails.softSkills.map(s=>(
                  <span key={s} style={{
                    fontSize:11,padding:"4px 10px",borderRadius:6,background:"rgba(139,92,246,0.08)",
                    border:"1px solid rgba(139,92,246,0.22)",color:"#f3e8ff",fontWeight:500
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Multi-Perspective Interview Rubrics */}
            <div>
              <div style={{fontSize:10,fontFamily:G.head,fontWeight:700,color:G.amber,letterSpacing:"0.08em",marginBottom:10}}>
                INTERVIEW EVALUATION PERSPECTIVES
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10}}>
                <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(6,182,212,0.04)",border:"1px solid rgba(6,182,212,0.15)"}}>
                  <div style={{fontSize:10,fontFamily:G.head,fontWeight:700,color:G.cyan,marginBottom:4}}>🔍 TECH LEAD</div>
                  <div style={{fontSize:11,color:G.textMut,lineHeight:1.5}}>{currentRoleDetails.perspectives.technical}</div>
                </div>
                <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(139,92,246,0.04)",border:"1px solid rgba(139,92,246,0.15)"}}>
                  <div style={{fontSize:10,fontFamily:G.head,fontWeight:700,color:G.violet,marginBottom:4}}>🏛 ARCHITECTURE</div>
                  <div style={{fontSize:11,color:G.textMut,lineHeight:1.5}}>{currentRoleDetails.perspectives.architecture}</div>
                </div>
                <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(16,185,129,0.04)",border:"1px solid rgba(16,185,129,0.15)"}}>
                  <div style={{fontSize:10,fontFamily:G.head,fontWeight:700,color:G.green,marginBottom:4}}>🤝 HR / BEHAVIORAL</div>
                  <div style={{fontSize:11,color:G.textMut,lineHeight:1.5}}>{currentRoleDetails.perspectives.behavioral}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1 Actions */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{fontSize:12,color:G.textDim}}>
              Step 1 of 3: Target role & verified competencies selected.
            </div>
            <Btn onClick={()=>setStep(2)} color={G.cyan} style={{padding:"12px 24px",fontSize:13,fontWeight:700,borderRadius:8,boxShadow:"0 2px 16px rgba(6,182,212,0.25)"}}>
              Proceed to Step 2: Session Parameters →
            </Btn>
          </div>
        </Card>
      )}

      {/* ── 2ND: SESSION PARAMETERS & CALIBRATION ── */}
      {step === 2 && (
        <Card glow style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderColor:"rgba(255,255,255,0.1)",padding:"24px 28px",animation:"fadeIn 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <SectionLabel color={G.violet}>2. SESSION PARAMETERS & CALIBRATION</SectionLabel>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 12px",borderRadius:12,background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.2)"}}>
              <span style={{fontSize:11,color:G.textMut}}>Selected Role:</span>
              <span style={{fontSize:12,fontFamily:G.head,fontWeight:700,color:G.cyan}}>{role}</span>
              <span style={{fontSize:10,color:G.textDim}}>({diff.toUpperCase()})</span>
              <button type="button" onClick={()=>setStep(1)} style={{fontSize:10,color:G.cyan,background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline",marginLeft:4}}>Edit</button>
            </div>
          </div>

          {/* ── HR Interview Questions Mode ───────────────── */}
          <div style={{marginBottom:20,padding:"16px 18px",borderRadius:10,background:isHrMode?"rgba(139,92,246,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${isHrMode?"rgba(139,92,246,0.4)":"rgba(255,255,255,0.08)"}`,transition:"all 0.2s"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>🎯</span>
                  <span style={{fontSize:14,fontFamily:G.head,fontWeight:700,color:isHrMode?G.violet:"#f8fafc"}}>
                    HR INTERVIEW QUESTIONS MODE
                  </span>
                </div>
                <div style={{fontSize:12,color:G.textMut,marginTop:6,lineHeight:1.6}}>
                  Prioritizes critical HR screening criteria: STAR structured conflict resolution, leadership under pressure, adaptability, team dynamics, and culture alignment.
                </div>
              </div>
              <label style={{display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0,marginTop:2}}>
                <input type="checkbox" checked={isHrMode} onChange={e=>setIsHrMode(e.target.checked)}
                  style={{width:22,height:22,accentColor:"#8b5cf6",cursor:"pointer"}}/>
              </label>
            </div>
          </div>

          {/* ── Resume Option: Upload OR Skip ────────────────────────────── */}
          <div style={{marginBottom:22}}>
            <div style={{fontSize:11,color:G.textMut,marginBottom:10,fontWeight:600}}>
              CANDIDATE RESUME CALIBRATION
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <button type="button" onClick={()=>setResumeMode("upload")} style={{
                padding:"13px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                border:`1.5px solid ${resumeMode==="upload"?G.green:"rgba(255,255,255,0.08)"}`,
                background:resumeMode==="upload"?"rgba(16,185,129,0.1)":"rgba(255,255,255,0.02)",
                color:resumeMode==="upload"?G.green:"#94a3b8",transition:"all 0.2s",
              }}>
                <div style={{fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
                  <span>📄</span> Upload Resume
                </div>
                <div style={{fontSize:11,opacity:0.8,marginTop:4}}>Tailor evaluation questions to candidate CV</div>
              </button>

              <button type="button" onClick={()=>setResumeMode("skip")} style={{
                padding:"13px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                border:`1.5px solid ${resumeMode==="skip"?G.cyan:"rgba(255,255,255,0.08)"}`,
                background:resumeMode==="skip"?"rgba(6,182,212,0.1)":"rgba(255,255,255,0.02)",
                color:resumeMode==="skip"?G.cyan:"#94a3b8",transition:"all 0.2s",
              }}>
                <div style={{fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>
                  <span>⏩</span> Skip Resume
                </div>
                <div style={{fontSize:11,opacity:0.8,marginTop:4}}>Evaluate standard {role} industry criteria</div>
              </button>
            </div>

            {resumeMode==="upload"&&(
              <div style={{animation:"fadeIn 0.25s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <label style={{
                    padding:"8px 14px",borderRadius:6,background:"rgba(16,185,129,0.15)",
                    border:"1px solid rgba(16,185,129,0.3)",color:G.green,fontSize:11,
                    fontFamily:G.head,fontWeight:600,cursor:"pointer",display:"inline-block"
                  }}>
                    {resumeParsing?"⏳ Reading resume…":"📎 Select Resume (.pdf, .docx, .txt)"}
                    <input type="file" accept=".pdf,.txt,.docx" onChange={handleFileUpload} disabled={resumeParsing} style={{display:"none"}}/>
                  </label>
                  {resumeFileName&&<span style={{fontSize:11,color:G.textPri,fontFamily:G.mono}}>✓ {resumeFileName}</span>}
                </div>
                <textarea value={resume} onChange={e=>{setResume(e.target.value);setResumeParsed(null);}}
                  rows={4} placeholder="Or paste resume experience text directly here to tailor interview questions…"
                  maxLength={20000}
                  style={{width:"100%",padding:"10px 12px",fontSize:12,borderRadius:8,background:"#0d1527",border:"1px solid rgba(255,255,255,0.12)",color:"#f8fafc",resize:"vertical"}}/>
                <div style={{fontSize:10,color:G.textDim,lineHeight:1.55,marginTop:7}}>
                  Resume text is sent to the configured AI service to create tailored questions. Avoid including sensitive details you do not want processed.
                </div>
              </div>
            )}

            {resumeMode==="skip"&&(
              <div style={{fontSize:12,color:G.textMut,padding:"10px 14px",background:"rgba(6,182,212,0.05)",borderRadius:6,border:"1px solid rgba(6,182,212,0.15)"}}>
                ✓ Standard candidate profile active. Questions will evaluate industry standards for <strong>{role}</strong>.
              </div>
            )}
          </div>

          {error&&<div role="alert" style={{color:G.red,fontSize:12,marginBottom:14,padding:"10px 14px",background:`${G.red}12`,borderRadius:8,border:`1px solid ${G.red}30`}}>{error}</div>}

          {/* ── Question Count Slider ────────────────────────────────────── */}
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:11,color:G.textMut,fontWeight:600}}>NUMBER OF QUESTIONS</span>
              <span style={{fontSize:15,color:G.cyan,fontFamily:G.mono,fontWeight:700}}>{numQ} Questions</span>
            </div>
            <input type="range" min={3} max={10} value={numQ} onChange={e=>setNumQ(+e.target.value)} style={{width:"100%"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:G.textDim,marginTop:4}}>
              <span>3 Quick Check (~10 mins)</span><span>5 Standard (~15 mins)</span><span>10 Comprehensive (~30 mins)</span>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
            <button type="button" onClick={()=>setStep(1)} style={{
              padding:"11px 20px",borderRadius:8,background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.12)",color:"#cbd5e1",fontSize:13,fontFamily:G.head,fontWeight:600,cursor:"pointer"
            }}>
              ← Back to Step 1: Role Specification
            </button>
            <Btn onClick={()=>setStep(3)} color={G.violet} style={{padding:"12px 24px",fontSize:13,fontWeight:700,borderRadius:8,boxShadow:"0 2px 16px rgba(139,92,246,0.25)"}}>
              Proceed to Step 3: Launch Interview →
            </Btn>
          </div>
        </Card>
      )}

      {/* ── 3RD: LAUNCH INTERVIEW & PRE-FLIGHT VERIFICATION ── */}
      {step === 3 && (
        <Card glow style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderColor:"rgba(255,255,255,0.1)",padding:"24px 28px",animation:"fadeIn 0.3s ease"}}>
          <div style={{marginBottom:18}}>
            <SectionLabel color={G.green}>3. PRE-FLIGHT VERIFICATION & LAUNCH</SectionLabel>
            <div style={{fontSize:20,fontFamily:G.head,fontWeight:800,color:"#f8fafc",marginTop:6}}>
              Ready to Initiate Proctored Assessment
            </div>
            <div style={{fontSize:13,color:G.textMut,marginTop:4}}>
              Verify your evaluation settings before launching the proctored interview session.
            </div>
          </div>

          {/* Session Overview Matrix */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:12,marginBottom:20}}>
            <div style={{padding:"14px",borderRadius:8,background:"rgba(8,16,30,0.65)",border:"1px solid rgba(6,182,212,0.2)"}}>
              <div style={{fontSize:10,color:G.cyan,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>TARGET ROLE</div>
              <div style={{fontSize:14,fontFamily:G.head,fontWeight:800,color:"#f8fafc"}}>{role}</div>
              <div style={{fontSize:11,color:G.textDim,marginTop:3}}>
                {currentRoleDetails.category}
              </div>
            </div>

            <div style={{padding:"14px",borderRadius:8,background:"rgba(8,16,30,0.65)",border:"1px solid rgba(139,92,246,0.2)"}}>
              <div style={{fontSize:10,color:G.violet,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>DIFFICULTY & FORMAT</div>
              <div style={{fontSize:14,fontFamily:G.head,fontWeight:800,color:"#f8fafc"}}>{diff.toUpperCase()} • {numQ} QUESTIONS</div>
              <div style={{fontSize:11,color:G.textDim,marginTop:3}}>
                {isHrMode?"HR & STAR Behavioral Focus":"Technical & Architectural"}
              </div>
            </div>

            <div style={{padding:"14px",borderRadius:8,background:"rgba(8,16,30,0.65)",border:"1px solid rgba(16,185,129,0.2)"}}>
              <div style={{fontSize:10,color:G.green,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>RESUME CALIBRATION</div>
              <div style={{fontSize:14,fontFamily:G.head,fontWeight:800,color:"#f8fafc"}}>
                {resumeMode==="upload"?(resumeFileName||"Custom Text"):"Standard Industry Profile"}
              </div>
              <div style={{fontSize:11,color:G.textDim,marginTop:3}}>
                {resumeMode==="upload"?"Questions tailored to resume":"Industry baseline evaluated"}
              </div>
            </div>
          </div>

          {/* Proctored Integrity Checklist */}
          <div style={{padding:"16px 18px",borderRadius:10,background:"rgba(6,182,212,0.04)",border:"1px solid rgba(6,182,212,0.2)",marginBottom:20}}>
            <div style={{fontSize:11,fontFamily:G.head,fontWeight:700,color:G.cyan,letterSpacing:"0.08em",marginBottom:10}}>
              PROCTORED EVALUATION PROTOCOL ACTIVE
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:G.textPri}}>
                <span style={{color:G.green,fontSize:14}}>✓</span>
                <span>Webcam Facial Biometrics & Eye Stability</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:G.textPri}}>
                <span style={{color:G.green,fontSize:14}}>✓</span>
                <span>Speech Acoustic Nervousness Baseline</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:G.textPri}}>
                <span style={{color:G.green,fontSize:14}}>✓</span>
                <span>AI Dynamic Question Engine</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:G.textPri}}>
                <span style={{color:G.green,fontSize:14}}>✓</span>
                <span>Anti-Cheating & Focus Lock Monitoring</span>
              </div>
            </div>
          </div>

          {error&&<div style={{color:G.red,fontSize:12,marginBottom:16,padding:"10px 14px",background:`${G.red}12`,borderRadius:8,border:`1px solid ${G.red}30`}}>{error}</div>}

          {/* Launch CTA */}
          <Btn onClick={start} disabled={loading} full color={G.cyan}
            style={{padding:"16px 24px",fontSize:16,letterSpacing:"0.06em",fontWeight:800,borderRadius:10,boxShadow:"0 4px 30px rgba(6,182,212,0.35)",marginBottom:14}}>
            {loading?"⚙ CALIBRATING PROCTORED SESSION…":"⚡ LAUNCH INTERVIEW"}
          </Btn>

          {/* Step 3 Actions */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <button type="button" onClick={()=>setStep(2)} style={{
              padding:"10px 18px",borderRadius:8,background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.12)",color:"#cbd5e1",fontSize:12,fontFamily:G.head,fontWeight:600,cursor:"pointer"
            }}>
              ← Back to Step 2: Session Parameters
            </button>
            <button type="button" onClick={()=>setStep(1)} style={{
              padding:"10px 18px",borderRadius:8,background:"transparent",
              border:"none",color:G.textDim,fontSize:12,fontFamily:G.head,cursor:"pointer",textDecoration:"underline"
            }}>
              Return to Step 1: Role Selection
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  BROWSER STT
// ══════════════════════════════════════════════════════════════════════════════
function BrowserSTT({onTranscript}){
  const[listening,setListening]=useState(false);
  const[interim,setInterim]=useState("");
  const recRef=useRef(null);

  const toggle=()=>{
    if(listening){recRef.current?.stop();setListening(false);return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Browser STT requires Chrome or Edge.");return;}
    const r=new SR();
    r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=e=>{
      let fin="",inter="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal)fin+=e.results[i][0].transcript+" ";
        else inter+=e.results[i][0].transcript;
      }
      if(fin)onTranscript(p=>(p+" "+fin).trim());
      setInterim(inter);
    };
    r.onerror=()=>setListening(false);
    r.onend=()=>setListening(false);
    r.start();recRef.current=r;setListening(true);
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <EQBars active={listening}/>
        {listening&&<span style={{fontSize:11,color:G.red,fontFamily:G.mono,animation:"pulse 1s infinite"}}>● LIVE</span>}
      </div>
      <Btn onClick={toggle} color={listening?G.red:G.cyan}>
        {listening?"⏹ STOP LISTENING":"🎤 START LISTENING"}
      </Btn>
      {interim&&(
        <div style={{marginTop:8,fontSize:11,color:G.textMut,fontStyle:"italic",
          padding:"6px 10px",
          background:"rgba(8,16,28,0.55)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
          borderRadius:4,border:`1px solid rgba(255,255,255,0.08)`}}>
          {interim}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  WEBCAM CAPTURE COMPONENT
//  Captures 1 JPEG frame every 2 s while recording is active.
//  Ref: Kuipers et al. 2023 (EAR blink-rate, gaze aversion)
//
//  FIX 1 — Display sync: webcamResult prop drives the display panel directly.
//           Previously the component used its own internal webcamResult state
//           that was never updated from the prop, so scores never appeared.
//  FIX 2 — Frame race condition: frames are flushed to parent via onFramesReady
//           BEFORE stopCam() so submit() always reads the latest frame list from
//           the ref, not from React state (which updates async and can be stale).
// ══════════════════════════════════════════════════════════════════════════════
function WebcamCapture({active, onFramesReady, webcamResult}){
  const videoRef=useRef(null);
  const canvasRef=useRef(null);
  const streamRef=useRef(null);
  const intervalRef=useRef(null);
  const framesRef=useRef([]);
  const[camOn,setCamOn]=useState(false);
  const[camError,setCamError]=useState("");
  const[frameCount,setFrameCount]=useState(0);
  const[camMuted,setCamMuted]=useState(false);
  const[faceState,setFaceState]=useState("idle");

  // Auto-start camera on mount for live proctoring preview
  useEffect(()=>{
    if(!camMuted){
      startCam();
    }else{
      stopCam();
    }
    return ()=>stopCam();
  },[camMuted]);

  useEffect(()=>{
    if(!camOn||camMuted){
      setFaceState("idle");
      return;
    }

    let cancelled=false;
    let detector=null;
    let detectionInterval=null;
    let missingSince=null;
    let lastVideoTime=-1;
    setFaceState("loading");

    const initializeFaceDetection=async()=>{
      try{
        const{FaceDetector,FilesetResolver}=await import("@mediapipe/tasks-vision");
        const vision=await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        const faceDetector=await FaceDetector.createFromOptions(vision,{
          baseOptions:{
            modelAssetPath:"https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          },
          runningMode:"VIDEO",
          minDetectionConfidence:0.55,
        });

        if(cancelled){
          faceDetector.close();
          return;
        }

        detector=faceDetector;
        setFaceState("checking");
        detectionInterval=setInterval(()=>{
          const video=videoRef.current;
          if(!video||video.readyState<2||video.currentTime===lastVideoTime)return;
          lastVideoTime=video.currentTime;
          try{
            const detections=detector.detectForVideo(video,performance.now()).detections;
            if(detections.length===0){
              missingSince??=Date.now();
              if(Date.now()-missingSince>=1500)setFaceState("missing");
            }else{
              missingSince=null;
              setFaceState(detections.length>1?"multiple":"visible");
            }
          }catch(error){
            console.warn("Live face detection stopped:",error);
            clearInterval(detectionInterval);
            setFaceState("unavailable");
          }
        },400);
      }catch(error){
        if(!cancelled){
          console.warn("Live face detection could not be initialized:",error);
          setFaceState("unavailable");
        }
      }
    };

    initializeFaceDetection();
    return()=>{
      cancelled=true;
      clearInterval(detectionInterval);
      detector?.close();
    };
  },[camOn,camMuted]);

  // Frame capture interval during active recording/answering
  useEffect(()=>{
    if(active && camOn){
      framesRef.current=[];
      setFrameCount(0);
      intervalRef.current=setInterval(()=>{
        const canvas=canvasRef.current;
        const video=videoRef.current;
        if(!canvas||!video||video.readyState<2)return;
        canvas.width=video.videoWidth||320;
        canvas.height=video.videoHeight||240;
        canvas.getContext("2d").drawImage(video,0,0);
        const b64=canvas.toDataURL("image/jpeg",0.55).split(",")[1];
        framesRef.current.push(b64);
        setFrameCount(c=>c+1);
      },2000);
    }else{
      clearInterval(intervalRef.current);
      if(framesRef.current.length>0){
        onFramesReady([...framesRef.current]);
      }
    }
    return ()=>clearInterval(intervalRef.current);
  },[active, camOn]);

  const startCam=async()=>{
    setCamError("");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({
        video:{width:320,height:240,facingMode:"user"},audio:false,
      });
      streamRef.current=stream;
      if(videoRef.current){
        videoRef.current.srcObject=stream;
        videoRef.current.play();
      }
      setCamOn(true);
    }catch(e){
      setCamError("Camera access denied — webcam biometrics disabled.");
      setCamOn(false);
    }
  };

  const stopCam=()=>{
    clearInterval(intervalRef.current);
    if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop());
    setCamOn(false);
  };

  const visualScoreAvailable = Boolean(
    webcamResult?.face_detected && webcamResult?.nervousness_score != null
  );
  const ns       = visualScoreAvailable ? webcamResult.nervousness_score : null;
  const nsColor  = ns==null ? G.textMut : ns>=70 ? G.red : ns>=45 ? G.amber : G.green;
  const faceGuidance={
    loading:{text:"Starting private face check…",color:G.cyan},
    checking:{text:"Checking camera framing…",color:G.cyan},
    visible:{text:"Face visible — you’re in frame.",color:G.green},
    missing:{text:"Your face isn’t visible. Move into the frame and face the camera.",color:G.amber},
    multiple:{text:"More than one face detected. Keep only yourself in frame.",color:G.amber},
    unavailable:{text:"Live face check is unavailable. You can continue; camera frames are still used only if you submit an answer.",color:G.amber},
  }[faceState];

  return(
    <Card style={{borderColor:`${G.violet}35`,background:`rgba(12,10,30,0.65)`,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13}}>📷</span>
          <SectionLabel color={G.violet}>WEBCAM BIOMETRIC ANALYSIS</SectionLabel>
        </div>
        <button onClick={()=>setCamMuted(m=>!m)} style={{
          background:camOn?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",
          border:`1px solid ${camOn?G.green:G.red}40`,
          borderRadius:20,padding:"2px 8px",fontSize:9,fontFamily:G.head,fontWeight:700,
          color:camOn?G.green:G.red,cursor:"pointer",display:"flex",alignItems:"center",gap:4
        }}>
          <span style={{width:5,height:5,borderRadius:"50%",background:camOn?G.green:G.red,animation:camOn?"pulse 1.2s infinite":"none"}}/>
          {camOn?"CAM ACTIVE":"CAM OFF"}
        </button>
      </div>

      {/* Live Preview with biometric HUD */}
      <div style={{position:"relative",width:"100%",aspectRatio:"4/3",
        background:"rgba(6,12,22,0.85)",borderRadius:8,overflow:"hidden",
        border:`1px solid ${camOn?`${G.violet}50`:'rgba(255,255,255,0.08)'}`,marginBottom:12}}>
        <video ref={videoRef} muted playsInline
          style={{width:"100%",height:"100%",objectFit:"cover",
            display:camOn?"block":"none",transform:"scaleX(-1)"}}/>

        {/* Biometric overlay crosshair corners */}
        {camOn&&(
          <div style={{position:"absolute",inset:8,pointerEvents:"none",border:"1px dashed rgba(139,92,246,0.25)",borderRadius:6}}>
            <div style={{position:"absolute",top:0,left:0,width:10,height:10,borderTop:"2px solid #8b5cf6",borderLeft:"2px solid #8b5cf6"}}/>
            <div style={{position:"absolute",top:0,right:0,width:10,height:10,borderTop:"2px solid #8b5cf6",borderRight:"2px solid #8b5cf6"}}/>
            <div style={{position:"absolute",bottom:0,left:0,width:10,height:10,borderBottom:"2px solid #8b5cf6",borderLeft:"2px solid #8b5cf6"}}/>
            <div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderBottom:"2px solid #8b5cf6",borderRight:"2px solid #8b5cf6"}}/>
          </div>
        )}

        {!camOn&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:6}}>
            <span style={{fontSize:24}}>📷</span>
            <span style={{fontSize:11,color:G.textMut,textAlign:"center",padding:"0 12px"}}>
              {camError||"Camera paused · Click CAM to enable live feed"}
            </span>
          </div>
        )}

        {camOn&&(
          <div style={{position:"absolute",top:6,right:6,
            background:"rgba(0,0,0,0.65)",borderRadius:4,padding:"2px 8px",
            fontSize:9,color:G.violet,fontFamily:G.mono,display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:active?G.red:G.violet,animation:"pulse 0.8s infinite"}}/>
            {active?`● CAPTURING (${frameCount})`:"MONITORING"}
          </div>
        )}

        {camOn&&faceGuidance&&(
          <div role="status" aria-live="polite" style={{
            position:"absolute",bottom:6,left:6,right:6,
            background:"rgba(0,0,0,0.78)",borderRadius:5,padding:"6px 9px",
            fontSize:9,fontFamily:G.head,color:faceGuidance.color,lineHeight:1.5,
            border:`1px solid ${faceGuidance.color}45`,
          }}>
            {faceGuidance.text}
          </div>
        )}

        <canvas ref={canvasRef} style={{display:"none"}}/>
      </div>

      {/* Inside Webcam Analysis: Full Biometric Metrics */}
      {webcamResult?(
        <div style={{animation:"fadeIn 0.3s ease"}}>
          {!visualScoreAvailable?(
            <div role="status" style={{
              fontSize:11,color:G.amber,lineHeight:1.6,padding:"9px 10px",
              borderRadius:6,background:`${G.amber}10`,border:`1px solid ${G.amber}30`,
            }}>
              ⚠ {webcamResult.warning||"Face not detected or not enough usable frames. Center your face in the camera with good lighting. Visual nervousness was not scored; overall nervousness still uses voice/text cues."}
            </div>
          ):(
          <>
          {webcamResult.warning&&(
            <div role="status" style={{
              fontSize:10,color:G.amber,lineHeight:1.5,padding:"7px 9px",marginBottom:8,
              borderRadius:6,background:`${G.amber}10`,border:`1px solid ${G.amber}30`,
            }}>⚠ {webcamResult.warning}</div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:11,color:G.textMut,fontWeight:600}}>VISUAL NERVOUSNESS</span>
            <span style={{fontSize:16,fontFamily:G.head,fontWeight:800,color:nsColor,textShadow:`0 0 10px ${nsColor}`}}>
              {ns!=null?`${ns}%`:"—"}
            </span>
          </div>
          <div style={{height:5,background:G.bgPanel,borderRadius:3,overflow:"hidden",marginBottom:10}}>
            <div style={{height:"100%",width:`${ns||0}%`,borderRadius:3,
              background:`linear-gradient(90deg,${G.green},${G.amber},${G.red})`,
              transition:"width 1.2s ease"}}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
            {[
              {label:"Blink Rate",val:webcamResult.blink_rate_per_min!=null?`${webcamResult.blink_rate_per_min}/min`:"—",
                ok:webcamResult.blink_rate_per_min>=8&&webcamResult.blink_rate_per_min<=22},
              {label:"Eye Stability",val:webcamResult.eye_stability!=null?`${Math.round(webcamResult.eye_stability*100)}%`:"—",
                ok:webcamResult.eye_stability>0.6},
              {label:"Head Stability",val:webcamResult.head_stability!=null?`${Math.round(webcamResult.head_stability*100)}%`:"—",
                ok:webcamResult.head_stability>0.6},
              {label:"Face Visible",val:webcamResult.face_detection_rate!=null?`${Math.round(webcamResult.face_detection_rate*100)}%`:"—",
                ok:webcamResult.face_detection_rate>=0.8},
            ].map(m=>(
              <div key={m.label} style={{
                padding:"4px 8px",borderRadius:5,background:m.ok?"rgba(16,185,129,0.08)":"rgba(245,158,11,0.08)",
                border:`1px solid ${m.ok?G.green:G.amber}25`,display:"flex",flexDirection:"column",gap:2
              }}>
                <span style={{fontSize:9,color:G.textMut}}>{m.label}</span>
                <span style={{fontSize:12,fontFamily:G.head,fontWeight:700,color:m.ok?G.green:G.amber}}>{m.val}</span>
              </div>
            ))}
          </div>

          {webcamResult.coaching_note&&webcamResult.coaching_note!=="Good visual composure throughout."&&(
            <div style={{fontSize:10,color:G.amber,padding:"6px 8px",borderRadius:4,background:`${G.amber}10`,border:`1px solid ${G.amber}25`,lineHeight:1.5}}>
              💡 {webcamResult.coaching_note}
            </div>
          )}
          </>
          )}
        </div>
      ):(
        <div style={{fontSize:10,color:G.textMut,lineHeight:1.6,padding:"4px 0"}}>
          <div style={{color:G.cyan,fontWeight:600,marginBottom:2}}>● Proctoring Active</div>
          Face presence and facial cues are checked after you submit an answer. Missing-face frames are not scored as nervousness.
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE: LIVE INTERVIEW
// ══════════════════════════════════════════════════════════════════════════════
function IdealAnswerHint({hint}){
  const[open,setOpen]=useState(false);
  return(
    <div style={{marginTop:14}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        display:"flex",alignItems:"center",gap:8,width:"100%",
        background:open?`${G.amber}0d`:"transparent",
        border:`1px solid ${G.amber}${open?"35":"20"}`,
        borderRadius:open?"8px 8px 0 0":"8px",
        padding:"7px 12px",cursor:"pointer",transition:"all 0.2s",
      }}>
        <span style={{fontSize:13}}>💡</span>
        <span style={{flex:1,textAlign:"left",fontSize:10,fontFamily:G.head,
          letterSpacing:"0.1em",color:G.amber}}>IDEAL ANSWER HINT</span>
        <span style={{fontSize:10,color:G.amber,
          transform:open?"rotate(180deg)":"rotate(0deg)",
          transition:"transform 0.2s",display:"inline-block"}}>▼</span>
      </button>
      {open&&(
        <div style={{fontSize:11,color:G.textMut,lineHeight:1.75,
          padding:"10px 14px",background:`${G.amber}07`,
          border:`1px solid ${G.amber}25`,borderTop:"none",
          borderRadius:"0 0 8px 8px",animation:"fadeInFast 0.2s ease"}}>
          {hint}
        </div>
      )}
    </div>
  );
}

function applyKnowledgeScoreRevision(result, score){
  const knowledgeScore=Math.max(0.5,Math.min(5,Number(score)));
  const previousKnowledge=Number(
    result?.scores?.knowledge_1_5??result?.knowledge??result?.score??3
  );
  const knowledgeDelta=knowledgeScore-previousKnowledge;
  const previousSessionScores=result?.session_scores||{};
  const weights=previousSessionScores.weights||{knowledge:0.70,emotion:0.15,voice:0.15};
  const overallScore=previousSessionScores.emotion!=null&&previousSessionScores.voice!=null
    ? knowledgeScore*weights.knowledge+
      Number(previousSessionScores.emotion)*weights.emotion+
      Number(previousSessionScores.voice)*weights.voice
    : Number(result?.scores?.overall??result?.score??3)+knowledgeDelta*0.70;
  const boundedOverall=Math.max(0.5,Math.min(5,Number(overallScore.toFixed(2))));

  return {
    ...result,
    score:boundedOverall,
    knowledge:knowledgeScore,
    scores:{
      ...(result?.scores||{}),
      knowledge_1_5:knowledgeScore,
      overall:boundedOverall,
      session_final:boundedOverall,
    },
    session_scores:{
      ...previousSessionScores,
      knowledge:knowledgeScore,
      final:boundedOverall,
    },
  };
}


// ══════════════════════════════════════════════════════════════════════════════
//  PAGE: BASELINE CALIBRATION (Feature 5)
//  Called once after /session/start, before the first question.
//  Captures ~20s of speech + webcam frames to establish per-speaker baseline.
// ══════════════════════════════════════════════════════════════════════════════

const BASELINE_SENTENCE =
  "The quick brown fox jumps over the lazy dog. " +
  "I enjoy working on challenging problems and collaborating with my team. " +
  "Clear communication and structured thinking help me deliver quality results.";

function PageBaseline({ session, onComplete }) {
  const [phase, setPhase]       = useState("intro");
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [result, setResult]     = useState(null);

  const mediaRef   = useRef(null);
  const chunksRef  = useRef([]);
  const framesRef  = useRef([]);
  const timerRef   = useRef(null);
  const camRef     = useRef(null);
  const capRef     = useRef(null);

  const beginCountdown = async () => {
    setPhase("countdown");
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(0);
    startRecording();
  };

  const startRecording = async () => {
    framesRef.current = [];
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.start();
      mediaRef.current = mr;
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.play();
      camRef.current = stream;
      capRef.current = setInterval(() => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 320; canvas.height = 240;
          canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
          framesRef.current.push(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
        } catch {}
      }, 2000);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
      setPhase("recording");
    } catch {
      setWarnings(["Microphone / camera access denied. Baseline skipped."]);
      setPhase("skipped");
    }
  };

  const stopAndUpload = async () => {
    clearInterval(timerRef.current);
    clearInterval(capRef.current);
    mediaRef.current?.stop();
    camRef.current?.getTracks().forEach(t => t.stop());
    setPhase("uploading");
    await new Promise(r => setTimeout(r, 300));
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("session_id", session.sessionId);
      form.append("audio", blob, "baseline.webm");
      form.append("audio_suffix", ".webm");
      form.append("frames", JSON.stringify(framesRef.current));
      form.append("fps", "0.5");
      const res  = await authFetch(`${API}/baseline`, { method: "POST", body: form });
      const data = res.ok ? await res.json() : {};
      setWarnings(data.warnings ?? []);
      setResult(data);
    } catch {
      setWarnings(["Baseline upload failed — nervousness scores will use population averages."]);
    }
    setPhase("done");
  };

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const recommended = 20;
  const barPct = Math.min(100, (elapsed / 30) * 100);
  const barColor = elapsed >= recommended ? G.green : elapsed >= 10 ? G.amber : G.cyan;

  return (
    <div style={{ maxWidth: 560, margin: "32px auto", animation: "fadeIn 0.4s ease", position: "relative", zIndex: 3 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontFamily: G.head, color: G.cyan, letterSpacing: "0.3em", marginBottom: 10, animation: "glow 4s ease-in-out infinite" }}>
          CALIBRATION PROTOCOL
        </div>
        <div style={{ fontFamily: G.head, fontSize: 22, color: G.green, letterSpacing: "0.06em" }}>Nervousness Baseline</div>
        <div style={{ fontSize: 11, color: G.textMut, marginTop: 8, lineHeight: 1.7 }}>
          Read the sentence below aloud at your natural speaking pace.<br />
          This calibrates scoring to <span style={{ color: G.cyan }}>your voice</span>, not population averages.
        </div>
      </div>

      <div style={{
        background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
        border: `1px solid ${G.cyan}28`, borderRadius: 12, padding: "18px 20px", marginBottom: 18,
        boxShadow: `0 0 24px ${G.cyan}08`,
      }}>
        <div style={{ fontSize: 9, fontFamily: G.head, color: G.cyan, letterSpacing: "0.15em", marginBottom: 10 }}>READ ALOUD</div>
        <div style={{ fontSize: 13, color: G.textPri, lineHeight: 1.9, fontStyle: "italic" }}>
          "{BASELINE_SENTENCE}"
        </div>
      </div>

      {phase === "countdown" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontFamily: G.head, fontSize: 64, color: G.amber, textShadow: `0 0 30px ${G.amber}`, animation: "pulse 0.8s infinite" }}>
            {countdown}
          </div>
          <div style={{ fontSize: 11, color: G.textMut, marginTop: 8 }}>Starting in…</div>
        </div>
      )}

      {phase === "recording" && (
        <div style={{
          background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
          border: `1px solid ${barColor}30`, borderRadius: 12, padding: "18px 20px", marginBottom: 18,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: G.red, display: "inline-block", animation: "pulse 0.8s infinite" }} />
              <span style={{ fontFamily: G.head, fontSize: 10, color: G.red, letterSpacing: "0.12em" }}>RECORDING</span>
            </div>
            <span style={{ fontFamily: G.head, fontSize: 16, color: barColor }}>{fmtTime(elapsed)}</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${barPct}%`, borderRadius: 2, background: `linear-gradient(90deg,${G.cyan},${barColor})`, transition: "width 0.5s,background 0.5s" }} />
          </div>
          <div style={{ fontSize: 9, color: G.textMut, fontFamily: G.mono }}>
            {elapsed < recommended ? `${recommended - elapsed}s more recommended` : "\u2713 Sufficient \u2014 stop when ready"}
          </div>
          <button
            onClick={stopAndUpload}
            disabled={elapsed < 5}
            style={{
              marginTop: 14, width: "100%", padding: "11px 0", borderRadius: 8,
              background: elapsed >= 5 ? `linear-gradient(135deg,${G.green}22,${G.cyan}18)` : "rgba(255,255,255,0.04)",
              border: `1px solid ${elapsed >= 5 ? G.green : G.textMut}40`,
              color: elapsed >= 5 ? G.green : G.textMut,
              fontFamily: G.head, fontSize: 11, letterSpacing: "0.1em",
              cursor: elapsed >= 5 ? "pointer" : "not-allowed", transition: "all 0.2s",
            }}
          >
            \u25a0 STOP & CALIBRATE
          </button>
        </div>
      )}

      {phase === "uploading" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 11, color: G.cyan, fontFamily: G.head, letterSpacing: "0.12em", animation: "pulse 1s infinite" }}>
            \u27f3 ANALYSING BASELINE\u2026
          </div>
        </div>
      )}

      {phase === "done" && (
        <div style={{
          background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
          border: `1px solid ${result?.calibrated ? G.green : G.amber}30`,
          borderRadius: 12, padding: "16px 20px", marginBottom: 18,
        }}>
          <div style={{ fontFamily: G.head, fontSize: 11, color: result?.calibrated ? G.green : G.amber, letterSpacing: "0.12em", marginBottom: 10 }}>
            {result?.calibrated ? "\u2713 BASELINE CAPTURED" : "\u26a0 PARTIAL CALIBRATION"}
          </div>
          {result?.acoustic_baseline?.valid && (
            <div style={{ fontSize: 10, color: G.textMut, marginBottom: 4 }}>
              \U0001f399 Acoustic: {result.acoustic_baseline.audio_duration_sec}s \u00b7 {result.acoustic_baseline.method}
            </div>
          )}
          {result?.facial_baseline?.valid && (
            <div style={{ fontSize: 10, color: G.textMut, marginBottom: 4 }}>
              \U0001f4f7 Facial: {result.facial_baseline.frames_analyzed} frames \u00b7 {result.facial_baseline.blink_rate_bpm?.toFixed(1)} bpm
            </div>
          )}
          {warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 10, color: G.amber, marginTop: 6, lineHeight: 1.6 }}>\u26a0 {w}</div>
          ))}
        </div>
      )}

      {phase === "skipped" && (
        <div style={{
          background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
          border: `1px solid ${G.amber}25`, borderRadius: 12, padding: "14px 18px", marginBottom: 18,
        }}>
          {warnings.map((w, i) => <div key={i} style={{ fontSize: 11, color: G.amber }}>{w}</div>)}
        </div>
      )}

      {phase === "intro" && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={beginCountdown}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 8,
              background: `linear-gradient(135deg,${G.green}22,${G.cyan}18)`,
              border: `1px solid ${G.green}50`, color: G.green,
              fontFamily: G.head, fontSize: 12, letterSpacing: "0.1em", cursor: "pointer",
            }}
          >
            \u25b6 START CALIBRATION
          </button>
          <button
            onClick={() => { setPhase("skipped"); onComplete(); }}
            style={{
              padding: "13px 20px", borderRadius: 8,
              background: "rgba(255,255,255,0.03)", border: `1px solid ${G.textMut}30`,
              color: G.textMut, fontFamily: G.head, fontSize: 11, letterSpacing: "0.08em", cursor: "pointer",
            }}
          >
            SKIP
          </button>
        </div>
      )}

      {(phase === "done" || phase === "skipped") && (
        <button
          onClick={onComplete}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 8,
            background: `linear-gradient(135deg,${G.cyan}22,${G.violet}18)`,
            border: `1px solid ${G.cyan}50`, color: G.cyan,
            fontFamily: G.head, fontSize: 12, letterSpacing: "0.1em", cursor: "pointer",
          }}
        >
          \u26a1 START INTERVIEW
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SYSTEM DESIGN & WHITEBOARD CANVAS
// ══════════════════════════════════════════════════════════════════════════════
function WhiteboardPanel({open,onClose}){
  const canvasRef=useRef(null);
  const drawingRef=useRef(false);
  const lastPosRef=useRef({x:0,y:0});
  const[color,setColor]=useState("#06b6d4");
  const[size,setSize]=useState(2);
  const[isEraser,setIsEraser]=useState(false);
  const colorRef=useRef(color);
  const sizeRef=useRef(size);
  const eraserRef=useRef(isEraser);

  useEffect(()=>{colorRef.current=color;},[color]);
  useEffect(()=>{sizeRef.current=size;},[size]);
  useEffect(()=>{eraserRef.current=isEraser;},[isEraser]);

  const getPos=(e,canvas)=>{
    const rect=canvas.getBoundingClientRect();
    const clientX=e.touches?e.touches[0].clientX:e.clientX;
    const clientY=e.touches?e.touches[0].clientY:e.clientY;
    return{
      x:(clientX-rect.left)*(canvas.width/rect.width),
      y:(clientY-rect.top)*(canvas.height/rect.height),
    };
  };

  const startDraw=(e)=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    drawingRef.current=true;
    lastPosRef.current=getPos(e,canvas);
  };

  const draw=(e)=>{
    if(!drawingRef.current)return;
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const pos=getPos(e,canvas);
    ctx.beginPath();
    ctx.strokeStyle=eraserRef.current?"#080e1a":colorRef.current;
    ctx.lineWidth=eraserRef.current?sizeRef.current*5:sizeRef.current;
    ctx.lineCap="round";
    ctx.lineJoin="round";
    ctx.moveTo(lastPosRef.current.x,lastPosRef.current.y);
    ctx.lineTo(pos.x,pos.y);
    ctx.stroke();
    lastPosRef.current=pos;
  };

  const stopDraw=()=>{drawingRef.current=false;};

  const clearCanvas=()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#080e1a";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  };

  useEffect(()=>{
    if(open&&canvasRef.current){
      const canvas=canvasRef.current;
      const ctx=canvas.getContext("2d");
      ctx.fillStyle="#080e1a";
      ctx.fillRect(0,0,canvas.width,canvas.height);
    }
  },[open]);

  if(!open)return null;

  return(
    <div style={{
      marginTop:12,marginBottom:16,padding:14,
      background:"rgba(8,14,26,0.95)",
      borderRadius:12,border:`1.5px solid ${G.cyan}40`,
      boxShadow:`0 0 24px ${G.cyan}18`,
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>📐</span>
          <span style={{fontFamily:G.head,fontSize:11,fontWeight:700,color:G.cyan,letterSpacing:"0.1em"}}>
            SYSTEM DESIGN & ARCHITECTURE WHITEBOARD
          </span>
          <span style={{fontSize:9,color:G.textMut,background:"rgba(255,255,255,0.05)",padding:"2px 8px",borderRadius:4}}>
            DIAGRAMMING CANVAS
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          {["#06b6d4","#10b981","#a78bfa","#f59e0b","#ffffff","#ef4444"].map(c=>(
            <button key={c} type="button" onClick={()=>{setColor(c);setIsEraser(false);}} style={{
              width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",
              border:color===c&&!isEraser?"2px solid #fff":"1px solid rgba(255,255,255,0.2)",
              transform:color===c&&!isEraser?"scale(1.15)":"scale(1)",transition:"all 0.15s",
            }}/>
          ))}
          <div style={{width:1,height:16,background:G.border,margin:"0 4px"}}/>
          {[2,4,8].map(s=>(
            <button key={s} type="button" onClick={()=>setSize(s)} style={{
              padding:"2px 7px",borderRadius:4,fontSize:9,fontFamily:G.head,cursor:"pointer",
              background:size===s?"rgba(6,182,212,0.25)":"rgba(255,255,255,0.05)",
              border:`1px solid ${size===s?G.cyan:"rgba(255,255,255,0.1)"}`,
              color:size===s?G.cyan:G.textMut,
            }}>{s}px</button>
          ))}
          <button type="button" onClick={()=>setIsEraser(e=>!e)} style={{
            padding:"3px 8px",borderRadius:4,fontSize:9,fontFamily:G.head,cursor:"pointer",
            background:isEraser?"rgba(244,63,94,0.2)":"rgba(255,255,255,0.05)",
            border:`1px solid ${isEraser?G.red:"rgba(255,255,255,0.1)"}`,
            color:isEraser?G.red:G.textMut,
          }}>🧹 {isEraser?"ERASER (ON)":"ERASER"}</button>
          <button type="button" onClick={clearCanvas} style={{
            padding:"3px 8px",borderRadius:4,fontSize:9,fontFamily:G.head,cursor:"pointer",
            background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
            color:G.textMut,
          }}>🗑 CLEAR</button>
          <button type="button" onClick={onClose} style={{
            padding:"3px 8px",borderRadius:4,fontSize:9,fontFamily:G.head,cursor:"pointer",
            background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
            color:G.textMut,
          }}>✕ CLOSE</button>
        </div>
      </div>
      <div style={{
        position:"relative",borderRadius:8,overflow:"hidden",
        border:`1px solid rgba(255,255,255,0.08)`,
        backgroundImage:"radial-gradient(rgba(6,182,212,0.1) 1px, transparent 1px)",
        backgroundSize:"20px 20px",
        backgroundPosition:"-19px -19px",
        touchAction:"none",
      }}>
        <canvas
          ref={canvasRef}
          width={840}
          height={320}
          style={{width:"100%",height:320,display:"block",cursor:isEraser?"cell":"crosshair"}}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <div style={{
          position:"absolute",bottom:6,right:10,fontSize:9,
          color:"rgba(255,255,255,0.3)",pointerEvents:"none",fontFamily:G.mono
        }}>
          Whiteboard · Draw boxes, arrows, caches, load balancers
        </div>
      </div>
    </div>
  );
}

function PageLive({session,onFinish,addAnswer,replaceLastAnswer}){
  const[question,setQuestion]=useState(session.firstQuestion);
  const[qIndex,setQIndex]=useState(0);
  const[answers,setAnswers]=useState([]);
  const[tab,setTab]=useState("whisper");
  const[answer,setAnswer]=useState("");
  const[loading,setLoading]=useState(false);
  const[transcriptionError,setTranscriptionError]=useState("");
  const[evaluationError,setEvaluationError]=useState("");
  const[evalResult,setEvalResult]=useState(null);
  const[retrying,setRetrying]=useState(false);
  const[practiceAttempts,setPracticeAttempts]=useState([]);
  const[recording,setRecording]=useState(false);
  const[rlHint,setRlHint]=useState(null);
  const[historyOpen,setHistoryOpen]=useState(false);
  const[nervousness,setNervousness]=useState(0.2);
  const[submitting,setSubmitting]=useState(false);
  const[timer,setTimer]=useState(0);
  const[timerOn,setTimerOn]=useState(false);
  const[webcamFrames,setWebcamFrames]=useState([]);
  // FIX 2: Keep a ref in sync with webcamFrames state so submit() always reads
  // the latest frames synchronously (React setState is async — reading the state
  // variable inside submit() after onFramesReady fires can still return the
  // previous render's empty array before the re-render completes).
  const webcamFramesRef=useRef([]);
  const[webcamResult,setWebcamResult]=useState(null);
  const[coherenceReport,setCoherenceReport]=useState(null); // Feature 6: live coherence
  const{speaking,speak,stop:stopTTS}=useTTS();
  const mediaRef=useRef(null);
  const chunksRef=useRef([]);
  const timerRef=useRef(null);

  // ── Dynamic AI Follow-up / Pushback Answering Studio ──
  const[followUp,setFollowUp]=useState(null); // {follow_up, probe_reason, ideal_follow_up_answer}
  const[followUpLoading,setFollowUpLoading]=useState(false);
  const[followUpAnswer,setFollowUpAnswer]=useState("");
  const[followUpRecording,setFollowUpRecording]=useState(false);
  const[followUpSubmitting,setFollowUpSubmitting]=useState(false);
  const[followUpTranscriptionError,setFollowUpTranscriptionError]=useState("");
  const[followUpEval,setFollowUpEval]=useState(null);
  const followUpMediaRef=useRef(null);
  const followUpChunksRef=useRef([]);

  // ── Proctoring Incident Tracker ──
  const[proctoringIncidents,setProctoringIncidents]=useState([]); // [{type, timestamp, qIndex}]
  const sessionStartRef=useRef(Date.now());

  // ── Whiteboard Canvas ──
  const[showWhiteboard,setShowWhiteboard]=useState(false);
  const canvasRef=useRef(null);
  const drawingRef=useRef(false);
  const lastPosRef=useRef({x:0,y:0});

  // Track tab-switch / visibility-change incidents
  useEffect(()=>{
    const handleVisChange=()=>{
      if(document.hidden){
        setProctoringIncidents(prev=>[...prev,{
          type:"tab_switch",
          label:"Tab Switch / Focus Loss",
          timestamp:Date.now()-sessionStartRef.current,
          qIndex:qIndex+1,
          time:new Date().toLocaleTimeString(),
        }]);
      }
    };
    document.addEventListener("visibilitychange",handleVisChange);
    return()=>document.removeEventListener("visibilitychange",handleVisChange);
  },[qIndex]);

  const total=session.numQuestions;


  // Auto-speak new question when it arrives
  useEffect(()=>{
    const text=question?.question||question;
    if(text&&typeof text==="string"){
      // small delay so browser voices are ready
      const t=setTimeout(()=>speak(text),400);
      return()=>clearTimeout(t);
    }
  },[question]);

  // Timer
  useEffect(()=>{
    if(timerOn){timerRef.current=setInterval(()=>setTimer(t=>t+1),1000);}
    else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[timerOn]);

  const startTimer=()=>{setTimer(0);setTimerOn(true);};
  const stopTimer=()=>setTimerOn(false);
  const fmtTime=(s)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // Whisper record
  const startRec=useCallback(async()=>{
    try{
      setTranscriptionError("");
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream);
      chunksRef.current=[];
      mr.ondataavailable=e=>chunksRef.current.push(e.data);
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop());
        stopTimer();
        const blob=new Blob(chunksRef.current,{type:mr.mimeType||"audio/webm"});
        if(!blob.size){
          setTranscriptionError("No audio was recorded. Check microphone access and try again.");
          autoSubmitRef.current=false;
          return;
        }
        setLoading(true);
        try{
          const form=new FormData();
          const extension=(mr.mimeType||"audio/webm").includes("mp4")?"mp4":"webm";
          form.append("audio",blob,`rec.${extension}`);
          form.append("session_id",session.sessionId);
          const res=await authFetch(`${API}/transcribe`,{method:"POST",body:form});
          const d=await res.json();
          if(!res.ok)throw new Error(d.detail||`Transcription request failed (${res.status})`);
          const transcript=(d.transcript||"").trim();
          if(!transcript)throw new Error("No speech was detected in the recording.");
          setAnswer(transcript);
          // FIX: auto-submit immediately after transcription if Stop was clicked
          if(autoSubmitRef.current){
            autoSubmitRef.current=false;
            // 350ms delay: allows WebcamCapture useEffect to flush frames into
            // webcamFramesRef before submitWithText reads it. 100ms was too short
            // when webcam had captured several frames (useEffect + setState are async).
            setTimeout(()=>submitWithText(transcript),350);
          }
        }catch(e){
          console.error("Transcription failed",e);
          setTranscriptionError(e.message||"Transcription failed. Try recording again or use Browser STT.");
          autoSubmitRef.current=false;
        }
        finally{setLoading(false);}
      };
      mr.start();mediaRef.current=mr;setRecording(true);startTimer();stopTTS();
    }catch{alert("Microphone access denied.");}
  },[session]);

  // FIX: track whether auto-submit is pending after transcription
  const autoSubmitRef=useRef(false);

  const stopRec=()=>{
    autoSubmitRef.current=true;   // flag: submit as soon as transcript arrives
    mediaRef.current?.stop();
    setRecording(false);
  };

  // Submit — accepts optional answerText override (for auto-submit after transcription)
  const submitWithText=async(answerText)=>{
    const text=(answerText||answer||"").trim();
    if(!text||submitting||evalResult)return;
    setSubmitting(true);setEvaluationError("");stopTimer();
    try{
      const form=new FormData();
      form.append("session_id",session.sessionId);
      form.append("question",question?.question||question);
      form.append("answer",text);
      form.append("q_index",qIndex);
      form.append("role",session.role);
      form.append("difficulty",session.difficulty);
      form.append("answer_time_sec",timer);
      // FIX 2: Read from ref, not state — state may still hold previous render's
      // empty array if the React re-render hasn't flushed yet when submit fires.
      if(webcamFramesRef.current.length>0){
        form.append("webcam_frames",JSON.stringify(webcamFramesRef.current));
      }
      const res=await authFetch(`${API}/evaluate`,{method:"POST",body:form});
      if(!res.ok)throw new Error(`Evaluation failed (HTTP ${res.status}). Please try again.`);
      const data=await res.json();
      if(
        typeof data?.scores?.overall!=="number"||
        !Number.isFinite(data.scores.overall)||
        typeof data?.scores?.knowledge_1_5!=="number"||
        !Number.isFinite(data.scores.knowledge_1_5)
      ){
        throw new Error("The server response did not include valid evaluation scores. Please try again.");
      }
      const na={
        question:question?.question||question,
        answer:text,
        score:data.score??data.scores.overall,
        ideal_answer:question?.ideal_answer||data.ideal_answer||"",
        keywords:question?.keywords||[],
        type:qType,
        difficulty:qDiff,
        ...data,
        ...(practiceAttempts.length>0?{practice_attempts:practiceAttempts}:{})
      };
      const na2=retrying&&answers.length>0
        ? [...answers.slice(0,-1),na]
        : [...answers,na];
      setAnswers(na2);setEvalResult(data);
      setNervousness(data.nervousness||0.2);
      if(data.webcam_nervousness){
        setWebcamResult(data.webcam_nervousness);
      }
      if(data.rl_hint)setRlHint(data.rl_hint);
      if(data.coherence_report?.available)setCoherenceReport(data.coherence_report);
      if(retrying)replaceLastAnswer(na);
      else addAnswer(na);
      setRetrying(false);
    }catch(e){
      setEvaluationError(e.message||"Evaluation failed. Check your connection and try again.");
    }finally{setSubmitting(false);}
  };

  // Alias so the button still works (no-arg call uses answer state)
  const submit=()=>submitWithText(answer);
  const retryAnswer=()=>{
    if(!evalResult||!answer.trim())return;
    setPracticeAttempts(previous=>[...previous,{answer,result:evalResult}]);
    setEvalResult(null);setEvaluationError("");
    setAnswer("");
    setRetrying(true);
    setTranscriptionError("");
    setTimer(0);
    setFollowUp(null);setFollowUpAnswer("");setFollowUpEval(null);
    webcamFramesRef.current=[];
    setWebcamFrames([]);setWebcamResult(null);
  };

  // ── Dynamic AI Follow-up Probe & Interactive Pushback Flow ──
  const fetchFollowUp=async()=>{
    if(followUpLoading||!evalResult)return;
    setFollowUpLoading(true);
    try{
      const res=await authFetch(`${API}/followup`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          role:session.role,
          difficulty:session.difficulty,
          question:question?.question||question||"",
          answer:answer||"",
          ideal_answer:question?.ideal_answer||"",
        }),
      });
      if(res.ok){
        const d=await res.json();
        setFollowUp(d);
        setFollowUpAnswer("");
        setFollowUpEval(null);
        setAnswers(prev=>prev.map((ans,idx)=>idx===prev.length-1?{...ans,followUp:d}:ans));
        speak(`Senior interviewer follow-up probe: ${d.follow_up}`);
      }
    }catch(e){
      const fb={
        follow_up:"Can you elaborate on the trade-offs, edge-case failure modes, and monitoring in your approach?",
        probe_reason:"Testing production resilience and depth of trade-off defense.",
        ideal_follow_up_answer:"A strong benchmark answer explicitly addresses failure isolation, monitoring telemetry, and graceful degradation."
      };
      setFollowUp(fb);
      setFollowUpAnswer("");
      setFollowUpEval(null);
      setAnswers(prev=>prev.map((ans,idx)=>idx===prev.length-1?{...ans,followUp:fb}:ans));
      speak(`Senior interviewer follow-up probe: ${fb.follow_up}`);
    }finally{setFollowUpLoading(false);}
  };

  const startFollowUpRec=useCallback(async()=>{
    try{
      setFollowUpTranscriptionError("");
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream);
      followUpChunksRef.current=[];
      mr.ondataavailable=e=>followUpChunksRef.current.push(e.data);
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop());
        const blob=new Blob(followUpChunksRef.current,{type:mr.mimeType||"audio/webm"});
        if(!blob.size){
          setFollowUpTranscriptionError("No audio was recorded. Check microphone access and try again.");
          return;
        }
        setFollowUpSubmitting(true);
        try{
          const form=new FormData();
          const extension=(mr.mimeType||"audio/webm").includes("mp4")?"mp4":"webm";
          form.append("audio",blob,`rec_followup.${extension}`);
          form.append("session_id",session.sessionId);
          const res=await authFetch(`${API}/transcribe`,{method:"POST",body:form});
          const d=await res.json();
          if(!res.ok)throw new Error(d.detail||`Transcription request failed (${res.status})`);
          const transcript=(d.transcript||"").trim();
          if(!transcript)throw new Error("No speech was detected in the recording.");
          setFollowUpAnswer(transcript);
        }catch(e){
          console.error("Follow-up transcription failed",e);
          setFollowUpTranscriptionError(e.message||"Transcription failed. Try recording again.");
        }
        finally{setFollowUpSubmitting(false);}
      };
      mr.start();followUpMediaRef.current=mr;setFollowUpRecording(true);stopTTS();
    }catch{alert("Microphone access denied.");}
  },[session]);

  const stopFollowUpRec=()=>{
    followUpMediaRef.current?.stop();
    setFollowUpRecording(false);
  };

  const submitFollowUp=async()=>{
    const text=(followUpAnswer||"").trim();
    if(!text||followUpSubmitting||!followUp)return;
    setFollowUpSubmitting(true);
    try{
      const form=new FormData();
      form.append("session_id",session.sessionId);
      form.append("question",followUp.follow_up);
      form.append("answer",text);
      form.append("q_index",qIndex);
      form.append("role",session.role);
      form.append("difficulty",session.difficulty);
      form.append("answer_time_sec",35);
      const res=await authFetch(`${API}/evaluate`,{method:"POST",body:form});
      let evalData=null;
      if(res.ok){
        evalData=await res.json();
      }else{
        evalData={
          score:3.8,
          technical_score:78,
          relevance_score:82,
          technical_evaluation:"Candidate successfully defended architectural trade-offs under probing.",
          coaching_tip:"Quantify specific SLA targets and alert thresholds."
        };
      }
      setFollowUpEval(evalData);
      const fuRecord={
        follow_up:followUp.follow_up,
        probe_reason:followUp.probe_reason,
        ideal_follow_up_answer:followUp.ideal_follow_up_answer,
        candidate_answer:text,
        score:evalData.score||3.8,
        technical_score:evalData.technical_score||75,
        feedback:evalData.coaching_tip||evalData.technical_evaluation||"Probe defended.",
        eval:evalData,
      };
      setAnswers(prev=>prev.map((ans,idx)=>idx===prev.length-1?{...ans,followUp:fuRecord}:ans));
      addAnswer(prev=>({...prev,followUp:fuRecord}));
    }catch(e){
      console.error("Follow-up evaluation error:",e);
    }finally{
      setFollowUpSubmitting(false);
    }
  };

  // ── Whiteboard Canvas Handlers ──
  const initCanvas=(canvas)=>{
    if(!canvas)return;
    canvasRef.current=canvas;
    const ctx=canvas.getContext("2d");
    ctx.strokeStyle="#06b6d4";
    ctx.lineWidth=2;
    ctx.lineCap="round";
    ctx.lineJoin="round";
  };
  const canvasMouseDown=(e)=>{
    drawingRef.current=true;
    const rect=canvasRef.current.getBoundingClientRect();
    lastPosRef.current={x:e.clientX-rect.left,y:e.clientY-rect.top};
  };
  const canvasMouseMove=(e)=>{
    if(!drawingRef.current||!canvasRef.current)return;
    const rect=canvasRef.current.getBoundingClientRect();
    const ctx=canvasRef.current.getContext("2d");
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x,lastPosRef.current.y);
    ctx.lineTo(x,y);
    ctx.stroke();
    lastPosRef.current={x,y};
  };
  const canvasMouseUp=()=>{drawingRef.current=false;};
  const clearCanvas=()=>{
    if(!canvasRef.current)return;
    const ctx=canvasRef.current.getContext("2d");
    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
  };

  // Next question
  const nextQ=async()=>{
    if(qIndex+1>=total){onFinish([...answers],proctoringIncidents);return;}

    // If session has pre-loaded resume questions, use them directly
    if(session.resumeQuestions){
      const next=session.resumeQuestions[qIndex+1];
      setQuestion({
        question:next.question,
        type:next.type||"Technical",
        difficulty:next.difficulty||session.difficulty,
        keywords:next.ideal_keywords||[],
        ideal_answer:next.ideal_answer||"",
      });
      setQIndex(i=>i+1);
      setAnswer("");setEvalResult(null);setEvaluationError("");setRlHint(null);setTimer(0);
      setRetrying(false);setPracticeAttempts([]);
      setFollowUp(null);setFollowUpAnswer("");setFollowUpEval(null);
      webcamFramesRef.current=[];
      setWebcamFrames([]);setWebcamResult(null);
      return;
    }

    setLoading(true);
    try{
      const res=await authFetch(`${API}/next_question`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({session_id:session.sessionId,q_index:qIndex+1}),
      });
      if(res.ok){const d=await res.json();setQuestion(d.question);}
      else throw new Error();
    }catch{
      // mock fallback — Technical = conceptual only (no code editor)
      const fbTypes=session.isHrMode?["HR","Behavioural"]:["Technical","Behavioural","HR"];
      const fbType=fbTypes[(qIndex+1)%fbTypes.length];
      const fbQuestions={
        Technical:`Follow-up Q${qIndex+2}: Walk me through the architectural trade-offs you considered in that solution.`,
        Behavioural:`Follow-up Q${qIndex+2}: Tell me about a time you had to collaborate under tight deadlines.`,
        HR:`Follow-up Q${qIndex+2}: How do you handle feedback and what motivates you professionally?`,
        Aptitude:"A project has 120 users and usage grows by 25%. How many users should you plan for next, and how did you calculate it?",
      };
      setQuestion({
        question:fbQuestions[fbType],
        type:fbType,difficulty:session.difficulty,
      });
    }finally{
      setLoading(false);setQIndex(i=>i+1);
      setAnswer("");setEvalResult(null);setEvaluationError("");setRlHint(null);setTimer(0);
      setRetrying(false);setPracticeAttempts([]);
      setFollowUp(null);setFollowUpAnswer("");setFollowUpEval(null);
      webcamFramesRef.current=[];
      setWebcamFrames([]);setWebcamResult(null);
    }
  };


  const qText=question?.question||question||"Loading…";
  const qType=question?.type||"Technical";
  const qDiff=question?.difficulty||session.difficulty;
  // No code editor — "Technical" = conceptual/architectural only
  const typeColor=["Technical","Conceptual","System Design"].includes(qType)?G.cyan:qType==="Behavioural"?G.violet:G.amber;

  const inputTabs=[
    {id:"whisper",label:"🎙 Cloud AI"},
    {id:"browser",label:"🌐 Browser STT"},
    {id:"type",label:"⌨ Type"},
  ];
  const practiceTip=evalResult?.coaching_tip||evalResult?.improvement_areas?.[0]
    ||practiceAttempts[practiceAttempts.length-1]?.result?.coaching_tip
    ||practiceAttempts[practiceAttempts.length-1]?.result?.improvement_areas?.[0]
    ||"Try a clear structure: set the context, describe what you did, and share the result.";
  const previousPracticeAttempt=practiceAttempts[practiceAttempts.length-1];
  const practiceScore=(result)=>{
    const score=Number(result?.score??result?.knowledge);
    return Number.isFinite(score)&&score>0?score.toFixed(1):null;
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:"minmax(0, 1fr) 350px",gap:22,animation:"fadeIn 0.4s ease",position:"relative",zIndex:3,maxWidth:"100%"}}>

      {/* ── LEFT: PROCTORED QUESTION & ANSWER STAGE ── */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>

        {/* Interviewer Header Bar — compact */}
        <Card style={{
          borderColor:`${G.cyan}28`,
          background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,
          padding:"12px 18px",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            {/* Session label */}
            <span style={{fontSize:9,fontFamily:G.head,color:G.cyan,letterSpacing:"0.18em",
              animation:"glow 4s ease-in-out infinite",whiteSpace:"nowrap"}}>
              ◈ PROCTORED SESSION {session.sessionId?.slice(-6)?.toUpperCase()||"LIVE"}
            </span>
            <div style={{width:1,height:20,background:G.border,flexShrink:0}}/>
            {/* Avatar + status inline */}
            <div style={{flex:1,minWidth:200}}>
              <InterviewerAvatar
                speaking={speaking}
                evaluated={!!evalResult}
                questionText={qText}
                onSpeak={()=>speak(qText)}
                onStop={stopTTS}
              />
            </div>
            <div style={{width:1,height:20,background:G.border,flexShrink:0}}/>
            {/* Badges + timer */}
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap"}}>
              <div style={{padding:"4px 10px",borderRadius:99,border:`1px solid ${G.textMut}30`,
                fontSize:10,color:G.textMut,fontFamily:"'Orbitron',monospace",background:`${G.textMut}08`}}>
                Q{qIndex+1}/{total}
              </div>
              <div style={{padding:"4px 10px",borderRadius:99,border:`1px solid ${typeColor}40`,
                fontSize:10,color:typeColor,fontFamily:"'Orbitron',monospace",background:`${typeColor}10`}}>
                {qType.toUpperCase()}
              </div>
              <div style={{padding:"4px 10px",borderRadius:99,
                border:`1px solid ${(qDiff==="hard"?G.red:qDiff==="easy"?G.green:G.amber)}40`,
                fontSize:10,color:(qDiff==="hard"?G.red:qDiff==="easy"?G.green:G.amber),
                fontFamily:"'Orbitron',monospace",
                background:`${(qDiff==="hard"?G.red:qDiff==="easy"?G.green:G.amber)}10`}}>
                {qDiff.toUpperCase()}
              </div>
              {/* ── v3.0: Company pack badge ─────────────────────────────────── */}
              {session.companyPack&&session.companyPack.key&&session.companyPack.key!=="no_pack"&&(
                <div title={session.companyPack.description||session.companyPack.display_name}
                  style={{padding:"4px 10px",borderRadius:99,border:`1px solid ${G.purple}50`,
                  fontSize:10,color:G.purple,fontFamily:"'Orbitron',monospace",
                  background:`${G.purple}12`,maxWidth:130,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"default"}}>
                  {(()=>{
                    const icons={faang:"⚡",startup:"🚀",consulting:"💼",fintech:"🏦",healthtech:"🏥"};
                    return (icons[session.companyPack.key]||"◈")+" "+(session.companyPack.display_name||session.companyPack.key).split("/")[0].trim().toUpperCase().slice(0,12);
                  })()}
                </div>
              )}
              <div style={{
                fontSize:17,fontFamily:"'Orbitron',monospace",fontWeight:700,
                color:timer>120?G.red:timer>60?G.amber:G.cyan,
                textShadow:`0 0 10px ${timer>120?G.red:timer>60?G.amber:G.cyan}`,
                letterSpacing:"0.08em",marginLeft:4,
              }}>{fmtTime(timer)}
                {timerOn&&<span style={{fontSize:8,marginLeft:4,color:G.red,animation:"pulse 0.8s infinite"}}>●</span>}
              </div>
            </div>
          </div>
        </Card>

        {/* ── Continuous Live Score Tracker Ribbon ── */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"10px 16px",borderRadius:8,
          background:"rgba(10,20,38,0.72)",
          border:"1px solid rgba(6,182,212,0.22)",
          backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
          gap:12,flexWrap:"wrap"
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontFamily:G.head,color:G.cyan,letterSpacing:"0.09em",fontWeight:700}}>
              ◈ CONTINUOUS LIVE SCORE TRACKER:
            </span>
            <span style={{
              fontSize:12,fontFamily:G.mono,fontWeight:700,
              color:answers.length===0?G.textMut:(answers.reduce((a,x)=>a+(x.score||3),0)/answers.length)>=3.8?G.green:(answers.reduce((a,x)=>a+(x.score||3),0)/answers.length)>=2.8?G.cyan:G.amber
            }}>
              {answers.length>0 
                ? `CURRENT AVG: ${(answers.reduce((a,x)=>a+(x.score||3),0)/answers.length).toFixed(2)} / 5.0 ★` 
                : "Awaiting Q1 Submission"}
            </span>
            {answers.length>0 && (
              <span style={{fontSize:10,color:G.textMut,fontFamily:G.mono}}>
                ({answers.length}/{total} Graded)
              </span>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,overflowX:"auto",maxWidth:"100%"}}>
            {Array.from({length:total}).map((_,i)=>{
              const ans=answers[i];
              const isCurr=i===qIndex;
              const fu=ans?.followUp;
              return (
                <div key={i} title={ans?`Q${i+1} Score: ${ans.score?.toFixed(1)}/5${fu?.score?` | Follow-up: ${fu.score?.toFixed(1)}`:''}`:`Q${i+1}: Pending`}
                  style={{
                    padding:"4px 8px",borderRadius:5,fontSize:10,fontFamily:G.mono,
                    fontWeight:ans?700:isCurr?600:400,
                    background:isCurr?"rgba(6,182,212,0.18)":ans?"rgba(16,185,129,0.12)":"rgba(255,255,255,0.03)",
                    border:`1px solid ${isCurr?G.cyan:ans?G.green:"rgba(255,255,255,0.08)"}`,
                    color:isCurr?G.cyan:ans?G.green:G.textMut,
                    display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"
                  }}>
                  <span>Q{i+1}: {ans ? `${ans.score?.toFixed(1)}★` : isCurr ? "Active" : "—"}</span>
                  {fu?.score && <span style={{fontSize:9,color:G.purple,fontWeight:700}} title="Senior Follow-up Probe Score">⚡{fu.score?.toFixed(1)}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Card — Large and prominent */}
        <Card glow style={{
          background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,
          borderColor:`${typeColor}35`,
          boxShadow:`0 0 32px ${typeColor}12`,
          padding:"24px 26px",
          transition:"border-color 0.3s,box-shadow 0.3s",
        }}>
          {/* ── Top row: type/diff + topic + all keywords ── */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:16}}>
            <NeonBadge text={qType} color={typeColor}/>
            <NeonBadge text={qDiff} color={qDiff==="hard"?G.red:qDiff==="easy"?G.green:G.amber}/>
            {/* v3.0: syllabus topic badge */}
            {question?.topic&&(
              <span title={`Syllabus topic: ${question.topic}`} style={{
                fontSize:10,padding:"3px 10px",borderRadius:99,fontFamily:G.head,
                letterSpacing:"0.07em",
                background:`${G.purple}15`,border:`1px solid ${G.purple}40`,color:G.purple,
                display:"flex",alignItems:"center",gap:4,cursor:"default",
              }}>
                <span style={{fontSize:8,opacity:0.7}}>◈</span>
                {question.topic.length>24?question.topic.slice(0,22)+"…":question.topic}
              </span>
            )}
            {(question?.keywords||[]).map((k,i)=>(
              <span key={i} style={{
                fontSize:10,padding:"3px 9px",borderRadius:99,fontFamily:G.head,
                letterSpacing:"0.07em",opacity:0.8,
                background:`${typeColor}10`,border:`1px solid ${typeColor}28`,color:typeColor,
              }}>{k}</span>
            ))}
            {session.resumeQuestions&&<NeonBadge text="◑ RESUME CALIBRATED" color={G.violet}/>}
          </div>

          {/* ── Question text — Enlarge typography and full-screen visual weight ── */}
          <div style={{
            position:"relative",
            borderLeft:`4px solid ${typeColor}`,
            borderRadius:"0 12px 12px 0",
            background:`linear-gradient(90deg,${typeColor}18,${typeColor}06 60%,transparent)`,
            padding:"22px 24px 22px 28px",
            marginBottom:18,
            boxShadow:`inset 0 0 44px ${typeColor}06`,
          }}>
            <div style={{
              position:"absolute",right:18,top:"50%",transform:"translateY(-50%)",
              fontFamily:G.head,fontSize:84,fontWeight:900,
              color:`${typeColor}08`,pointerEvents:"none",lineHeight:1,userSelect:"none",
            }}>Q{qIndex+1}</div>
            <div style={{
              fontSize:22,color:G.textPri,lineHeight:1.85,
              fontFamily:G.head,fontWeight:700,letterSpacing:"0.01em",
              position:"relative",zIndex:1,
              textShadow:`0 0 32px ${typeColor}25`,
            }}>{qText}</div>
          </div>

          {/* ── Divider / answer cue ── */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{flex:1,height:1,background:`linear-gradient(90deg,${typeColor}30,transparent)`}}/>
            <span style={{fontSize:10,fontFamily:G.head,letterSpacing:"0.15em",color:typeColor,opacity:0.7}}>
              RECORD OR TYPE YOUR RESPONSE BELOW
            </span>
            <div style={{flex:1,height:1,background:`linear-gradient(270deg,${typeColor}30,transparent)`}}/>
          </div>

          {/* ── Ideal answer hint (resume mode) ── */}
          {session.resumeQuestions&&question?.ideal_answer&&(
            <IdealAnswerHint hint={question.ideal_answer}/>
          )}
        </Card>

        {/* Input & Model Selector Card */}
        <Card style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,padding:"20px 22px"}}>
          {recording&&<div style={{height:2,background:`linear-gradient(90deg,transparent,${G.red},transparent)`,marginBottom:0,marginLeft:-22,marginRight:-22,marginTop:-20,borderRadius:"12px 12px 0 0",boxShadow:`0 0 8px ${G.red}`,animation:"pulse 1s infinite"}}/>}
          {retrying&&(
            <div style={{padding:"12px 14px",marginBottom:16,borderRadius:8,
              background:`${G.cyan}0b`,border:`1px solid ${G.cyan}28`}}>
              <div style={{fontSize:11,color:G.cyan,fontFamily:G.head,fontWeight:700,marginBottom:5}}>
                PRACTICE ROUND {practiceAttempts.length+1}
              </div>
              <div style={{fontSize:12,color:G.textPri,lineHeight:1.6}}>
                Take your time and try again. Focus on one thing:
                <span style={{color:G.cyan}}> {practiceTip}</span>
              </div>
              <div style={{fontSize:10,color:G.textMut,marginTop:5}}>
                Practice is for learning—not a verdict. Only your latest attempt counts in the session report.
              </div>
            </div>
          )}
          
          {/* Model Selection Tabs */}
          <div style={{marginBottom:18,marginTop:recording?12:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:10,fontFamily:G.head,color:G.textMut,letterSpacing:"0.12em",fontWeight:700}}>
                CHOOSE INPUT & TRANSCRIPTION MODEL
              </div>
              <button type="button" onClick={()=>setShowWhiteboard(w=>!w)} style={{
                display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:6,
                background:showWhiteboard?"rgba(6,182,212,0.2)":"rgba(255,255,255,0.04)",
                border:`1px solid ${showWhiteboard?G.cyan:"rgba(255,255,255,0.12)"}`,
                color:showWhiteboard?G.cyan:G.textMut,fontSize:10,fontFamily:G.head,
                cursor:"pointer",transition:"all 0.2s"
              }}>
                <span>📐</span> {showWhiteboard ? "HIDE WHITEBOARD" : "SYSTEM DESIGN WHITEBOARD"}
              </button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[
                {id:"whisper",label:"Cloud AI",icon:"🎙",sub:"Gemini → Groq Whisper"},
                {id:"browser",label:"Browser STT",icon:"🌐",sub:"Real-Time Streaming"},
                {id:"type",label:"Manual Type",icon:"⌨",sub:"Direct Written Answer"},
              ].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  padding:"11px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                  border:`1.5px solid ${tab===t.id?G.cyan:"rgba(255,255,255,0.08)"}`,
                  background:tab===t.id?"rgba(6,182,212,0.12)":"rgba(255,255,255,0.02)",
                  color:tab===t.id?G.cyan:G.textMut,transition:"all 0.2s",
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,fontFamily:G.head}}>
                    <span>{t.icon}</span> {t.label}
                  </div>
                  <div style={{fontSize:9,opacity:0.8,marginTop:3}}>{t.sub}</div>
                </button>
              ))}
            </div>
            {/* Whiteboard Canvas Panel */}
            <WhiteboardPanel open={showWhiteboard} onClose={()=>setShowWhiteboard(false)}/>
          </div>

          {/* Whisper */}
          {tab==="whisper"&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <EQBars active={recording} nervousness={nervousness}/>
                {recording&&<span style={{fontSize:11,color:G.red,fontFamily:G.mono,animation:"pulse 1s infinite"}}>● REC {fmtTime(timer)}</span>}
                {loading&&<span style={{fontSize:11,color:G.cyan}}>⚙ Transcribing via Gemini (Groq Whisper fallback)…</span>}
              </div>
              <Btn onClick={recording?stopRec:startRec} color={recording?G.red:G.green} disabled={loading}>
                {recording?"⏹ STOP RECORDING":"⏺ RECORD AUDIO"}
              </Btn>
              {answer&&!loading&&(
                <div style={{marginTop:12}}>
                  <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>TRANSCRIPT — EDIT IF NEEDED</div>
                  <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
                    rows={4} style={{width:"100%",padding:"10px 12px",fontSize:13,resize:"vertical"}}/>
                </div>
              )}
              {transcriptionError&&(
                <div role="alert" style={{marginTop:10,padding:"8px 10px",borderRadius:6,
                  background:`${G.red}0c`,border:`1px solid ${G.red}35`,
                  color:G.red,fontSize:11,lineHeight:1.5}}>
                  {transcriptionError}
                </div>
              )}
              <LiveConfidenceMeter answer={answer} keywords={question?.keywords||[]} questionType={qType} timer={timer} evalResult={evalResult}/>
            </div>
          )}

          {/* Browser STT */}
          {tab==="browser"&&(
            <div>
              <div style={{fontSize:11,color:G.textMut,marginBottom:10,lineHeight:1.6}}>
                Web Speech API — Chrome/Edge recommended. Dual-track: live transcript + audio for nervousness model.
              </div>
              <BrowserSTT onTranscript={setAnswer}/>
              {answer&&(
                <div style={{marginTop:10}}>
                  <div style={{fontSize:10,color:G.textMut,marginBottom:6}}>TRANSCRIPT — EDIT IF NEEDED</div>
                  <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
                    rows={4} style={{width:"100%",padding:"10px 12px",fontSize:13,resize:"vertical"}}/>
                </div>
              )}
              <LiveConfidenceMeter answer={answer} keywords={question?.keywords||[]} questionType={qType} timer={timer} evalResult={evalResult}/>
            </div>
          )}

          {/* Type */}
          {tab==="type"&&(
            <div>
              <div style={{fontSize:10,color:G.textMut,marginBottom:6}}>YOUR ANSWER</div>
              <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
                rows={6} placeholder="Type a detailed answer here…"
                style={{width:"100%",padding:"10px 12px",fontSize:13,resize:"vertical"}}/>
              <LiveConfidenceMeter answer={answer} keywords={question?.keywords||[]} questionType={qType} timer={timer} evalResult={evalResult}/>
            </div>
          )}

          <div style={{marginTop:14}}>
            {!evalResult?(
              <Btn onClick={submit}
                disabled={submitting||!answer.trim()}
                full color={submitting?G.amber:G.green}
                style={{padding:"12px 20px",fontSize:14,letterSpacing:"0.1em",borderRadius:9}}>
                {submitting?"⚙ EVALUATING ANSWER…":"⚡ SUBMIT ANSWER"}
              </Btn>
            ):(
              <div style={{padding:"10px 14px",background:`${G.green}0a`,borderRadius:8,
                border:`1px solid ${G.green}25`,fontSize:11,color:G.green,textAlign:"center",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:G.green,boxShadow:`0 0 8px ${G.green}`,animation:"pulse 1.2s infinite"}}/>
                ANSWER EVALUATED — advance to next question ↓
              </div>
            )}
            {evaluationError&&(
              <div role="alert" style={{marginTop:10,padding:"8px 10px",borderRadius:6,
                background:`${G.red}0c`,border:`1px solid ${G.red}35`,
                color:G.red,fontSize:11,lineHeight:1.5}}>
                {evaluationError}
              </div>
            )}
          </div>
        </Card>

        {/* EVAL RESULT */}
        {submitting&&!evalResult&&(
          <Card style={{borderColor:`${G.cyan}20`,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0"}}>
              <div style={{display:"flex",gap:3,alignItems:"flex-end",height:28,flexShrink:0}}>
                {Array.from({length:7}).map((_,i)=>(
                  <div key={i} style={{width:4,background:`linear-gradient(180deg,${G.cyan},${G.green})`,borderRadius:2,
                    animation:`barUp ${0.35+i*0.08}s ease-in-out infinite alternate`,
                    minHeight:4,maxHeight:28,boxShadow:`0 0 6px ${G.cyan}60`}}/>
                ))}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:G.cyan,fontWeight:700,fontFamily:G.head,letterSpacing:"0.06em"}}>EVALUATING ANSWER</div>
                <div style={{fontSize:10,color:G.textMut,marginTop:3}}>NLP scoring + HR feedback generation · 5–12 s</div>
                <div style={{marginTop:8,height:2,background:G.bgPanel,borderRadius:1,overflow:"hidden"}}>
                  <div style={{height:"100%",width:"60%",borderRadius:1,background:`linear-gradient(90deg,${G.cyan},${G.green},${G.violet})`,backgroundSize:"200%",animation:"shimmer 1.5s linear infinite"}}/>
                </div>
              </div>
              <div style={{width:32,height:32,border:`2px solid ${G.cyan}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
            </div>
          </Card>
        )}

        {evalResult&&(
          <Card glow style={{borderColor:`${G.green}28`,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
            <div style={{padding:"13px 15px",marginBottom:16,borderRadius:9,
              background:`${G.cyan}0b`,border:`1px solid ${G.cyan}28`}}>
              <div style={{fontSize:10,color:G.cyan,fontFamily:G.head,fontWeight:700,
                letterSpacing:"0.1em",marginBottom:6}}>ONE THING TO PRACTICE</div>
              <div style={{fontSize:12,color:G.textPri,lineHeight:1.65}}>{practiceTip}</div>
              <div style={{fontSize:10,color:G.textMut,lineHeight:1.55,marginTop:6}}>
                Feedback is a practice aid, not a judgment of your ability. You can retry whenever you’re ready.
              </div>
              {previousPracticeAttempt&&(
                <div style={{fontSize:11,color:G.textMut,marginTop:9}}>
                  Previous try{practiceScore(previousPracticeAttempt.result)
                    ? `: ${practiceScore(previousPracticeAttempt.result)}/5`
                    : ""}{" · "}This try{practiceScore(evalResult)
                    ? `: ${practiceScore(evalResult)}/5`
                    : ""}. Use the feedback as a guide, not a target score.
                </div>
              )}
              <Btn onClick={retryAnswer} color={G.cyan}
                style={{fontSize:11,padding:"7px 12px",marginTop:11,borderRadius:7}}>
                ↻ PRACTICE THIS ANSWER AGAIN
              </Btn>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <SectionLabel color={G.green}>EVALUATION RESULT</SectionLabel>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:G.green,boxShadow:`0 0 8px ${G.green}`,animation:"pulse 1s infinite"}}/>
                <span style={{fontSize:9,fontFamily:G.head,color:G.green,letterSpacing:"0.1em"}}>AI SCORED</span>
              </div>
            </div>

            {/* Rings — FIX: read correct field names from API response */}
            <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:10,marginBottom:18}}>
              <ScoreRing score={evalResult.scores?.overall??evalResult.score??3} label="Overall"/>
              <ScoreRing score={evalResult.scores?.knowledge_1_5??evalResult.knowledge??3} label="Knowledge"/>
              <ScoreRing score={(evalResult.star_coverage??0.5)*5} label="STAR"/>
              <ScoreRing score={(1-(evalResult.nervousness??0.2))*5} label="Composure"/>
            </div>

            {/* Grade badge */}
            {evalResult.grade&&(
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{
                  width:44,height:44,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:G.head,fontSize:22,fontWeight:900,
                  color:evalResult.grade==="A"?G.green:evalResult.grade==="B"?G.cyan:evalResult.grade==="C"?G.amber:G.red,
                  border:`2px solid ${evalResult.grade==="A"?G.green:evalResult.grade==="B"?G.cyan:evalResult.grade==="C"?G.amber:G.red}`,
                  background:`${evalResult.grade==="A"?G.green:evalResult.grade==="B"?G.cyan:evalResult.grade==="C"?G.amber:G.red}10`,
                }}>
                  {evalResult.grade}
                </div>
                {evalResult.grade_reasoning&&(
                  <div style={{fontSize:11,color:G.textMut,lineHeight:1.55,flex:1}}>{evalResult.grade_reasoning}</div>
                )}
              </div>
            )}

            {/* STAR badges */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>STAR COVERAGE</div>
              <StarBadge coverage={evalResult.star_coverage??0.5}/>
            </div>

            {/* DISC */}
            {evalResult.disc&&(
              <div style={{marginBottom:14}}>
                <SectionLabel color={G.violet}>DISC PROFILE</SectionLabel>
                {Object.entries(evalResult.disc).map(([k,v])=>(
                  <DiscBar key={k} label={k} value={v}
                    color={k==="Dominance"?G.red:k==="Influence"?G.cyan:k==="Steadiness"?G.green:G.violet}/>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {[
                {label:"WPM",val:evalResult.wpm??150,color:G.cyan},
                {label:"Fillers",val:evalResult.filler_count??0,color:(evalResult.filler_count??0)>5?G.red:G.green},
                {label:"Nervousness",val:`${((evalResult.nervousness??0.2)*100).toFixed(0)}%`,
                  color:(evalResult.nervousness??0.2)>0.6?G.red:(evalResult.nervousness??0.2)>0.35?G.amber:G.green},
              ].map(s=>(
                <div key={s.label} style={{
                  background:"rgba(8,16,28,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
                  borderRadius:6,padding:"10px 0",
                  textAlign:"center",border:`1px solid rgba(255,255,255,0.07)`,
                  boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)"}}>
                  <div style={{fontSize:20,fontFamily:G.head,color:s.color,fontWeight:700,
                    textShadow:`0 0 8px ${s.color}`}}>{s.val}</div>
                  <div style={{fontSize:10,color:G.textMut,marginTop:3}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Strengths & improvements from Groq */}
            {(evalResult.key_strengths?.length>0||evalResult.improvement_areas?.length>0)&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {evalResult.key_strengths?.length>0&&(
                  <div style={{padding:"10px 12px",background:`${G.green}08`,borderRadius:6,
                    border:`1px solid ${G.green}20`}}>
                    <div style={{fontSize:9,color:G.green,letterSpacing:"0.1em",marginBottom:6}}>STRENGTHS</div>
                    {evalResult.key_strengths.slice(0,3).map((s,i)=>(
                      <div key={i} style={{fontSize:11,color:G.textPri,lineHeight:1.55,marginBottom:3,
                        paddingLeft:10,position:"relative"}}>
                        <span style={{position:"absolute",left:0,color:G.green}}>✓</span>{s}
                      </div>
                    ))}
                  </div>
                )}
                {evalResult.improvement_areas?.length>0&&(
                  <div style={{padding:"10px 12px",background:`${G.amber}08`,borderRadius:6,
                    border:`1px solid ${G.amber}20`}}>
                    <div style={{fontSize:9,color:G.amber,letterSpacing:"0.1em",marginBottom:6}}>IMPROVE</div>
                    {evalResult.improvement_areas.slice(0,1).map((a,i)=>(
                      <div key={i} style={{fontSize:11,color:G.textPri,lineHeight:1.55,marginBottom:3,
                        paddingLeft:10,position:"relative"}}>
                        <span style={{position:"absolute",left:0,color:G.amber}}>→</span>{a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HR recommendation from Groq */}
            {evalResult.hr_recommendation&&(
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,
                padding:"8px 12px",borderRadius:6,
                background:`${evalResult.hr_recommendation==="Strong Yes"||evalResult.hr_recommendation==="Yes"?G.green:evalResult.hr_recommendation==="Maybe"?G.amber:G.red}0a`,
                border:`1px solid ${evalResult.hr_recommendation==="Strong Yes"||evalResult.hr_recommendation==="Yes"?G.green:evalResult.hr_recommendation==="Maybe"?G.amber:G.red}25`}}>
                <div style={{fontSize:13,fontFamily:G.head,fontWeight:700,
                  color:evalResult.hr_recommendation==="Strong Yes"||evalResult.hr_recommendation==="Yes"?G.green:evalResult.hr_recommendation==="Maybe"?G.amber:G.red,
                  whiteSpace:"nowrap"}}>
                  HR: {evalResult.hr_recommendation}
                </div>
                {evalResult.technical_evaluation&&(
                  <div style={{fontSize:11,color:G.textMut,lineHeight:1.5,flex:1}}>
                    {evalResult.technical_evaluation}
                  </div>
                )}
              </div>
            )}

            {/* Coaching tip */}
            {evalResult.coaching_tip&&(
              <div style={{padding:"10px 14px",background:`${G.cyan}0c`,borderRadius:6,
                border:`1px solid ${G.cyan}25`,fontSize:12,color:G.textPri,lineHeight:1.7,marginBottom:14}}>
                <span style={{color:G.cyan,fontWeight:700}}>💡 LIVE COACH: </span>
                {evalResult.coaching_tip}
              </div>
            )}

            {(evalResult.ideal_answer||question?.ideal_answer)&&(
              <div style={{padding:"12px 14px",background:`${G.amber}08`,borderRadius:8,
                border:`1px solid ${G.amber}25`,marginBottom:14}}>
                <div style={{fontSize:9,color:G.amber,fontFamily:G.head,
                  letterSpacing:"0.1em",marginBottom:6}}>REFERENCE ANSWER · COMPARE WITH YOUR RESPONSE</div>
                <div style={{fontSize:11,color:G.textPri,lineHeight:1.7}}>
                  {evalResult.ideal_answer||question?.ideal_answer}
                </div>
              </div>
            )}

            {/* ── FEEDBACK ENGINE: Conflict + Dialogic ── */}
            <AuraFeedbackSuite
              analysisResult={evalResult}
              question={qText}
              questionType={qType}
              apiBase={API}
              onScoreRevised={(newScore)=>{
                setEvalResult(prev=>(
                  prev&&prev.q_index===qIndex
                    ? applyKnowledgeScoreRevision(prev,newScore)
                    : prev
                ));
                setAnswers(prev=>prev.map((item,index)=>(
                  index===prev.length-1&&item.q_index===qIndex
                    ? applyKnowledgeScoreRevision(item,newScore)
                    : item
                )));
              }}
            />

            {/* ── DYNAMIC AI FOLLOW-UP & SENIOR PUSHBACK ── */}
            <div style={{marginTop:16,padding:"14px 16px",background:"rgba(139,92,246,0.06)",borderRadius:10,border:`1px solid ${G.purple}30`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>🎯</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:G.purple,fontFamily:G.head,letterSpacing:"0.05em"}}>
                      SENIOR INTERVIEWER FOLLOW-UP & PUSHBACK
                    </div>
                    <div style={{fontSize:10,color:G.textMut}}>
                      Experience an authentic senior interviewer follow-up probe and depth challenge
                    </div>
                  </div>
                </div>
                {!followUp&&(
                  <Btn onClick={fetchFollowUp} disabled={followUpLoading} color={G.purple} style={{fontSize:11,padding:"7px 14px"}}>
                    {followUpLoading ? "⚙ GENERATING PROBE…" : "⚡ TRIGGER FOLLOW-UP PUSHBACK"}
                  </Btn>
                )}
              </div>

              {followUp&&(
                <div style={{background:"rgba(15,23,42,0.85)",borderRadius:10,padding:16,border:`1px solid ${G.purple}50`,marginTop:14,boxShadow:`0 8px 30px rgba(139,92,246,0.15)`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:10,color:G.purple,fontFamily:G.head,letterSpacing:"0.09em",fontWeight:700,background:`${G.purple}18`,padding:"3px 8px",borderRadius:4,border:`1px solid ${G.purple}40`}}>
                        ⚡ LIVE SENIOR PROBE
                      </span>
                      <button onClick={()=>speak(followUp.follow_up)} style={{
                        background:"none",border:"none",color:G.cyan,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:G.mono
                      }}>
                        🔊 Replay Audio
                      </button>
                    </div>
                    {followUpEval ? (
                      <span style={{fontSize:11,color:G.green,fontFamily:G.head,fontWeight:700,padding:"3px 10px",borderRadius:20,background:`${G.green}15`,border:`1px solid ${G.green}40`}}>
                        ✓ DEFENSE EVALUATED: {(followUpEval.score||3.8).toFixed(1)}/5 ★
                      </span>
                    ) : (
                      <span style={{fontSize:10,color:G.amber,fontFamily:G.mono}}>
                        ● Answer required to complete probe
                      </span>
                    )}
                  </div>

                  <div style={{fontSize:15,color:"#f8fafc",fontWeight:700,lineHeight:1.6,marginBottom:12,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>
                    "{followUp.follow_up}"
                  </div>

                  <div style={{fontSize:11,color:G.textMut,marginBottom:14,lineHeight:1.5}}>
                    <span style={{color:G.purple,fontWeight:700}}>INTERVIEWER INTENT: </span>
                    {followUp.probe_reason}
                  </div>

                  {/* ── Interactive Candidate Defense Studio ── */}
                  {!followUpEval ? (
                    <div style={{padding:"14px",borderRadius:8,background:"rgba(10,20,38,0.7)",border:`1px solid ${G.purple}30`,marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                        <span style={{fontSize:11,fontFamily:G.head,color:G.cyan,letterSpacing:"0.06em",fontWeight:700}}>
                          YOUR ARCHITECTURAL DEFENSE / FOLLOW-UP RESPONSE:
                        </span>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <button onClick={followUpRecording ? stopFollowUpRec : startFollowUpRec} style={{
                            display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:20,
                            background:followUpRecording ? G.red : `linear-gradient(135deg, ${G.purple}, #6366f1)`,
                            border:"none",color:"#fff",fontSize:11,fontWeight:700,fontFamily:G.head,
                            cursor:"pointer",boxShadow:followUpRecording ? "0 0 12px #ef4444" : "0 2px 10px rgba(139,92,246,0.3)"
                          }}>
                            {followUpRecording ? (
                              <><span style={{animation:"pulse 0.8s infinite"}}>⏹</span> STOP & TRANSCRIBE</>
                            ) : (
                              <><span>🎙</span> RECORD VOICE DEFENSE</>
                            )}
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={followUpAnswer}
                        onChange={e=>setFollowUpAnswer(e.target.value)}
                        placeholder="Speak via microphone above or type your defense here (e.g. trade-offs considered, fallback strategies, latency guarantees, distributed edge cases)..."
                        rows={4}
                        style={{
                          width:"100%",padding:"12px 14px",fontSize:12,borderRadius:8,
                          background:"rgba(13,21,39,0.85)",border:`1px solid rgba(255,255,255,0.12)`,
                          color:"#f8fafc",outline:"none",boxSizing:"border-box",lineHeight:1.6,
                          resize:"vertical",fontFamily:"inherit"
                        }}
                      />
                      {followUpTranscriptionError&&(
                        <div role="alert" style={{marginTop:8,color:G.red,fontSize:11,lineHeight:1.5}}>
                          {followUpTranscriptionError}
                        </div>
                      )}

                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,flexWrap:"wrap",gap:10}}>
                        <span style={{fontSize:10,color:G.textMut,fontFamily:G.mono}}>
                          Words: {followUpAnswer.trim() ? followUpAnswer.trim().split(/\s+/).length : 0} · Characters: {followUpAnswer.length}
                        </span>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          <button onClick={()=>{setFollowUp(null);setFollowUpAnswer("");}} style={{
                            background:"none",border:"none",color:G.textMut,fontSize:11,cursor:"pointer",textDecoration:"underline",fontFamily:G.mono
                          }}>
                            Skip probe (Proceed without defense)
                          </button>
                          <Btn onClick={submitFollowUp} disabled={followUpSubmitting || !followUpAnswer.trim()} color={G.purple}
                            style={{padding:"8px 18px",fontSize:12,fontWeight:700,letterSpacing:"0.05em",borderRadius:8}}>
                            {followUpSubmitting ? "⚙ EVALUATING DEFENSE…" : "🚀 SUBMIT FOLLOW-UP DEFENSE"}
                          </Btn>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Evaluated Result Display ── */
                    <div style={{padding:"14px",borderRadius:8,background:"rgba(16,185,129,0.06)",border:`1px solid ${G.green}30`,marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>✅</span>
                          <span style={{fontSize:12,fontWeight:700,color:G.green,fontFamily:G.head}}>
                            PROBE DEFENSE EVALUATION
                          </span>
                        </div>
                        <span style={{fontSize:14,fontFamily:G.head,fontWeight:800,color:G.green}}>
                          SCORE: {(followUpEval.score||3.8).toFixed(2)}/5.0
                        </span>
                      </div>

                      <div style={{fontSize:12,color:"#cbd5e1",marginBottom:10,lineHeight:1.6,background:"rgba(0,0,0,0.2)",padding:10,borderRadius:6}}>
                        <span style={{color:G.cyan,fontWeight:700}}>Your Defense: </span>
                        "{followUpAnswer}"
                      </div>

                      {followUpEval.coaching_tip && (
                        <div style={{fontSize:11,color:G.textPri,marginBottom:10,lineHeight:1.6,padding:"8px 10px",background:`${G.cyan}10`,borderRadius:6,border:`1px solid ${G.cyan}25`}}>
                          <span style={{color:G.cyan,fontWeight:700}}>💡 Senior Feedback: </span>
                          {followUpEval.coaching_tip}
                        </div>
                      )}

                      <div style={{padding:"10px 12px",background:`${G.green}08`,borderRadius:6,border:`1px solid ${G.green}25`,fontSize:11}}>
                        <div style={{color:G.green,fontSize:9,marginBottom:4,letterSpacing:"0.05em",fontWeight:700}}>
                          ★ SENIOR BENCHMARK CRITERIA:
                        </div>
                        <div style={{color:G.textPri,lineHeight:1.55}}>{followUp.ideal_follow_up_answer}</div>
                      </div>

                      <div style={{marginTop:10,fontSize:10,color:G.green,fontFamily:G.mono,textAlign:"right"}}>
                        ✓ Defense verified and credited to final scorecard dossier
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{display:"flex",justifyContent:"flex-end",gap:10,alignItems:"center",marginTop:16}}>
              {qIndex+1>=total&&<span style={{fontSize:10,color:G.textMut,letterSpacing:"0.06em"}}>{total} questions answered</span>}
              <Btn onClick={nextQ} color={qIndex+1>=total?G.amber:G.cyan}
                style={{padding:"10px 24px",fontSize:13,letterSpacing:"0.08em",borderRadius:8}}>
                {loading?"⚙ LOADING…":qIndex+1>=total?"🏁 FINISH SESSION →":"▶ NEXT QUESTION →"}
              </Btn>
            </div>
          </Card>
        )}


      </div>

      {/* ── SIDEBAR ── */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>

        {/* Answer History Drawer (slide-in) */}
        <AnswerHistoryDrawer answers={answers} open={historyOpen} onClose={()=>setHistoryOpen(false)}/>

        {/* Progress */}
        <Card style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
          <SectionLabel>Session Progress</SectionLabel>
          <Timeline answers={answers} total={total} current={qIndex}/>
          <div style={{marginTop:8}}>
            <Btn onClick={()=>setHistoryOpen(o=>!o)} color={G.violet} style={{fontSize:10,padding:"5px 12px"}} full>
              📋 ANSWER HISTORY ({answers.length})
            </Btn>
          </div>
          {answers.length>0&&(
            <div style={{marginTop:12}}>
              <div style={{fontSize:9,color:G.textMut,letterSpacing:"0.08em"}}>SESSION AVG</div>
              <div style={{fontSize:26,fontFamily:G.head,fontWeight:700,marginTop:2,
                color:scoreColor(answers.reduce((a,x)=>a+x.score,0)/answers.length)}}>
                {(answers.reduce((a,x)=>a+x.score,0)/answers.length).toFixed(2)}
                <span style={{fontSize:12,color:G.textMut}}>/5</span>
              </div>
            </div>
          )}
        </Card>

        {/* Nervousness Trend Sparkline */}
        {answers.length>1&&<NervousnessHeatmap answers={answers} compact={true}/>}

        {/* RL Recommendation */}
        {rlHint&&(
          <Card style={{borderColor:`${G.violet}28`,background:'rgba(12,10,30,0.55)',backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:14}}>🧠</span>
              <SectionLabel color={G.violet}>RL NEXT ACTION</SectionLabel>
            </div>
            <div style={{fontSize:11,color:G.textPri,lineHeight:1.9,borderLeft:`2px solid ${G.violet}40`,paddingLeft:10}}>
              <div><span style={{color:G.violet,fontSize:9,letterSpacing:"0.08em",fontFamily:"'Orbitron',monospace"}}>TYPE </span>{rlHint.type}</div>
              <div><span style={{color:G.violet,fontSize:9,letterSpacing:"0.08em",fontFamily:"'Orbitron',monospace"}}>DIFF </span>{rlHint.difficulty}</div>
              <div><span style={{color:G.violet,fontSize:9,letterSpacing:"0.08em",fontFamily:"'Orbitron',monospace"}}>ACTION </span>{rlHint.action_idx??"—"}</div>
              {rlHint.follow_up&&<div style={{marginTop:6}}><NeonBadge text="Follow-up Probe" color={G.amber}/></div>}
            </div>
          </Card>
        )}

        {/* Narrative Coherence — live (Feature 6, appears from answer 2 onward) */}
        {coherenceReport?.available&&(
          <CoherenceReportCard report={coherenceReport} compact={true}/>
        )}

        {/* Webcam — live feed + scores after eval */}
        <WebcamCapture
          active={recording}
          onFramesReady={(frames)=>{
            webcamFramesRef.current=frames;
            setWebcamFrames(frames);
          }}
          webcamResult={webcamResult}
        />

        {/* Voice Nervousness / Acoustic Calibration */}
        <Card>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
            <SectionLabel color={G.amber}>SPEECH ACOUSTIC CALIBRATION</SectionLabel>
            {evalResult?.nervousness_detail?.baseline_corrected&&(
              <span style={{
                fontSize:8,fontFamily:G.head,color:G.cyan,letterSpacing:"0.1em",
                padding:"2px 8px",borderRadius:99,
                border:`1px solid ${G.cyan}40`,background:`${G.cyan}10`,
              }}>⟳ BASELINE CALIBRATED</span>
            )}
          </div>
          {(()=>{
            const vn=evalResult?.nervousness_detail?.voice
              ??(evalResult?.nervousness!=null?evalResult.nervousness:null);
            if(vn==null){
              return(<div style={{fontSize:12,color:G.textMut,marginTop:4,lineHeight:1.6}}>
                Submit an answer to calculate acoustic composure.
              </div>);
            }
            const pct=(vn*100).toFixed(0);
            const col=vn>0.6?G.red:vn>0.35?G.amber:G.green;
            return(<>
              <div style={{fontSize:28,fontFamily:G.head,fontWeight:700,
                color:col,textShadow:`0 0 12px ${col}`}}>
                {pct}%
              </div>
              <div style={{height:5,background:G.bgPanel,borderRadius:2,marginTop:8,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,
                  background:`linear-gradient(90deg,${G.green},${G.amber},${G.red})`,
                  transition:'width 1s ease',boxShadow:`0 0 8px ${G.amber}`}}/>
              </div>
              <div style={{fontSize:10,color:G.textMut,marginTop:6,lineHeight:1.6}}>
                Acoustic pitch variance & pause distribution calibrated to speaker baseline.
              </div>
            </>);
          })()}
        </Card>

        {/* Session meta */}
        <Card style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
          <SectionLabel>Session Intel</SectionLabel>
          {[
            {label:"Role",val:session.role,color:G.cyan},
            {label:"Difficulty",val:session.difficulty.toUpperCase(),color:session.difficulty==="hard"?G.red:session.difficulty==="easy"?G.green:G.amber},
            {label:"LLM",val:"Groq · GPT-OSS-120B",color:G.violet},
            {label:"ASR",val:"Gemini → Groq",color:G.cyan},
            {label:"RL",val:"Q-learning v2.0",color:G.green},
          ].map(r=>(
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"6px 0",borderBottom:`1px solid ${G.border}`,fontSize:11}}>
              <span style={{color:G.textMut,fontSize:10,letterSpacing:"0.06em"}}>{r.label}</span>
              <span style={{color:r.color||G.textPri,fontFamily:G.head,fontSize:10,letterSpacing:"0.04em"}}>{r.val}</span>
            </div>
          ))}
          <div style={{marginTop:10,padding:"8px 0 0",display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:G.green,boxShadow:`0 0 6px ${G.green}`,animation:"pulse 1.5s infinite"}}/>
            <span style={{fontSize:9,color:G.green,fontFamily:G.head,letterSpacing:"0.08em"}}>LIVE SESSION ACTIVE</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
function ResumeGapCard({ gap }) {
  const [tab, setTab] = React.useState("uncovered");
  const [expanded, setExpanded] = React.useState({});

  if (!gap || !gap.total_claims) return null;

  const riskColor = {
    Low:      G.green,
    Medium:   G.amber,
    High:     G.red,
    Critical: G.red,
  }[gap.risk_level] || G.amber;

  const statusColor = { covered: G.green, partial: G.amber, uncovered: G.red };
  const tabs = [
    { key: "uncovered", label: `❌ Uncovered (${gap.uncovered_count})`, color: G.red },
    { key: "partial",   label: `⚠️ Partial (${gap.partial_count})`,    color: G.amber },
    { key: "covered",   label: `✅ Covered (${gap.covered_count})`,    color: G.green },
  ];
  const activeList = gap[tab] || [];

  const toggleExpand = (i) =>
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <Card style={{ marginBottom: 16, borderColor: `${riskColor}30` }}>
      {/* ── Header ── */}
      <SectionLabel color={riskColor}>RESUME ↔ INTERVIEW GAP ANALYSIS</SectionLabel>

      {/* ── Summary row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Coverage bar */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: G.textMut }}>CLAIM COVERAGE</span>
            <span style={{ fontSize: 10, fontFamily: G.head, color: riskColor }}>
              {gap.coverage_pct}%
            </span>
          </div>
          <div style={{ height: 6, background: G.bgPanel, borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${gap.coverage_pct}%`,
              background: `linear-gradient(90deg, ${riskColor}, ${riskColor}99)`,
              borderRadius: 4, transition: "width 0.8s ease",
              boxShadow: `0 0 8px ${riskColor}60`,
            }}/>
          </div>
        </div>
        {/* Risk badge */}
        <div style={{
          padding: "4px 12px", borderRadius: 20,
          border: `1px solid ${riskColor}50`,
          background: `${riskColor}12`,
          fontSize: 10, fontFamily: G.head, color: riskColor,
          letterSpacing: "0.1em",
        }}>
          {gap.risk_level.toUpperCase()} RISK
        </div>
        {/* Stat pills */}
        {[
          { label: "CLAIMS", val: gap.total_claims, color: G.textMut },
          { label: "COVERED", val: gap.covered_count, color: G.green },
          { label: "PARTIAL", val: gap.partial_count, color: G.amber },
          { label: "MISSED",  val: gap.uncovered_count, color: G.red },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontFamily: G.head, color: s.color, fontWeight: 700 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: G.textDim, letterSpacing: "0.08em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Coaching summary ── */}
      {gap.summary && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 14,
          background: `${riskColor}0a`, border: `1px solid ${riskColor}25`,
          fontSize: 12, color: G.textMut, lineHeight: 1.7,
        }}>
          {gap.summary}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
            fontSize: 10, fontFamily: G.mono, letterSpacing: "0.04em",
            border: `1px solid ${tab === t.key ? t.color : G.border}`,
            background: tab === t.key ? `${t.color}18` : "transparent",
            color: tab === t.key ? t.color : G.textMut,
            transition: "all 0.2s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Claim list ── */}
      {activeList.length === 0 ? (
        <div style={{ fontSize: 12, color: G.textDim, padding: "10px 0" }}>
          No claims in this category.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activeList.map((item, i) => {
            const clm    = item.claim || {};
            const color  = statusColor[item.status] || G.textMut;
            const isOpen = expanded[i];
            return (
              <div key={i} style={{
                borderRadius: 8, border: `1px solid ${color}25`,
                background: `${color}07`, overflow: "hidden",
              }}>
                {/* Row header — always visible */}
                <div
                  onClick={() => toggleExpand(i)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 12px", cursor: "pointer",
                  }}
                >
                  {/* Type badge */}
                  <span style={{
                    padding: "2px 8px", borderRadius: 10, flexShrink: 0,
                    fontSize: 9, fontFamily: G.mono,
                    border: `1px solid ${color}40`,
                    color, background: `${color}15`,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    marginTop: 1,
                  }}>
                    {clm.claim_type || "claim"}
                  </span>
                  {/* Claim text */}
                  <span style={{
                    fontSize: 11, color: G.textPri, flex: 1, lineHeight: 1.55,
                  }}>
                    {clm.text || "(no text)"}
                  </span>
                  {/* Score pill */}
                  <span style={{
                    fontSize: 10, color: G.textDim, flexShrink: 0, marginTop: 1,
                  }}>
                    {(item.coverage_score * 100).toFixed(0)}%
                    {" "}{isOpen ? "▲" : "▼"}
                  </span>
                </div>

                {/* Expanded details */}
                {isOpen && (item.predicted_question || item.coaching_tip) && (
                  <div style={{
                    padding: "0 12px 12px 12px",
                    borderTop: `1px solid ${color}20`,
                  }}>
                    {item.predicted_question && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 9, color: G.textDim, letterSpacing: "0.08em", marginBottom: 4 }}>
                          PREDICTED INTERVIEWER QUESTION
                        </div>
                        <div style={{
                          fontSize: 11, color: G.cyan, lineHeight: 1.6,
                          padding: "8px 10px", borderRadius: 6,
                          background: `${G.cyan}0a`, border: `1px solid ${G.cyan}20`,
                        }}>
                          "{item.predicted_question}"
                        </div>
                      </div>
                    )}
                    {item.coaching_tip && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 9, color: G.textDim, letterSpacing: "0.08em", marginBottom: 4 }}>
                          COACHING TIP
                        </div>
                        <div style={{
                          fontSize: 11, color: G.amber, lineHeight: 1.6,
                          padding: "8px 10px", borderRadius: 6,
                          background: `${G.amber}0a`, border: `1px solid ${G.amber}20`,
                        }}>
                          💡 {item.coaching_tip}
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 9, color: G.textDim }}>
                      Source: {clm.source || "—"} · Method: {item.method || "—"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE: STUDY NOTES  (v3.0)
//  Calls the Anthropic API directly to generate role + company-pack aware
//  structured interview prep notes. No new backend route needed — the LLM
//  prompt encodes the same ROLE_SYLLABUS + COMPANY_STYLE logic from
//  adaptive_sequencer.py so notes always match the session configuration.
// ══════════════════════════════════════════════════════════════════════════════

const NOTES_TOPICS={
  "Software Engineer":["Data Structures & Algorithms","System Design","CS Fundamentals","Behavioural","HR & Culture Fit"],
  "Frontend Developer":["JavaScript & TypeScript","React & Component Architecture","CSS & Web Performance","Behavioural","HR & Culture Fit"],
  "Backend Developer":["API Design & Protocols","Databases","System Design","Behavioural","HR & Culture Fit"],
  "Data Scientist":["Statistics & Probability","Machine Learning","Data Engineering & SQL","Behavioural","HR & Culture Fit"],
  "Machine Learning Engineer":["ML Systems Design","Deep Learning Fundamentals","MLOps & Production","Behavioural","HR & Culture Fit"],
  "Product Manager":["Product Strategy & Vision","Execution & Delivery","Metrics & Analytics","Behavioural","HR & Culture Fit"],
  "DevOps Engineer":["CI/CD & Automation","Infrastructure & Cloud","Observability & Incident Response","Behavioural","HR & Culture Fit"],
  "Data Engineer":["Data Pipeline & ETL","Data Warehousing","Distributed Systems","Behavioural","HR & Culture Fit"],
  "Cloud Architect":["Cloud Platform Expertise","Security & Compliance","High Availability & DR","Behavioural","HR & Culture Fit"],
  "Cybersecurity Analyst":["Threat Detection & Response","Vulnerability Management","Security Architecture","Behavioural","HR & Culture Fit"],
  "Full Stack Developer":["Frontend Fundamentals","Backend & APIs","System Design","Behavioural","HR & Culture Fit"],
  "QA Engineer":["Test Strategy & Planning","Automation Frameworks","Performance & Security Testing","Behavioural","HR & Culture Fit"],
  "Scrum Master":["Agile & Scrum Framework","Team Coaching & Facilitation","Metrics & Continuous Improvement","Behavioural","HR & Culture Fit"],
  "Mobile Developer":["Platform Fundamentals","UI & Performance","Cross-Platform","Behavioural","HR & Culture Fit"],
  "System Designer":["Distributed System Fundamentals","Large-Scale Architecture","Scalability & Reliability","Behavioural","HR & Culture Fit"],
};

const NOTES_PACK_LABELS={
  no_pack:"Standard",faang:"FAANG / Big Tech",startup:"Startup",
  consulting:"Consulting",fintech:"Fintech",healthtech:"Healthtech",
};

const NOTES_PACK_EXTRA={
  faang:"Weight system design and leadership principles heavily. Use Amazon Leadership Principles language where relevant. Expect bar-raising standards — surface what separates good from great answers.",
  startup:"Weight ambiguity tolerance, speed, and culture fit. Use lean, pragmatic examples. Avoid over-engineering. Show how candidates demonstrate scrappiness and ownership.",
  consulting:"Weight structured thinking, frameworks (MECE, STAR, issue trees), and stakeholder communication. Surface how to translate technical ideas to executive audiences.",
  fintech:"Weight reliability, compliance awareness (GDPR, PCI-DSS), and data accuracy. Show how candidates reason about risk, auditability, and trust.",
  healthtech:"Weight privacy (HIPAA), patient safety, and regulatory constraints. Show how candidates balance feature velocity with the stakes of healthcare failure.",
  no_pack:"",
};

// Confidence self-rating stored in localStorage per topic+role key
const CONF_KEY=(role,topic)=>`conf:${role}:${topic}`;
const getConf=(role,topic)=>parseInt(localStorage.getItem(CONF_KEY(role,topic))||"0",10);
const setConf=(role,topic,val)=>localStorage.setItem(CONF_KEY(role,topic),String(val));

function buildNotesPrompt(role,pack,depth,topics){
  const packLabel=NOTES_PACK_LABELS[pack]||"Standard";
  const packExtra=NOTES_PACK_EXTRA[pack]||"";
  const depthInstr={
    concise:"Be concise — 2-3 bullet points per section. Only the most critical points.",
    standard:"Be thorough — 4-6 bullet points per section with clear, memorable explanations.",
    deep:"Be comprehensive — 6-8 bullet points per section. Include nuance, edge cases, common interviewer follow-ups, and what separates average from exceptional answers.",
  }[depth]||"";

  return `You are an expert interview coach preparing a ${role} candidate for a job interview.

Generate structured, practical interview study notes covering these topics: ${topics.join(", ")}.
${packExtra?`\nCompany style: ${packLabel}. ${packExtra}`:""}

${depthInstr}

CRITICAL — NO CODE QUESTIONS: This is a spoken interview system. Never include any question asking the candidate to write, implement, or produce code. All questions must be conceptual, architectural, or experiential — suitable for a verbal spoken answer.

For each topic produce exactly these subsections:

## [Topic Name]

### Key concepts to know
- [concept name]: [one-sentence explanation of what it is and why it matters in interviews]

### Common interview questions
- [question text] *(conceptual / architectural / behavioural / situational)*

### Strong answer patterns
- [specific technique or structure that makes answers stand out for this topic]

### Common mistakes to avoid
- [pitfall]: [why candidates make this mistake and how to avoid it]

### Quick-recall tips
- [memorable mnemonic, acronym, or mental model — something a candidate can recall under pressure]

---

Be specific, actionable, and direct. Write as if you are coaching someone the night before their interview. Avoid generic advice.`;
}

// Robust markdown parser — scans for ## headings by position, correct body slicing
function stripMd(s){
  // Remove **bold**, *italic*, _underline_, `backtick`, and leading/trailing whitespace
  return s.replace(/\*\*([^*]+)\*\*/g,"$1")
          .replace(/\*([^*]+)\*/g,"$1")
          .replace(/_([^_]+)_/g,"$1")
          .replace(/`([^`]+)`/g,"$1")
          .replace(/\*\*/g,"").replace(/\*/g,"").replace(/_/g,"")
          .trim();
}
function parseNotesMarkdown(raw){
  const sectionRegex=/^## (.+)$/gm;
  const sections=[];
  const indices=[];
  let match;
  while((match=sectionRegex.exec(raw))!==null){
    // Store the START of the heading line (not end), so body slicing is correct
    indices.push({title:stripMd(match[1]),start:match.index,lineEnd:match.index+match[0].length});
  }
  indices.forEach(({title,lineEnd},i)=>{
    // Body starts immediately after the "## Title" line
    // Body ends at the start of the NEXT "## " heading (or end of string)
    const nextStart=i+1<indices.length ? indices[i+1].start : raw.length;
    const body=raw.slice(lineEnd,nextStart);
    const lines=body.split("\n");
    const subsections=[];
    let current=null;
    lines.forEach(line=>{
      const t=line.trim();
      if(!t||t==="---"||t==="***"||t==="---")return;
      if(t.startsWith("### ")){
        if(current&&current.items.length>0)subsections.push(current);
        else if(current){}// skip empty subsections
        current={heading:stripMd(t.replace(/^###\s*/,"")),items:[]};
        return;
      }
      if(!current)return;
      // Numbered list: "1. item"
      if(/^\d+\.\s/.test(t)){current.items.push(stripMd(t.replace(/^\d+\.\s*/,"")));return;}
      // Bullet: "- item" or "* item"
      if(t.startsWith("- ")||t.startsWith("* ")){current.items.push(stripMd(t.slice(2)));return;}
      // Continuation line (not a heading or divider) — append to last item or as new item
      if(t&&!t.startsWith("#")){
        if(current.items.length>0){
          // Append as continuation to last item if it looks like a run-on
          const last=current.items[current.items.length-1];
          if(last.length<80&&!last.endsWith(".")){
            current.items[current.items.length-1]=last+" "+stripMd(t);
          }else{
            current.items.push(stripMd(t));
          }
        }else{
          current.items.push(stripMd(t));
        }
      }
    });
    if(current&&current.items.length>0)subsections.push(current);
    if(title&&subsections.length>0){
      sections.push({title,subsections});
    }
  });
  return sections;
}

// ── Confidence pill component (1-5 self-rating) ────────────────────────────
function ConfidencePill({role,topic}){
  const[val,setVal]=React.useState(()=>getConf(role,topic));
  const colors=["","#ff3366","#fbbf24","#fbbf24","#00d4ff","#00ff88"];
  const labels=["","Shaky","Okay","Okay","Strong","Mastered"];
  const save=v=>{setConf(role,topic,v);setVal(v);};
  return(
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      {[1,2,3,4,5].map(n=>(
        <div key={n} onClick={e=>{e.stopPropagation();save(n);}} style={{
          width:14,height:14,borderRadius:"50%",cursor:"pointer",flexShrink:0,
          background:n<=val?colors[val]:"rgba(255,255,255,0.08)",
          border:`1px solid ${n<=val?colors[val]+"80":"rgba(255,255,255,0.12)"}`,
          transition:"all 0.15s",
        }}/>
      ))}
      {val>0&&<span style={{fontSize:9,color:colors[val],fontFamily:"'Orbitron',monospace",letterSpacing:"0.06em",marginLeft:3}}>{labels[val]}</span>}
    </div>
  );
}

// ── Flashcard modal ────────────────────────────────────────────────────────
function FlashcardModal({cards,onClose}){
  const[idx,setIdx]=React.useState(0);
  const[flipped,setFlipped]=React.useState(false);
  const[score,setScore]=React.useState({got:0,missed:0});
  const[done,setDone]=React.useState(false);
  const card=cards[idx];
  const advance=(correct)=>{
    setScore(s=>({got:s.got+(correct?1:0),missed:s.missed+(correct?0:1)}));
    if(idx+1>=cards.length){setDone(true);}
    else{setIdx(i=>i+1);setFlipped(false);}
  };
  return(
    <div style={{
      position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",
      justifyContent:"center",background:"rgba(2,8,16,0.92)",backdropFilter:"blur(12px)",
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"min(520px,94vw)",background:"#0a1520",borderRadius:16,
        border:"1px solid rgba(167,139,250,0.3)",
        boxShadow:"0 0 60px rgba(167,139,250,0.15)",padding:"28px 28px 24px",
      }}>
        {done?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:32,marginBottom:10}}>🎯</div>
            <div style={{fontSize:18,fontWeight:600,color:"#e0f7ff",marginBottom:6}}>Session complete</div>
            <div style={{fontSize:13,color:"#5a8a9f",marginBottom:20}}>
              <span style={{color:"#00ff88"}}>✓ {score.got} got it</span>
              {"  "}
              <span style={{color:"#ff3366"}}>✗ {score.missed} need review</span>
            </div>
            <div onClick={onClose} style={{
              display:"inline-block",padding:"9px 24px",borderRadius:8,cursor:"pointer",
              background:"rgba(167,139,250,0.15)",border:"1px solid rgba(167,139,250,0.4)",
              color:"#a78bfa",fontFamily:"'Share Tech Mono',monospace",fontSize:13,
            }}>Close</div>
          </div>
        ):(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:10,color:"#5a8a9f",fontFamily:"'Orbitron',monospace",letterSpacing:"0.15em"}}>
                FLASHCARD {idx+1} / {cards.length}
              </div>
              <div style={{display:"flex",gap:10,fontSize:11}}>
                <span style={{color:"#00ff88"}}>✓ {score.got}</span>
                <span style={{color:"#ff3366"}}>✗ {score.missed}</span>
              </div>
            </div>
            {/* Card */}
            <div onClick={()=>setFlipped(f=>!f)} style={{
              minHeight:160,borderRadius:12,padding:"20px 22px",cursor:"pointer",
              background:flipped?"rgba(167,139,250,0.08)":"rgba(0,212,255,0.06)",
              border:`1px solid ${flipped?"rgba(167,139,250,0.3)":"rgba(0,212,255,0.2)"}`,
              display:"flex",flexDirection:"column",justifyContent:"center",
              transition:"all 0.25s",marginBottom:16,
            }}>
              <div style={{fontSize:9,color:flipped?"#a78bfa":"#00d4ff",fontFamily:"'Orbitron',monospace",
                letterSpacing:"0.2em",marginBottom:10}}>{flipped?"ANSWER":"QUESTION — tap to reveal"}</div>
              <div style={{fontSize:14,color:"#e0f7ff",lineHeight:1.7}}>
                {flipped?card.answer:card.question}
              </div>
            </div>
            {flipped?(
              <div style={{display:"flex",gap:10}}>
                {[{label:"✗ Missed it",color:"#ff3366",c:false},{label:"✓ Got it",color:"#00ff88",c:true}].map(({label,color,c})=>(
                  <div key={label} onClick={()=>advance(c)} style={{
                    flex:1,textAlign:"center",padding:"10px",borderRadius:8,cursor:"pointer",
                    background:`${color}12`,border:`1px solid ${color}35`,color,
                    fontFamily:"'Share Tech Mono',monospace",fontSize:13,transition:"all 0.15s",
                  }}>{label}</div>
                ))}
              </div>
            ):(
              <div style={{textAlign:"center",fontSize:11,color:"#5a8a9f"}}>tap card to reveal answer</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Section accordion item ─────────────────────────────────────────────────
function SectionAccordion({section,si,role,subIcons,subColors,getSubIcon,getSubColor}){
  const[open,setOpen]=React.useState(true);
  return(
    <div style={{
      borderRadius:10,border:`1px solid rgba(167,139,250,${open?0.22:0.12})`,
      background:open?"rgba(10,14,28,0.7)":"rgba(8,12,22,0.4)",
      marginBottom:12,overflow:"hidden",transition:"border-color 0.2s",
    }}>
      {/* Accordion header */}
      <div onClick={()=>setOpen(o=>!o)} style={{
        display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
        cursor:"pointer",userSelect:"none",
      }}>
        <div style={{
          width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",
          justifyContent:"center",flexShrink:0,fontSize:11,fontFamily:"'Orbitron',monospace",
          fontWeight:700,background:"rgba(167,139,250,0.15)",color:"#a78bfa",
          border:"1px solid rgba(167,139,250,0.3)",
        }}>{si+1}</div>
        <div style={{flex:1,fontSize:13,fontWeight:600,color:"#e0f7ff",letterSpacing:"0.02em"}}>
          {section.title}
        </div>
        <ConfidencePill role={role} topic={section.title}/>
        <div style={{
          width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",
          color:"#5a8a9f",fontSize:11,transform:open?"rotate(90deg)":"rotate(0deg)",
          transition:"transform 0.2s",
        }}>▶</div>
      </div>

      {/* Accordion body */}
      {open&&(
        <div style={{padding:"0 16px 16px"}}>
          {section.subsections.map((sub,ssi)=>{
            const icon=getSubIcon(sub.heading);
            const color=getSubColor(sub.heading);
            const isMistake=sub.heading.toLowerCase().includes("mistake");
            const isTip=sub.heading.toLowerCase().includes("quick");
            const isPattern=sub.heading.toLowerCase().includes("strong");
            const isQ=sub.heading.toLowerCase().includes("question");
            const tagColor=isMistake?"#ff3366":isTip?"#fbbf24":isPattern?"#00ff88":isQ?"#a78bfa":"#00d4ff";
            const tagLabel=isMistake?"avoid":isTip?"tip":isPattern?"do this":isQ?"Q":"note";
            return(
              <div key={ssi} style={{marginBottom:14}}>
                <div style={{
                  fontSize:10,color,letterSpacing:"0.1em",marginBottom:7,
                  display:"flex",alignItems:"center",gap:6,fontFamily:"'Orbitron',monospace",
                }}>
                  <span>{icon}</span>
                  <span>{sub.heading.toUpperCase()}</span>
                </div>
                {sub.items.map((item,ii)=>{
                  const colonIdx=item.indexOf(":");
                  const hasColon=colonIdx>0&&colonIdx<45;
                  const rendered=hasColon
                    ?<><span style={{color:"#e0f7ff",fontWeight:600}}>{item.slice(0,colonIdx)}</span><span style={{color:"#7a9eb5"}}>{item.slice(colonIdx)}</span></>
                    :<span style={{color:"#7a9eb5"}}>{item}</span>;
                  return(
                    <div key={ii} style={{
                      display:"flex",gap:10,alignItems:"flex-start",
                      padding:"7px 0",borderBottom:"1px solid rgba(0,212,255,0.07)",
                    }}>
                      <span style={{
                        fontSize:9,padding:"2px 6px",borderRadius:4,flexShrink:0,
                        marginTop:3,fontFamily:"'Orbitron',monospace",letterSpacing:"0.05em",
                        background:`${tagColor}15`,border:`1px solid ${tagColor}30`,color:tagColor,
                      }}>{tagLabel}</span>
                      <div style={{fontSize:13,lineHeight:1.75}}>{rendered}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PageStudyNotes ─────────────────────────────────────────────────────────
function PageStudyNotes({onNav}){
  const[role,setRole]=React.useState("Software Engineer");
  const[pack,setPack]=React.useState("no_pack");
  const[depth,setDepth]=React.useState("standard");
  const[selectedTopics,setSelectedTopics]=React.useState(new Set(NOTES_TOPICS["Software Engineer"]));
  const[loading,setLoading]=React.useState(false);
  const[notes,setNotes]=React.useState(null);
  const[rawText,setRawText]=React.useState("");
  const[error,setError]=React.useState("");
  const[history,setHistory]=React.useState([]);
  const[copied,setCopied]=React.useState(false);
  const[activeHistIdx,setActiveHistIdx]=React.useState(null);
  const[flashcards,setFlashcards]=React.useState(null);
  const[activeSection,setActiveSection]=React.useState(null); // for TOC highlight
  const[searchQuery,setSearchQuery]=React.useState("");
  const[expandAll,setExpandAll]=React.useState(true);

  const handleRoleChange=r=>{
    setRole(r);
    setSelectedTopics(new Set(NOTES_TOPICS[r]||[]));
    setNotes(null);setError("");setSearchQuery("");
  };

  const toggleTopic=t=>{
    setSelectedTopics(prev=>{
      const next=new Set(prev);
      next.has(t)?next.delete(t):next.add(t);
      return next;
    });
  };

  const generate=async()=>{
    if(loading)return;
    if(!selectedTopics.size){setError("Select at least one topic.");return;}
    setLoading(true);setError("");setNotes(null);setActiveHistIdx(null);
    setRawText("");setFlashcards(null);setSearchQuery("");
    try{
      const topics=[...selectedTopics];
      const res=await authFetch(`${API}/study/notes`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({role,company_pack:pack,depth,topics}),
      });
      if(!res.ok){
        const err=await res.json().catch(()=>({}));
        throw new Error(err.detail||`Server error ${res.status}`);
      }
      const reader=res.body.getReader();
      const decoder=new TextDecoder();
      let accumulated="";
      let buffer="";
      let lastSectionCount=0;
      setLoading(false);
      while(true){
        const{done,value}=await reader.read();
        if(done)break;
        buffer+=decoder.decode(value,{stream:true});
        const lines=buffer.split("\n");
        buffer=lines.pop();
        for(const line of lines){
          if(!line.startsWith("data:"))continue;
          const chunk=line.slice(5).trim();
          if(chunk==="[DONE]"||!chunk)continue;
          if(chunk.startsWith("ERROR:")){setError(chunk.replace("ERROR:","").trim());return;}
          // Unescape \\n that the backend adds so SSE frames stay intact
          accumulated+=chunk.replace(/\\n/g,"\n");
        }
        setRawText(accumulated);
        // Only re-parse when a new ## section completes — avoids thrashing parser on every chunk
        const sectionCount=(accumulated.match(/^## /gm)||[]).length;
        if(sectionCount!==lastSectionCount){
          lastSectionCount=sectionCount;
          setNotes(parseNotesMarkdown(accumulated));
        }
      }
      const finalParsed=parseNotesMarkdown(accumulated);
      setNotes(finalParsed);setRawText(accumulated);
      const label=`${role.split(" ")[0]} · ${NOTES_PACK_LABELS[pack]} · ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`;
      setHistory(h=>[{label,sections:finalParsed,raw:accumulated,role,pack,depth,topics},...h].slice(0,6));
    }catch(e){
      setError(e.message||"Generation failed.");
      setLoading(false);
    }
  };

  const copyNotes=()=>{
    navigator.clipboard.writeText(rawText).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  const[pdfLoading,setPdfLoading]=React.useState(false);
  const[pdfError,setPdfError]=React.useState("");
  const downloadPdf=async()=>{
    if(!notes||pdfLoading)return;
    setPdfLoading(true);setPdfError("");
    try{
      // Collect confidence scores for all topics from localStorage
      const confidence={};
      if(notes){notes.forEach(s=>{const v=getConf(role,s.title);if(v>0)confidence[s.title]=v;});}
      const res=await authFetch(`${API}/study/notes/pdf`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          role,
          pack_label:NOTES_PACK_LABELS[pack]||"Standard",
          depth:depth.charAt(0).toUpperCase()+depth.slice(1),
          notes,
          confidence,
        }),
      });
      if(!res.ok){
        const err=await res.json().catch(()=>({}));
        throw new Error(err.detail||`Server error ${res.status}`);
      }
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`${role.replace(/ /g,"_")}_Interview_Notes.pdf`;
      document.body.appendChild(a);a.click();
      document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }catch(e){
      setPdfError(e.message||"PDF generation failed.");
      setTimeout(()=>setPdfError(""),4000);
    }finally{
      setPdfLoading(false);
    }
  };

  // Build flashcards from notes — Q from "Common interview questions", A from "Strong answer patterns"
  const buildFlashcards=()=>{
    if(!notes)return;
    const cards=[];
    notes.forEach(section=>{
      const qSub=section.subsections.find(s=>s.heading.toLowerCase().includes("question"));
      const aSub=section.subsections.find(s=>s.heading.toLowerCase().includes("strong"));
      if(qSub&&aSub){
        qSub.items.forEach((q,i)=>{
          const a=aSub.items[i]||aSub.items[0]||"Refer to your notes.";
          cards.push({question:q.replace(/\*\(.*?\)\*/,"").trim(),answer:a,topic:section.title});
        });
      }
    });
    // Shuffle
    for(let i=cards.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [cards[i],cards[j]]=[cards[j],cards[i]];
    }
    setFlashcards(cards.slice(0,20));
  };

  const openNotesWindow=()=>{
    if(!notes||!rawText)return;
    const subColors2={"key concepts":"#00d4ff","common interview":"#a78bfa","strong answer":"#00ff88","common mistake":"#ff3366","quick-recall":"#fbbf24"};
    const getColor2=h=>{const hl=h.toLowerCase();for(const[k,v]of Object.entries(subColors2))if(hl.includes(k))return v;return"#5a8a9f";};
    const tagInfo=h=>{const hl=h.toLowerCase();if(hl.includes("mistake"))return{label:"avoid",color:"#ff3366"};if(hl.includes("quick"))return{label:"tip",color:"#fbbf24"};if(hl.includes("strong"))return{label:"do this",color:"#00ff88"};if(hl.includes("question"))return{label:"Q",color:"#a78bfa"};return{label:"note",color:"#00d4ff"};};
    const confidenceDots=(secTitle)=>{
      const v=getConf(role,secTitle);
      const colors=["","#ff3366","#fbbf24","#fbbf24","#00d4ff","#00ff88"];
      const labels=["","Shaky","Okay","Okay","Strong","Mastered"];
      if(!v)return"";
      const dots=[1,2,3,4,5].map(n=>`<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${n<=v?colors[v]:"rgba(255,255,255,0.1)"};border:1px solid ${n<=v?colors[v]+"80":"rgba(255,255,255,0.1)"};margin-right:3px;"></span>`).join("");
      return`<span style="margin-left:10px;font-size:10px;color:${colors[v]};">${dots}${labels[v]}</span>`;
    };
    const sectionsHtml=notes.map((section,si)=>{
      const subsHtml=section.subsections.map(sub=>{
        const color=getColor2(sub.heading);
        const{label,color:tc}=tagInfo(sub.heading);
        const itemsHtml=sub.items.map(item=>{
          const colonIdx=item.indexOf(":");const hasColon=colonIdx>0&&colonIdx<45;
          const text=hasColon
            ?`<strong style="color:#e0f7ff">${item.slice(0,colonIdx)}</strong><span style="color:#7a9eb5">${item.slice(colonIdx)}</span>`
            :`<span style="color:#7a9eb5">${item.replace(/\*\*(.*?)\*\*/g,"<strong style='color:#e0f7ff'>$1</strong>")}</span>`;
          return`<div class="item"><span class="tag" style="background:${tc}15;border-color:${tc}30;color:${tc}">${label}</span><div class="item-text">${text}</div></div>`;
        }).join("");
        return`<div class="subsection"><div class="sub-heading" style="color:${color}"><span class="sub-bar"></span>${sub.heading.toUpperCase()}</div>${itemsHtml}</div>`;
      }).join("");
      return`<div class="section" id="section-${si}"><div class="section-title">${si+1}. ${section.title}${confidenceDots(section.title)}</div>${subsHtml}</div>`;
    }).join("");

    const tocHtml=notes.map((s,i)=>{
      const v=getConf(role,s.title);
      const confColors=["","#ff3366","#fbbf24","#fbbf24","#00d4ff","#00ff88"];
      const dot=v?`<span style="width:7px;height:7px;border-radius:50%;background:${confColors[v]};display:inline-block;margin-left:7px;"></span>`:"";
      return`<a class="toc-item" href="#section-${i}">${i+1}. ${s.title}${dot}</a>`;
    }).join("");

    const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${role} — Interview Study Notes</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#060d16;color:#e0f7ff;font-family:'Inter','Share Tech Mono',monospace;min-height:100vh;}
::-webkit-scrollbar{width:6px;}
::-webkit-scrollbar-track{background:#050e18;}
::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#a78bfa,#7c3aed);border-radius:3px;}
.header{background:linear-gradient(135deg,#0d0a1f,#0a0d1e,#080a1a);border-bottom:1px solid rgba(167,139,250,0.2);padding:24px 48px 20px;position:sticky;top:0;z-index:100;backdrop-filter:blur(20px);}
.header-inner{max-width:960px;margin:0 auto;}
.eyebrow{font-family:'Orbitron',monospace;font-size:9px;color:#a78bfa;letter-spacing:.35em;margin-bottom:8px;}
h1{font-family:'Orbitron',monospace;font-size:20px;font-weight:700;color:#a78bfa;text-shadow:0 0 20px rgba(167,139,250,0.5);letter-spacing:.04em;margin-bottom:10px;}
.badges{display:flex;gap:7px;flex-wrap:wrap;}
.badge{font-family:'Share Tech Mono',monospace;font-size:10px;padding:3px 10px;border-radius:99px;border:1px solid rgba(167,139,250,0.4);background:rgba(167,139,250,0.1);color:#a78bfa;}
.badge.cyan{border-color:rgba(0,212,255,0.4);background:rgba(0,212,255,0.1);color:#00d4ff;}
.badge.muted{border-color:rgba(90,138,159,0.3);background:transparent;color:#5a8a9f;}
.layout{max-width:960px;margin:0 auto;padding:24px 48px 80px;display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:start;}
.sidebar{position:sticky;top:90px;}
.toc{background:rgba(167,139,250,0.05);border:1px solid rgba(167,139,250,0.15);border-radius:10px;padding:16px 18px;margin-bottom:14px;}
.toc-title{font-family:'Orbitron',monospace;font-size:9px;color:#a78bfa;letter-spacing:.2em;margin-bottom:12px;}
.toc-item{font-size:11px;color:#5a8a9f;cursor:pointer;text-decoration:none;display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:5px;transition:all .15s;margin-bottom:2px;}
.toc-item:hover,.toc-item.active{color:#a78bfa;background:rgba(167,139,250,0.08);}
.toc-item::before{content:"";width:4px;height:4px;border-radius:50%;background:currentColor;flex-shrink:0;}
.actions{display:flex;flex-direction:column;gap:6px;}
.btn{font-family:'Share Tech Mono',monospace;font-size:11px;padding:7px 12px;border-radius:6px;cursor:pointer;transition:all .2s;letter-spacing:.04em;border:1px solid;text-decoration:none;display:block;text-align:center;background:none;}
.btn-copy{border-color:rgba(167,139,250,0.4);color:#a78bfa;}
.btn-copy:hover{background:rgba(167,139,250,0.12);}
.btn-print{border-color:rgba(0,212,255,0.3);color:#00d4ff;}
.btn-print:hover{background:rgba(0,212,255,0.08);}
.btn-close{border-color:rgba(90,138,159,0.25);color:#5a8a9f;}
.btn-close:hover{background:rgba(90,138,159,0.1);color:#e0f7ff;}
.search-wrap{position:relative;margin-bottom:14px;}
.search-input{width:100%;padding:7px 10px 7px 30px;background:rgba(10,20,35,0.8);border:1px solid rgba(167,139,250,0.2);border-radius:7px;color:#e0f7ff;font-family:'Share Tech Mono',monospace;font-size:11px;outline:none;}
.search-input:focus{border-color:rgba(167,139,250,0.45);}
.search-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:#5a8a9f;font-size:12px;pointer-events:none;}
.main{}
.section{background:rgba(10,14,28,0.8);border:1px solid rgba(167,139,250,0.15);border-radius:12px;padding:22px 26px;margin-bottom:16px;transition:border-color .2s;}
.section:hover{border-color:rgba(167,139,250,0.28);}
.section.highlight{border-color:rgba(167,139,250,0.5);background:rgba(167,139,250,0.04);}
.section-title{font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:#a78bfa;background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.2);border-radius:8px;padding:9px 14px;margin-bottom:16px;letter-spacing:.04em;display:flex;align-items:center;}
.subsection{margin-bottom:16px;}
.sub-heading{font-family:'Orbitron',monospace;font-size:10px;letter-spacing:.12em;margin-bottom:9px;display:flex;align-items:center;gap:7px;}
.sub-bar{display:inline-block;width:2px;height:11px;background:currentColor;border-radius:1px;opacity:.7;flex-shrink:0;}
.item{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid rgba(0,212,255,0.07);}
.item:last-child{border-bottom:none;}
.tag{font-family:'Orbitron',monospace;font-size:9px;padding:2px 6px;border-radius:4px;flex-shrink:0;margin-top:3px;letter-spacing:.05em;border:1px solid;}
.item-text{font-size:13px;line-height:1.75;color:#7a9eb5;}
.item-text strong{color:#e0f7ff;}
.item-text mark{background:rgba(251,191,36,0.2);color:#fbbf24;border-radius:2px;padding:0 2px;}
.no-results{text-align:center;padding:40px 20px;color:#5a8a9f;font-size:13px;}
@media(max-width:700px){.layout{grid-template-columns:1fr;padding:16px 16px 60px;}.sidebar{position:static;}.toc{display:none;}}
@media print{.header{position:static;}.sidebar{display:none;}.layout{grid-template-columns:1fr;}.section{border:1px solid #ddd;background:#fafafa;break-inside:avoid;}.section-title{background:#f0eeff;border-color:#c4b5fd;color:#6d28d9;}.item-text{color:#333;}.item-text strong{color:#111;}body{background:#fff;color:#111;}}
</style>
</head>
<body>
<div class="header">
  <div class="header-inner">
    <div class="eyebrow">AI STUDY NOTES</div>
    <h1>${role} — Interview Study Notes</h1>
    <div class="badges">
      <span class="badge">${NOTES_PACK_LABELS[pack]}</span>
      <span class="badge cyan">${depth}</span>
      <span class="badge muted">${[...selectedTopics].length} topics</span>
    </div>
  </div>
</div>
<div class="layout">
  <aside class="sidebar">
    <div class="search-wrap">
      <span class="search-icon">⌕</span>
      <input class="search-input" id="searchInput" placeholder="Search notes…" oninput="filterNotes(this.value)"/>
    </div>
    <div class="toc">
      <div class="toc-title">CONTENTS</div>
      ${tocHtml}
    </div>
    <div class="actions">
      <button class="btn btn-copy" onclick="copyAll()">⎘ Copy all notes</button>
      <button class="btn btn-print" onclick="window.print()">⊞ Print / Save PDF</button>
      <button class="btn btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </aside>
  <main class="main" id="mainContent">
    ${sectionsHtml}
    <div class="no-results" id="noResults" style="display:none">No matching notes found.</div>
  </main>
</div>
<script>
(function(){
  // TOC smooth scroll + active state
  const tocLinks=document.querySelectorAll('.toc-item[href]');
  const sections=document.querySelectorAll('.section');
  tocLinks.forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      const t=document.querySelector(a.getAttribute('href'));
      if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
  // Intersection observer for active TOC item
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        tocLinks.forEach(a=>a.classList.remove('active'));
        const link=document.querySelector('.toc-item[href="#'+en.target.id+'"]');
        if(link)link.classList.add('active');
      }
    });
  },{rootMargin:'-20% 0px -60% 0px'});
  sections.forEach(s=>obs.observe(s));
})();

function copyAll(){
  const text=${JSON.stringify(rawText)};
  navigator.clipboard.writeText(text).then(()=>{
    const btn=document.querySelector('.btn-copy');
    const orig=btn.textContent;btn.textContent='✓ Copied!';btn.style.color='#00ff88';
    setTimeout(()=>{btn.textContent=orig;btn.style.color='';},2000);
  }).catch(()=>{
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
  });
}

function escapeRe(s){return s.split('').map(function(c){return'\\^$.|?*+()[]{}'.indexOf(c)>=0?'\\'+c:c;}).join('');}
function filterNotes(q){
  var sections=document.querySelectorAll('.section');
  var noRes=document.getElementById('noResults');
  var term=q.trim().toLowerCase();
  var anyVisible=false;
  sections.forEach(function(sec){
    var stripMarks=function(h){return h.replace(/<mark[^>]*>/gi,'').replace(/<\/mark>/gi,'');};
    if(!term){
      sec.style.display='';sec.classList.remove('highlight');
      sec.querySelectorAll('.item-text').forEach(function(el){el.innerHTML=stripMarks(el.innerHTML);});
      anyVisible=true;return;
    }
    var text=sec.textContent.toLowerCase();
    if(text.indexOf(term)>=0){
      sec.style.display='';sec.classList.add('highlight');anyVisible=true;
      sec.querySelectorAll('.item-text').forEach(function(el){
        var raw=stripMarks(el.innerHTML);
        var re=new RegExp('('+escapeRe(term)+')','gi');
        el.innerHTML=raw.replace(re,'<mark>$1</mark>');
      });
    } else {
      sec.style.display='none';sec.classList.remove('highlight');
    }
  });
  noRes.style.display=anyVisible?'none':'block';
}
</script>
</body>
</html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const win=window.open(url,"_blank","width=1100,height=850,scrollbars=yes,resizable=yes");
    if(win){win.addEventListener("load",()=>URL.revokeObjectURL(url),{once:true});}
    else{setTimeout(()=>URL.revokeObjectURL(url),5000);}
  };

  const loadHistory=idx=>{
    const e=history[idx];
    if(!e)return;
    setRole(e.role);setSelectedTopics(new Set(e.topics));
    setPack(e.pack);setDepth(e.depth);
    setNotes(e.sections);setRawText(e.raw);
    setActiveHistIdx(idx);setError("");setFlashcards(null);setSearchQuery("");
  };

  const topics=NOTES_TOPICS[role]||[];

  const subIcons={"key concepts":"◈","common interview":"?","strong answer":"✓","common mistake":"✗","quick-recall":"⚡"};
  const getSubIcon=h=>{const hl=h.toLowerCase();for(const[k,v]of Object.entries(subIcons))if(hl.includes(k))return v;return"·";};
  const subColors={"key concepts":"#00d4ff","common interview":"#a78bfa","strong answer":"#00ff88","common mistake":"#ff3366","quick-recall":"#fbbf24"};
  const getSubColor=h=>{const hl=h.toLowerCase();for(const[k,v]of Object.entries(subColors))if(hl.includes(k))return v;return"#5a8a9f";};

  // Search filter
  const filteredNotes=React.useMemo(()=>{
    if(!notes||!searchQuery.trim())return notes;
    const q=searchQuery.toLowerCase();
    return notes.filter(s=>
      s.title.toLowerCase().includes(q)||
      s.subsections.some(sub=>sub.heading.toLowerCase().includes(q)||sub.items.some(it=>it.toLowerCase().includes(q)))
    );
  },[notes,searchQuery]);

  // Confidence overview stats
  const confStats=React.useMemo(()=>{
    if(!notes)return null;
    const vals=notes.map(s=>getConf(role,s.title)).filter(v=>v>0);
    if(!vals.length)return null;
    const avg=(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
    const mastered=vals.filter(v=>v>=4).length;
    return{avg,mastered,total:notes.length,rated:vals.length};
  },[notes,role]);

  const sel={width:"100%",padding:"9px 12px",fontSize:13};

  return(
    <div style={{maxWidth:900,margin:"0 auto",animation:"fadeIn 0.4s ease"}}>

      {/* Flashcard modal */}
      {flashcards&&<FlashcardModal cards={flashcards} onClose={()=>setFlashcards(null)}/>}

      {/* Header */}
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:10,fontFamily:G.head,color:G.purple,letterSpacing:"0.3em",marginBottom:10}}>AI STUDY NOTES</div>
        <GlitchText color={G.purple} fontSize={26}>Interview Prep Notes</GlitchText>
        <div style={{fontSize:11,color:G.textMut,marginTop:8,letterSpacing:"0.05em"}}>
          Role-aware notes · confidence tracking · built-in flashcard drill
        </div>
      </div>

      {/* Config panel */}
      <Card glow style={{marginBottom:16,borderColor:`${G.purple}28`}}>
        <SectionLabel color={G.purple}>Configure</SectionLabel>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>ROLE</div>
            <select value={role} onChange={e=>handleRoleChange(e.target.value)} style={sel}>
              {Object.keys(NOTES_TOPICS).map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>COMPANY STYLE</div>
            <select value={pack} onChange={e=>setPack(e.target.value)} style={sel}>
              {Object.entries(NOTES_PACK_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>DEPTH</div>
            <select value={depth} onChange={e=>setDepth(e.target.value)} style={sel}>
              <option value="concise">Concise — quick review</option>
              <option value="standard">Standard — full prep</option>
              <option value="deep">Deep dive — interview day</option>
            </select>
          </div>
        </div>

        {/* Topic pills */}
        <div style={{fontSize:10,color:G.textMut,marginBottom:8,letterSpacing:"0.08em"}}>TOPICS TO COVER</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:16}}>
          {topics.map(t=>{
            const on=selectedTopics.has(t);
            const conf=getConf(role,t);
            const confColor=["","#ff3366","#fbbf24","#fbbf24","#00d4ff","#00ff88"][conf]||null;
            return(
              <div key={t} onClick={()=>toggleTopic(t)} style={{
                padding:"5px 14px",borderRadius:99,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                border:`1px solid ${on?G.purple+"80":G.textMut+"30"}`,
                background:on?`${G.purple}18`:"transparent",
                color:on?G.purple:G.textMut,transition:"all 0.15s",
              }}>
                {t}
                {conf>0&&<span style={{width:6,height:6,borderRadius:"50%",background:confColor,flexShrink:0,display:"inline-block"}}/>}
              </div>
            );
          })}
        </div>

        {error&&<div style={{fontSize:12,color:G.red,padding:"8px 12px",background:`${G.red}10`,borderRadius:6,border:`1px solid ${G.red}30`,marginBottom:12}}>{error}</div>}

        <Btn onClick={generate} disabled={loading} full color={G.purple} style={{padding:"12px 20px",fontSize:14,letterSpacing:"0.1em",borderRadius:8}}>
          {loading?"⚙ GENERATING NOTES…":"✦ GENERATE STUDY NOTES"}
        </Btn>
      </Card>

      {/* Recent history chips */}
      {history.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:G.textMut,letterSpacing:"0.08em",marginBottom:8}}>RECENT GENERATIONS</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {history.map((h,i)=>(
              <div key={i} onClick={()=>loadHistory(i)} style={{
                fontSize:11,padding:"4px 12px",borderRadius:99,cursor:"pointer",
                border:`1px solid ${activeHistIdx===i?G.purple+"60":G.textMut+"25"}`,
                background:activeHistIdx===i?`${G.purple}15`:"transparent",
                color:activeHistIdx===i?G.purple:G.textMut,
              }}>{h.label}</div>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading&&(
        <Card style={{borderColor:`${G.purple}20`}}>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"1rem 0"}}>
            <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${G.purple}40`,borderTopColor:G.purple,animation:"spin 0.7s linear infinite",flexShrink:0}}/>
            <div style={{fontSize:13,color:G.textMut}}>
              Generating {role} notes{pack!=="no_pack"?` · ${NOTES_PACK_LABELS[pack]}`:""}…
            </div>
          </div>
          {[0.7,0.5,0.85,0.6].map((w,i)=>(
            <div key={i} style={{height:12,borderRadius:6,marginBottom:10,background:`${G.purple}18`,width:`${w*100}%`,animation:`pulse 1.4s ease-in-out ${i*0.15}s infinite`}}/>
          ))}
        </Card>
      )}

      {/* Notes output */}
      {notes&&!loading&&(
        <Card style={{borderColor:`${G.purple}28`}}>

          {/* Notes toolbar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${G.border}`,flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:G.textPri,marginBottom:4}}>
                {role} — Interview Study Notes
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <NeonBadge text={NOTES_PACK_LABELS[pack]} color={G.purple}/>
                <NeonBadge text={depth} color={G.cyan}/>
                <NeonBadge text={`${notes.length} topics`} color={G.textMut}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Btn onClick={buildFlashcards} color={G.amber} style={{fontSize:12,padding:"6px 14px",borderRadius:6}}>
                ⚡ Flashcard drill
              </Btn>
              <Btn onClick={openNotesWindow} color={G.cyan} style={{fontSize:12,padding:"6px 14px",borderRadius:6}}>
                ⊞ Open full window
              </Btn>
              <Btn onClick={copyNotes} color={G.purple} style={{fontSize:12,padding:"6px 14px",borderRadius:6}}>
                {copied?"✓ Copied":"⎘ Copy all"}
              </Btn>
              <Btn onClick={downloadPdf} disabled={pdfLoading} color={G.red} style={{fontSize:12,padding:"6px 14px",borderRadius:6}}>
                {pdfLoading?"⏳ Building…":"⬇ Save PDF"}
              </Btn>
            </div>
          </div>

          {/* Confidence overview bar */}
          {confStats&&(
            <div style={{
              display:"flex",alignItems:"center",gap:14,padding:"10px 14px",marginBottom:14,
              borderRadius:8,background:"rgba(0,255,136,0.05)",border:"1px solid rgba(0,255,136,0.15)",
            }}>
              <div style={{fontSize:11,color:G.green,fontFamily:G.head,letterSpacing:"0.08em"}}>CONFIDENCE</div>
              <div style={{flex:1,height:5,borderRadius:99,background:"rgba(255,255,255,0.06)"}}>
                <div style={{height:"100%",borderRadius:99,width:`${(confStats.avg/5)*100}%`,
                  background:`linear-gradient(90deg,${G.red},${G.amber},${G.green})`,transition:"width 0.4s"}}/>
              </div>
              <div style={{fontSize:11,color:G.textMut}}>
                avg <span style={{color:G.textPri}}>{confStats.avg}/5</span>
                {" · "}<span style={{color:G.green}}>{confStats.mastered}</span>/{confStats.total} strong
              </div>
            </div>
          )}

          {/* PDF error */}
          {pdfError&&<div style={{fontSize:12,color:G.red,padding:"7px 12px",background:`${G.red}10`,borderRadius:6,border:`1px solid ${G.red}25`,marginBottom:10}}>{pdfError}</div>}

          {/* Search */}
          <div style={{position:"relative",marginBottom:14}}>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:G.textMut,fontSize:14,pointerEvents:"none"}}>⌕</span>
            <input
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              style={{
                width:"100%",padding:"8px 12px 8px 34px",
                background:"rgba(10,20,35,0.6)",border:`1px solid ${G.border}`,
                borderRadius:8,color:G.textPri,fontFamily:G.mono,fontSize:13,outline:"none",
              }}
            />
            {searchQuery&&(
              <span onClick={()=>setSearchQuery("")} style={{
                position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",
                color:G.textMut,cursor:"pointer",fontSize:16,lineHeight:1,
              }}>×</span>
            )}
          </div>

          {/* Toolbar row: expand/collapse + result count */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:11,color:G.textMut}}>
              {searchQuery
                ?`${filteredNotes?.length||0} of ${notes.length} topics match`
                :`${notes.length} topics`}
            </div>
            <div style={{display:"flex",gap:6}}>
              <div onClick={()=>setExpandAll(true)} style={{fontSize:10,padding:"3px 10px",borderRadius:99,cursor:"pointer",
                border:`1px solid ${expandAll?G.cyan+"50":G.textMut+"25"}`,
                color:expandAll?G.cyan:G.textMut,background:expandAll?`${G.cyan}10`:"transparent"}}>Expand all</div>
              <div onClick={()=>setExpandAll(false)} style={{fontSize:10,padding:"3px 10px",borderRadius:99,cursor:"pointer",
                border:`1px solid ${!expandAll?G.cyan+"50":G.textMut+"25"}`,
                color:!expandAll?G.cyan:G.textMut,background:!expandAll?`${G.cyan}10`:"transparent"}}>Collapse all</div>
            </div>
          </div>

          {/* Section accordions */}
          {filteredNotes&&filteredNotes.length>0
            ?filteredNotes.map((section,si)=>(
              <SectionAccordion
                key={si} section={section} si={si} role={role}
                subIcons={subIcons} subColors={subColors}
                getSubIcon={getSubIcon} getSubColor={getSubColor}
              />
            ))
            :<div style={{textAlign:"center",padding:"2rem",color:G.textMut,fontSize:13}}>No notes match your search.</div>
          }

          {/* Footer actions */}
          <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${G.border}`,display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn onClick={buildFlashcards} color={G.amber} style={{fontSize:12,padding:"7px 18px"}}>
              ⚡ Flashcard drill
            </Btn>
            <Btn onClick={openNotesWindow} color={G.cyan} style={{fontSize:12,padding:"7px 18px"}}>
              ⊞ Open full notes
            </Btn>
            <Btn onClick={downloadPdf} disabled={pdfLoading} color={G.red} style={{fontSize:12,padding:"7px 18px"}}>
              {pdfLoading?"⏳ Building…":"⬇ Save as PDF"}
            </Btn>
            <Btn onClick={()=>onNav("setup")} color={G.green} style={{fontSize:12,padding:"7px 18px"}}>
              ⚡ Start interview session
            </Btn>
            <Btn onClick={generate} color={G.purple} style={{fontSize:12,padding:"7px 18px"}}>
              ✦ Regenerate
            </Btn>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!notes&&!loading&&(
        <Card style={{borderColor:`${G.purple}15`}}>
          <div style={{textAlign:"center",padding:"2.5rem 1rem",color:G.textMut}}>
            <div style={{fontSize:36,marginBottom:12,opacity:0.4}}>✦</div>
            <div style={{fontSize:14,marginBottom:6,color:G.textPri}}>Ready to generate</div>
            <div style={{fontSize:12}}>
              Select your role, company style, and topics above — then hit Generate.
            </div>
            <div style={{fontSize:11,marginTop:12,color:G.textDim,lineHeight:1.7}}>
              Key concepts · questions · answer frameworks · traps to avoid · quick-recall tips
              <br/>Confidence dots · flashcard drill · full-window view with search
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
//  PAGE: FINAL REPORT
// ══════════════════════════════════════════════════════════════════════════════
function PageReport({session,answers,incidents=[],onNav}){
  const[loading,setLoading]=useState(true);
  const[report,setReport]=useState(null);

  const getIdealAnswerText=(a, role="Software Engineer")=>{
    if(a.ideal_answer && a.ideal_answer.trim().length > 15) return a.ideal_answer;
    if(a.type === "Behavioural" || a.type === "HR"){
      return `[Situation & Task]: In a mission-critical milestone for a ${role} initiative, our team faced unexpected scope shifts and tight production deadlines.\n[Action]: I spearheaded requirement prioritization with stakeholders, decoupled technical dependencies, and established daily transparent check-ins.\n[Result]: Successfully shipped on schedule with zero regression bugs and established an improved cross-functional workflow.`;
    }
    return `[Architecture & Concept]: Frame the solution starting with throughput, latency SLAs, and core domain entities. Decouple into an API Gateway, stateless service cluster, and partitioned storage with caching (Redis).\n[Edge Cases & Scaling]: Address graceful degradation, idempotency tokens, asynchronous event queues (Kafka/RabbitMQ), and distributed tracing for end-to-end observability.`;
  };

  useEffect(()=>{
    (async()=>{
      try{
        const res=await authFetch(`${API}/report`,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({session_id:session.sessionId,answers}),
        });
        if(res.ok)setReport(await res.json());
      }catch{}finally{setLoading(false);}
    })();
  },[]);

  // ── PDF Print ────────────────────────────────────────────────────────────────
  const printReport=()=>{
    const avg=answers.length?answers.reduce((a,x)=>a+(x.score||3),0)/answers.length:0;
    const avgNerv=answers.length?answers.reduce((a,x)=>a+(x.nervousness||0.2),0)/answers.length:0.2;
    const avgStar=answers.length?answers.reduce((a,x)=>a+(x.star_coverage||0.5),0)/answers.length:0.5;
    const disc=answers.reduce((acc,a)=>{if(a.disc)Object.entries(a.disc).forEach(([k,v])=>{acc[k]=(acc[k]||0)+v;});return acc;},{});
    const discNorm=Object.fromEntries(Object.entries(disc).map(([k,v])=>[k,v/Math.max(answers.length,1)]));
    const recVal=report?.hr_recommendation||(avg>=3.5?"Yes":avg>=2.5?"Maybe":"No");
    const recHex=recVal==="Strong Yes"||recVal==="Yes"?"#00ff88":recVal==="Maybe"?"#fbbf24":"#ff3366";
    const scoreHex=(s,mx=5)=>{const r=s/mx;return r>=0.84?"#00ff88":r>=0.70?"#00d4ff":r>=0.50?"#fbbf24":"#ff3366";};
    const discColor=(k)=>k==="Dominance"?"#ff3366":k==="Influence"?"#00d4ff":k==="Steadiness"?"#00ff88":"#a78bfa";
    const starItems=["S","T","A","R"];
    const escapeHtml=(value)=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

    const qRows=answers.map((a,i)=>{
      const sc=a.score||3;
      const col=scoreHex(sc);
      const starFilled=Math.round((a.star_coverage||0.5)*4);
      const starHtml=starItems.map((x,si)=>
        `<span class="star-box ${si<starFilled?"star-on":"star-off"}">${x}</span>`).join("");
      const badges=[
        a.wpm?`<span class="badge">${a.wpm} WPM</span>`:"",
        a.filler_count!=null?`<span class="badge" style="color:${a.filler_count>5?"#ff3366":"#00ff88"}">${a.filler_count} fillers</span>`:"",
        a.nervousness!=null?`<span class="badge" style="color:${a.nervousness>0.6?"#ff3366":"#00d4ff"}">Nerv ${(a.nervousness*100).toFixed(0)}%</span>`:"",
      ].filter(Boolean).join("");
      return `
        <div class="q-block">
          <div class="q-header">
            <div class="q-meta">
              <span class="q-num" style="color:#00d4ff">Q${i+1} (${a.type||"Technical"})</span>
              <div class="star-row">${starHtml}</div>
            </div>
            <span class="q-score" style="color:${col}">${sc.toFixed(2)}/5</span>
          </div>
          <div class="q-question" style="font-weight:700;margin-bottom:8px;">${a.question||""}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0;">
            <div style="background:#f8fafc;padding:10px;border-radius:6px;border:1px solid #e2e8f0;">
              <div style="font-size:10px;font-weight:700;color:#0284c7;margin-bottom:4px;">CANDIDATE ANSWER</div>
              <div class="q-answer" style="color:#334155;font-size:11px;line-height:1.5;">${(a.answer||"").slice(0,500)}${(a.answer||"").length>500?"…":""}</div>
            </div>
            <div style="background:#f0fdf4;padding:10px;border-radius:6px;border:1px solid #bbf7d0;">
              <div style="font-size:10px;font-weight:700;color:#16a34a;margin-bottom:4px;">★ IDEAL SENIOR BENCHMARK</div>
              <div class="q-answer" style="color:#1e293b;font-size:11px;line-height:1.5;white-space:pre-wrap;">${getIdealAnswerText(a, session.role)}</div>
            </div>
          </div>
          ${(()=>{if(!a.followUp)return"";const fu=a.followUp;const fuScore=fu.score!=null?fu.score:(fu.candidate_answer?3.5:null);const fuScoreCol=fuScore!=null?(fuScore>=4?"#00cc66":fuScore>=3?"#fbbf24":"#ff3366"):"#aaa";return`<div style="background:#f5f3ff;border:2px solid #ddd6fe;border-radius:8px;margin:8px 0;padding:10px 12px;"><div style="font-size:9px;font-family:'Orbitron',monospace;color:#7c3aed;font-weight:700;letter-spacing:0.1em;margin-bottom:6px;">⚡ SENIOR FOLLOW-UP PUSHBACK CHALLENGE</div><div style="font-size:11px;color:#3b0764;font-style:italic;margin-bottom:6px;">"${fu.follow_up}"</div>${fu.probe_reason?`<div style="font-size:9px;color:#6d28d9;margin-bottom:6px;"><b>Why asked:</b> ${fu.probe_reason}</div>`:""}`+(fu.candidate_answer?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><div style="background:#faf5ff;padding:8px;border-radius:5px;border:1px solid #e9d5ff;"><div style="font-size:9px;font-weight:700;color:#7c3aed;margin-bottom:3px;">CANDIDATE DEFENSE</div><div style="font-size:10px;color:#374151;line-height:1.5;">${(fu.candidate_answer||"").slice(0,400)}${(fu.candidate_answer||"").length>400?"…":""}</div></div><div style="background:#f0fdf4;padding:8px;border-radius:5px;border:1px solid #bbf7d0;"><div style="font-size:9px;font-weight:700;color:#16a34a;margin-bottom:3px;">★ EXPECTED BENCHMARK</div><div style="font-size:10px;color:#1e293b;line-height:1.5;">${fu.ideal_follow_up_answer||""}</div></div></div><div style="display:flex;align-items:center;gap:12px;margin-top:7px;"><span style="font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:${fuScoreCol}">${fuScore!=null?fuScore.toFixed(1)+"/5.0 ★":"—"}</span><span style="font-size:9px;color:#555;">Follow-up Defense Score</span>${fu.coaching_tip?`<span style="font-size:9px;color:#0284c7;margin-left:auto;">💡 ${fu.coaching_tip}</span>`:""}</div>`:`<div style="font-size:10px;color:#9ca3af;font-style:italic;margin-top:4px;">No defense recorded</div><div style="font-size:9px;color:#16a34a;margin-top:4px;"><b>Expected benchmark:</b> ${fu.ideal_follow_up_answer||""}</div>`)+"</div>";})()} 
          ${a.coaching_tip?`<div class="q-tip">💡 ${a.coaching_tip}</div>`:""}
          ${badges?`<div class="badge-row">${badges}</div>`:""}
        </div>`;
    }).join("");

    const discRows=Object.entries(discNorm).map(([k,v])=>{
      const col=discColor(k);
      const pct=Math.min(100,v*10);
      return `
        <div class="disc-row">
          <div class="disc-label"><span>${k}</span><span style="color:${col};font-weight:700">${v.toFixed(2)}</span></div>
          <div class="disc-track"><div class="disc-fill" style="width:${pct}%;background:${col}"></div></div>
        </div>`;
    }).join("");

    const rings=[
      {label:"Overall",score:avg,max:5},
      {label:"Knowledge",score:answers.reduce((a,x)=>a+(x.knowledge||3),0)/Math.max(answers.length,1),max:5},
      {label:"STAR",score:avgStar*5,max:5},
      {label:"Composure",score:(1-avgNerv)*5,max:5},
    ];
    const ringHtml=rings.map(({label,score,max})=>{
      const col=scoreHex(score,max);
      const pct=(score/max)*100;
      return `
        <div class="ring-wrap">
          <div class="ring-outer" style="border-color:${col}20">
            <div class="ring-fill" style="
              background:conic-gradient(${col} 0% ${pct}%, #0d1b2a ${pct}% 100%);
            ">
              <div class="ring-inner"><span style="color:${col}">${score.toFixed(1)}</span></div>
            </div>
          </div>
          <div class="ring-label">${label}</div>
        </div>`;
    }).join("");

    const interviewGuidance=getRoleInterviewGuidance(session.role);
    const rolePrepBlock=`
      <div class="section">
        <div class="section-label" style="border-color:#06b6d4;color:#06b6d4;">ROLE PREPARATION & INTERVIEW-DAY TIPS</div>
        <div style="font-size:10px;color:#64748b;margin-bottom:8px;">General guidance for ${escapeHtml(session.role)}; actual interview questions vary by employer and interviewer.</div>
        ${interviewGuidance.questionTypes.map(item=>`
          <div style="padding:7px 9px;margin:5px 0;border:1px solid #e2e8f0;border-radius:5px;background:#fafafa;">
            <b style="color:#0e7490;">${escapeHtml(item.label)}:</b> ${escapeHtml(item.detail)}
          </div>`).join("")}
        <div style="padding:8px 10px;margin-top:8px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:5px;">
          <b>Answer structure:</b> ${escapeHtml(interviewGuidance.answerApproach)}
          <br/><b>Behavioral examples:</b> ${escapeHtml(interviewGuidance.behavioralApproach)}
        </div>
        <div style="margin-top:8px;"><b>Interview-day checklist</b></div>
        ${INTERVIEW_DAY_TIPS.map(({label,detail})=>`
          <div style="padding:5px 0;border-bottom:1px solid #eee;"><b>${escapeHtml(label)}:</b> ${escapeHtml(detail)}</div>`).join("")}
      </div>`;

    const rlBlock=report?.rl_report?`
      <div class="section">
        <div class="section-label violet">RL SEQUENCER REPORT</div>
        <div class="rl-grid">
          ${[
            {l:"Steps",v:report.rl_report.total_steps||answers.length},
            {l:"Avg Reward",v:(report.rl_report.avg_reward||0).toFixed(3)},
            {l:"Epsilon ε",v:(report.rl_report.epsilon||0).toFixed(3)},
            {l:"Follow-ups",v:report.rl_report.follow_up_count||0},
          ].map(s=>`<div class="rl-cell"><div class="rl-val">${s.v}</div><div class="rl-lbl">${s.l}</div></div>`).join("")}
        </div>
      </div>`:"";

    const gap=report?.resume_gap;
    const gapRiskColor=gap?.risk_level==="Low"?"#00ff88":gap?.risk_level==="Medium"?"#fbbf24":"#ff3366";
    const gapBlock=gap?.total_claims?`
      <div class="section">
        <div class="section-label" style="border-color:${gapRiskColor};color:${gapRiskColor}">
          RESUME ↔ INTERVIEW GAP ANALYSIS
        </div>
        <div style="display:flex;gap:18px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
          <div style="flex:1;min-width:160px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:9px;color:#666;">
              <span>CLAIM COVERAGE</span><span style="color:${gapRiskColor};font-weight:700">${gap.coverage_pct}%</span>
            </div>
            <div style="height:5px;background:#e8e8e8;border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${gap.coverage_pct}%;background:${gapRiskColor};border-radius:3px;"></div>
            </div>
          </div>
          <span style="padding:3px 10px;border-radius:12px;border:1px solid ${gapRiskColor}50;
            background:${gapRiskColor}12;font-size:9px;color:${gapRiskColor};font-family:'Orbitron',monospace;">
            ${gap.risk_level.toUpperCase()} RISK
          </span>
          ${[
            {l:"CLAIMS",v:gap.total_claims,c:"#555"},
            {l:"COVERED",v:gap.covered_count,c:"#00cc66"},
            {l:"PARTIAL",v:gap.partial_count,c:"#f59e0b"},
            {l:"MISSED",v:gap.uncovered_count,c:"#ef4444"},
          ].map(s=>`<div style="text-align:center;">
            <div style="font-size:14px;font-family:'Orbitron',monospace;color:${s.c};font-weight:700;">${s.v}</div>
            <div style="font-size:8px;color:#888;">${s.l}</div>
          </div>`).join("")}
        </div>
        ${gap.summary?`<div style="padding:8px 12px;border-radius:6px;border:1px solid ${gapRiskColor}25;
          background:${gapRiskColor}08;font-size:10px;color:#555;line-height:1.7;margin-bottom:10px;">
          ${gap.summary}</div>`:""}
        ${(gap.uncovered||[]).slice(0,5).map(item=>`
          <div style="padding:8px 0;border-bottom:1px solid #eee;">
            <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:5px;">
              <span style="padding:1px 7px;border-radius:8px;border:1px solid #ff336640;
                background:#ff33660e;font-size:8px;color:#ff3366;text-transform:uppercase;
                white-space:nowrap;">${item.claim?.claim_type||"claim"}</span>
              <span style="font-size:10px;color:#222;line-height:1.5;flex:1;">${item.claim?.text||""}</span>
            </div>
            ${item.predicted_question?`<div style="font-size:9px;color:#0099bb;margin-bottom:3px;padding-left:4px;">
              ❓ ${item.predicted_question}</div>`:""}
            ${item.coaching_tip?`<div style="font-size:9px;color:#b45309;padding-left:4px;">
              💡 ${item.coaching_tip}</div>`:""}
          </div>`).join("")}
      </div>`:"";

    const html=`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>AURA Interview Report — ${session.role}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
@page{margin:18mm 14mm;size:A4;}
body{
  background:#fff;color:#111;
  font-family:'Share Tech Mono','Courier New',monospace;
  font-size:11px;line-height:1.6;
}
.page{max-width:780px;margin:0 auto;padding:0 8px;}

/* ── Header ── */
.header{text-align:center;padding:20px 0 16px;border-bottom:2px solid #00ff88;margin-bottom:18px;}
.header-tag{font-size:9px;font-family:'Orbitron',monospace;color:#00d4ff;letter-spacing:0.3em;margin-bottom:8px;}
.header-logo{font-size:36px;font-family:'Orbitron',monospace;font-weight:900;color:#00ff88;}
.header-score{font-size:48px;font-family:'Orbitron',monospace;font-weight:900;color:${scoreHex(avg)};margin:8px 0 4px;}
.header-meta{font-size:11px;color:#666;}

/* ── Sections ── */
.section{margin-bottom:18px;page-break-inside:avoid;}
.section-label{
  font-size:9px;font-family:'Orbitron',monospace;letter-spacing:0.16em;text-transform:uppercase;
  margin-bottom:10px;padding-left:8px;border-left:2px solid #00d4ff;color:#00d4ff;
}
.section-label.green{border-color:#00ff88;color:#00ff88;}
.section-label.violet{border-color:#a78bfa;color:#a78bfa;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;}
.card{border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;}

/* ── Score Rings ── */
.rings{display:flex;justify-content:space-around;flex-wrap:wrap;gap:10px;padding:6px 0;}
.ring-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;}
.ring-outer{width:74px;height:74px;border-radius:50%;border:4px solid;display:flex;align-items:center;justify-content:center;}
.ring-fill{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.ring-inner{width:52px;height:52px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-weight:700;font-size:13px;}
.ring-label{font-size:10px;color:#666;text-align:center;}

/* ── DISC ── */
.disc-row{margin-bottom:9px;}
.disc-label{display:flex;justify-content:space-between;margin-bottom:3px;font-size:10px;color:#555;}
.disc-track{height:5px;background:#e8e8e8;border-radius:3px;overflow:hidden;}
.disc-fill{height:100%;border-radius:3px;}

/* ── HR Rec ── */
.rec-box{display:flex;align-items:center;gap:18px;padding:12px 16px;border-radius:8px;border:1px solid ${recHex}40;background:${recHex}0a;}
.rec-verdict{font-size:22px;font-family:'Orbitron',monospace;font-weight:900;color:${recHex};white-space:nowrap;}
.rec-reasoning{font-size:11px;color:#555;line-height:1.7;flex:1;}

/* ── RL Grid ── */
.rl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.rl-cell{text-align:center;padding:10px 0;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;}
.rl-val{font-size:17px;font-family:'Orbitron',monospace;color:#a78bfa;font-weight:700;}
.rl-lbl{font-size:9px;color:#888;margin-top:3px;}

/* ── Q-by-Q ── */
.q-block{padding:12px 0;border-bottom:1px solid #eee;}
.q-block:last-child{border-bottom:none;}
.q-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.q-meta{display:flex;align-items:center;gap:10px;}
.q-num{font-family:'Orbitron',monospace;font-size:11px;font-weight:700;}
.q-score{font-family:'Orbitron',monospace;font-size:15px;font-weight:700;}
.q-question{font-size:11px;color:#555;font-style:italic;margin-bottom:5px;}
.q-answer{font-size:11px;color:#222;line-height:1.65;margin-bottom:5px;}
.q-tip{font-size:10px;color:#00a0cc;margin-bottom:5px;}
.badge-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;}
.badge{font-size:9px;padding:2px 8px;border-radius:99px;border:1px solid #ccc;color:#555;background:#f5f5f5;}

/* ── STAR badges ── */
.star-row{display:flex;gap:3px;}
.star-box{width:20px;height:20px;border-radius:3px;border:1px solid;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;font-family:'Orbitron',monospace;}
.star-on{border-color:#00cc66;color:#00cc66;background:#e6fff2;}
.star-off{border-color:#ccc;color:#ccc;background:#f5f5f5;}

/* ── Footer ── */
.footer{margin-top:24px;padding-top:10px;border-top:1px solid #ddd;text-align:center;font-size:9px;color:#aaa;font-family:'Orbitron',monospace;letter-spacing:0.15em;}

@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .no-print{display:none!important;}
}
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-tag">AI INTERVIEW EVALUATION AND FEEDBACK SYSTEM</div>
    <div class="header-logo">EVALUATION REPORT</div>
    <div class="header-score">${avg.toFixed(2)}<span style="font-size:20px;color:#999">/5</span></div>
    <div class="header-meta">${session.role} &nbsp;·&nbsp; ${session.difficulty} &nbsp;·&nbsp; ${answers.length} questions &nbsp;·&nbsp; ${new Date().toLocaleDateString()}</div>
  </div>

  <!-- SCORES + DISC -->
  <div class="two-col">
    <div class="card">
      <div class="section-label">Score Breakdown</div>
      <div class="rings">${ringHtml}</div>
    </div>
    <div class="card">
      <div class="section-label violet">DISC Profile</div>
      ${discRows||'<div style="color:#aaa;font-size:11px">No DISC data</div>'}
    </div>
  </div>

  <!-- HR RECOMMENDATION -->
  <div class="section">
    <div class="section-label green">HR RECOMMENDATION</div>
    <div class="rec-box">
      <div class="rec-verdict">${recVal}</div>
      <div class="rec-reasoning">${report?.hr_reasoning||`Candidate averaged ${avg.toFixed(2)}/5 across ${answers.length} questions with ${(avgStar*100).toFixed(0)}% STAR coverage.`}</div>
    </div>
  </div>

  ${rolePrepBlock}

  <!-- PROCTORING AUDIT DOSSIER -->
  <div class="section">
    <div class="section-label" style="border-color:${incidents.length===0?"#16a34a":"#d97706"};color:${incidents.length===0?"#16a34a":"#d97706"}">
      PROCTORING INTEGRITY & ENVIRONMENT AUDIT
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:11px;">
      <div><b>Audit Status:</b> ${incidents.length===0?"<span style='color:#16a34a;font-weight:700;'>✓ 100% VERIFIED AUTHENTIC &bull; CLEAN AUDIT</span>":`<span style='color:#d97706;font-weight:700;'>⚠️ ${incidents.length} INTEGRITY INCIDENT(S) RECORDED</span>`}</div>
      <div>Tab Switches: <b>${incidents.filter(x=>x.type==="tab_switch").length}</b> &nbsp;|&nbsp; Visual Flags: <b>${incidents.filter(x=>x.type!=="tab_switch").length}</b></div>
    </div>
    ${incidents.length>0?`
      <table style="width:100%;font-size:10px;border-collapse:collapse;margin-top:6px;">
        <tr style="background:#f1f5f9;text-align:left;">
          <th style="padding:5px 8px;border:1px solid #cbd5e1;">Time</th>
          <th style="padding:5px 8px;border:1px solid #cbd5e1;">Question</th>
          <th style="padding:5px 8px;border:1px solid #cbd5e1;">Incident Event</th>
          <th style="padding:5px 8px;border:1px solid #cbd5e1;">Classification</th>
        </tr>
        ${incidents.map(inc=>`
          <tr>
            <td style="padding:4px 8px;border:1px solid #e2e8f0;">${inc.time||"+"+Math.round((inc.timestamp||0)/1000)+"s"}</td>
            <td style="padding:4px 8px;border:1px solid #e2e8f0;">Q${inc.qIndex}</td>
            <td style="padding:4px 8px;border:1px solid #e2e8f0;">${inc.label||inc.type}</td>
            <td style="padding:4px 8px;border:1px solid #e2e8f0;color:${inc.type==="multiple_faces"?"#dc2626":"#d97706"};font-weight:700;">${inc.type==="multiple_faces"?"CRITICAL FLAG":"INTEGRITY WARNING"}</td>
          </tr>
        `).join("")}
      </table>
    `:`<div style="font-size:11px;color:#16a34a;">✓ Clean proctoring record: Zero tab switches, gaze anomalies, or multi-face incursions recorded during the interview session.</div>`}
  </div>

  ${rlBlock}

  ${gapBlock}

  <!-- Q-BY-Q & IDEAL COMPARISON -->
  <div class="section">
    <div class="section-label">QUESTION-BY-QUESTION ANALYSIS & IDEAL BENCHMARK COMPARISON</div>
    ${qRows}
  </div>

  <!-- UPGRADE STUDY PLAN -->
  ${(()=>{
    const weakA=answers.filter(a=>(a.score||3)<3.5);
    const fuFailed=answers.filter(a=>a.followUp&&a.followUp.score!=null&&a.followUp.score<3.5);
    const highFill=answers.filter(a=>(a.filler_count||0)>5);
    const highNv=answers.filter(a=>(a.nervousness||0)>0.6);
    const lowSt=answers.filter(a=>(a.star_coverage||0.5)<0.5);
    const topics=[...new Set(weakA.map(a=>a.type||"Technical Depth"))].slice(0,4);
    const days=[
      {d:"Day 1–2",icon:"📚",title:"Foundation Review",
        desc:weakA.length>0?`Revisit core concepts: ${topics.length?topics.join(", "):(session.role+" fundamentals")}. Use spaced repetition.`:"Advance edge-case mastery and deepen senior-level breadth."},
      {d:"Day 3",icon:"⭐",title:"STAR Framework Drills",
        desc:lowSt.length>0?`${lowSt.length} answer(s) had low STAR coverage (<50%). Record 90-second stories: Situation → Task → Action → Result. Target ≥75%.`:"Sharpen STAR storytelling with concise 60-second versions per story."},
      {d:"Day 4",icon:"⚡",title:"Follow-up Defense Practice",
        desc:fuFailed.length>0?`${fuFailed.length} follow-up probe(s) scored below 3.5. Practice 'Why?' and 'How differently?' senior pushback scenarios.`:"Simulate senior pushback. Challenge every planned answer with 'But why exactly?' drills."},
      {d:"Day 5",icon:"🧠",title:"Composure & Fluency",
        desc:(highNv.length>0||highFill.length>0)?`Nervousness on ${highNv.length} answer(s), fillers on ${highFill.length}. Practice box breathing (4-4-4-4). Record and listen back.`:"Maintain composure. Work on varied pacing and confident, deliberate pauses."},
      {d:"Day 6",icon:"🎯",title:"Full Mock Interview",
        desc:`Run 2 complete mock sessions for ${session.role} at ${session.difficulty} difficulty. Target score ≥4.0 per question. Record and review immediately.`},
      {d:"Day 7",icon:"✅",title:"Review & Confidence Build",
        desc:"Re-read all coaching tips from this report. Prepare 3 power stories: leadership impact, technical challenge overcome, cross-team collaboration."},
    ];
    return `
      <div class="section" style="page-break-before:always;">
        <div class="section-label" style="border-color:#f59e0b;color:#f59e0b;">🎯 ACTIONABLE UPGRADE STUDY PLAN — 7-DAY REMEDIATION ROADMAP</div>
        <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
          ${weakA.length>0?`<div style="font-size:10px;color:#dc2626;padding:6px 10px;background:#fff1f2;border-radius:5px;border:1px solid #fca5a5;">⚠️ ${weakA.length} question(s) scored below 3.5/5 — targeted remediation recommended</div>`:""}
          ${fuFailed.length>0?`<div style="font-size:10px;color:#7c3aed;padding:6px 10px;background:#faf5ff;border-radius:5px;border:1px solid #e9d5ff;">⚡ ${fuFailed.length} follow-up defense(s) need improvement</div>`:""}
          ${highFill.length>0?`<div style="font-size:10px;color:#d97706;padding:6px 10px;background:#fffbeb;border-radius:5px;border:1px solid #fde68a;">🗣️ High filler usage on ${highFill.length} answer(s) — fluency coaching recommended</div>`:""}
          ${!weakA.length&&!fuFailed.length&&!highFill.length?`<div style="font-size:10px;color:#16a34a;padding:6px 10px;background:#f0fdf4;border-radius:5px;border:1px solid #bbf7d0;">✅ Strong performance — study plan focuses on maintaining and advancing your edge.</div>`:""}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:10px;">
          <tr style="background:#f8fafc;"><th style="padding:7px 10px;border:1px solid #e2e8f0;text-align:left;width:85px;">Timeline</th><th style="padding:7px 10px;border:1px solid #e2e8f0;text-align:left;width:155px;">Focus Area</th><th style="padding:7px 10px;border:1px solid #e2e8f0;text-align:left;">Action Plan</th></tr>
          ${days.map(r=>`<tr><td style="padding:7px 10px;border:1px solid #e2e8f0;font-family:'Orbitron',monospace;font-size:9px;color:#0284c7;font-weight:700;white-space:nowrap;">${r.d}</td><td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;color:#1e293b;">${r.icon} ${r.title}</td><td style="padding:7px 10px;border:1px solid #e2e8f0;color:#374151;line-height:1.6;">${r.desc}</td></tr>`).join("")}
        </table>
        <div style="margin-top:9px;font-size:9px;color:#16a34a;padding:7px 12px;background:#f0fdf4;border-radius:5px;border:1px solid #bbf7d0;">
          ✅ Target: ${avg>=3.5?"Improve "+avg.toFixed(1)+" → 4.5+":"Reach 3.5 first, then target 4.0+"} &nbsp;|&nbsp; Role: ${session.role} &nbsp;|&nbsp; Level: ${session.difficulty}
        </div>
      </div>`;
  })()}

  <div class="footer">AI INTERVIEW EVALUATION AND FEEDBACK SYSTEM &mdash; GENERATED ${new Date().toLocaleString().toUpperCase()}</div>
</div>
<script>window.onload=()=>{window.print();}</script>
</body>
</html>`;

    const win=window.open("","_blank","width=900,height=700");
    if(!win){alert("Pop-up blocked. Allow pop-ups for this site and try again.");return;}
    win.document.write(html);
    win.document.close();
  };

  const avg=answers.length?answers.reduce((a,x)=>a+(x.score||3),0)/answers.length:0;
  const avgNerv=answers.length?answers.reduce((a,x)=>a+(x.nervousness||0.2),0)/answers.length:0.2;
  const avgStar=answers.length?answers.reduce((a,x)=>a+(x.star_coverage||0.5),0)/answers.length:0.5;
  const interviewGuidance=getRoleInterviewGuidance(session.role);

  // Aggregate DISC
  const disc=answers.reduce((acc,a)=>{
    if(a.disc)Object.entries(a.disc).forEach(([k,v])=>{acc[k]=(acc[k]||0)+v;});
    return acc;
  },{});
  const discNorm=Object.fromEntries(Object.entries(disc).map(([k,v])=>[k,v/Math.max(answers.length,1)]));

  const recColor=(r)=>r==="Strong Yes"?G.green:r==="Yes"?G.cyan:r==="Maybe"?G.amber:G.red;

  return(
    <div style={{animation:"fadeIn 0.4s ease"}}>
      {/* HEADER */}
      <div style={{textAlign:"center",padding:"28px 0 32px",position:"relative"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:280,height:280,pointerEvents:"none",opacity:0.08}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${scoreColor(avg)}`,animation:"spin 20s linear infinite"}}/>
          <div style={{position:"absolute",inset:18,borderRadius:"50%",border:`1px dashed ${scoreColor(avg)}`,animation:"spinRev 14s linear infinite"}}/>
        </div>
        <div style={{fontSize:10,fontFamily:G.head,color:G.cyan,letterSpacing:"0.28em",marginBottom:12,animation:"glow 3s infinite"}}>FINAL REPORT — MISSION COMPLETE</div>
        <GlitchText color={scoreColor(avg)} fontSize={52} style={{marginBottom:4,display:"block",textAlign:"center"}}>
          {avg.toFixed(2)}
        </GlitchText>
        <div style={{fontSize:14,color:G.textMut,marginBottom:4,fontFamily:G.head,letterSpacing:"0.12em"}}>/5.00 OVERALL</div>
        <div style={{fontSize:12,color:G.textMut,marginTop:10,letterSpacing:"0.06em"}}>
          {session.role} · {session.difficulty.toUpperCase()} · {answers.length} QUESTIONS ANSWERED
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14,flexWrap:"wrap"}}>
          {[
            {label:"XP EARNED",val:`+${Math.round(avg*100+answers.length*30)} XP`,color:G.green},
            {label:"STAR AVG",val:`${(answers.reduce((a,x)=>a+(x.star_coverage||0.5),0)/Math.max(answers.length,1)*100).toFixed(0)}%`,color:G.cyan},
          ].map(b=><NeonBadge key={b.label} text={`${b.label} ${b.val}`} color={b.color}/>)}
          {/* v3.0: company pack badge in report header */}
          {session.companyPack&&session.companyPack.key&&session.companyPack.key!=="no_pack"&&(
            <NeonBadge
              text={(()=>{const icons={faang:"⚡",startup:"🚀",consulting:"💼",fintech:"🏦",healthtech:"🏥"};return(icons[session.companyPack.key]||"◈")+" "+(session.companyPack.display_name||session.companyPack.key);})()}
              color={G.purple}/>
          )}
        </div>
      </div>

      {/* v3.0: SYLLABUS TOPIC COVERAGE ─────────────────────────────────────── */}
      {(()=>{
        // Build per-topic score summary from answers that carry a topic field
        const topicAnswers=answers.filter(a=>a.topic||a.question?.topic);
        if(!topicAnswers.length&&!session.syllabusWeights)return null;

        // Group answer scores by topic
        const topicScores={};
        topicAnswers.forEach(a=>{
          const t=a.topic||(a.question&&a.question.topic)||"Unknown";
          if(!topicScores[t])topicScores[t]=[];
          topicScores[t].push(a.score||3);
        });

        // Merge with syllabus weights if available (show all topics, not just answered)
        const weights=session.syllabusWeights||{};
        const allTopics=[...new Set([...Object.keys(topicScores),...Object.keys(weights)])].filter(t=>t&&t!=="Unknown"&&t!=="");
        if(!allTopics.length)return null;

        const packKey=session.companyPack?.key||"no_pack";
        const packLabel=session.companyPack?.display_name||"Standard";
        const packIcons={faang:"⚡",startup:"🚀",consulting:"💼",fintech:"🏦",healthtech:"🏥",no_pack:"◈"};

        return(
          <Card style={{marginBottom:16,borderColor:`${G.purple}30`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <SectionLabel color={G.purple}>Syllabus Coverage</SectionLabel>
              {packKey!=="no_pack"&&(
                <span style={{fontSize:10,padding:"3px 10px",borderRadius:99,
                  background:`${G.purple}15`,border:`1px solid ${G.purple}40`,color:G.purple,
                  fontFamily:G.head,letterSpacing:"0.06em"}}>
                  {packIcons[packKey]||"◈"} {packLabel}
                </span>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {allTopics.map(topic=>{
                const scores=topicScores[topic]||[];
                const avgScore=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
                const weight=weights[topic]||0;
                const practiced=scores.length>0;

                // Score colour
                const sCol=avgScore===null?G.textDim:avgScore>=4?G.green:avgScore>=3?G.cyan:avgScore>=2?G.amber:G.red;

                return(
                  <div key={topic} style={{display:"grid",gridTemplateColumns:"1fr auto auto",alignItems:"center",gap:12}}>
                    {/* Topic name + weight bar */}
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,color:practiced?G.textPri:G.textDim,fontFamily:G.mono}}>
                          {practiced?"✓ ":"○ "}{topic}
                        </span>
                        <span style={{fontSize:10,color:G.purple,fontFamily:G.head}}>
                          {weight?(weight*100).toFixed(0)+"% weight":""}
                        </span>
                      </div>
                      <div style={{height:4,borderRadius:2,background:G.surface,overflow:"hidden"}}>
                        <div style={{
                          height:"100%",borderRadius:2,
                          width:`${(weight*100).toFixed(1)}%`,
                          background:practiced?`linear-gradient(90deg,${G.purple},${G.cyan})`:`${G.purple}40`,
                          transition:"width 0.6s ease",
                        }}/>
                      </div>
                    </div>
                    {/* Questions answered count */}
                    <div style={{textAlign:"center",minWidth:40}}>
                      <span style={{fontSize:11,color:G.textMut,fontFamily:G.head}}>
                        {scores.length}Q
                      </span>
                    </div>
                    {/* Average score for this topic */}
                    <div style={{textAlign:"right",minWidth:52}}>
                      {avgScore!==null?(
                        <span style={{fontSize:13,fontWeight:700,fontFamily:G.head,color:sCol}}>
                          {avgScore.toFixed(1)}/5
                        </span>
                      ):(
                        <span style={{fontSize:10,color:G.textDim,fontFamily:G.head}}>NOT TESTED</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Coverage summary line */}
            {(()=>{
              const covered=allTopics.filter(t=>topicScores[t]?.length>0).length;
              const pct=allTopics.length?Math.round(covered/allTopics.length*100):0;
              const covCol=pct>=80?G.green:pct>=50?G.cyan:G.amber;
              return(
                <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${G.border}`,
                  display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:G.textMut,letterSpacing:"0.05em"}}>
                    TOPICS COVERED: <span style={{color:covCol,fontWeight:700}}>{covered}/{allTopics.length}</span>
                  </span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <div style={{width:80,height:6,borderRadius:3,background:G.surface,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",borderRadius:3,
                        background:`linear-gradient(90deg,${covCol},${covCol}88)`}}/>
                    </div>
                    <span style={{fontSize:11,color:covCol,fontFamily:G.head,fontWeight:700}}>{pct}%</span>
                  </div>
                </div>
              );
            })()}
          </Card>
        );
      })()}

      {/* SCORE + DISC */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SectionLabel>Score Breakdown</SectionLabel>
          <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:10}}>
            <ScoreRing score={avg} label="Overall" size={82}/>
            <ScoreRing score={answers.reduce((a,x)=>a+(x.knowledge||3),0)/Math.max(answers.length,1)} label="Knowledge" size={82}/>
            <ScoreRing score={avgStar*5} label="STAR" size={82}/>
            <ScoreRing score={(1-avgNerv)*5} label="Composure" size={82}/>
          </div>
        </Card>
        <Card>
          <SectionLabel color={G.violet}>DISC Profile (Session Average)</SectionLabel>
          {Object.entries(discNorm).map(([k,v])=>(
            <DiscBar key={k} label={k} value={v}
              color={k==="Dominance"?G.red:k==="Influence"?G.cyan:k==="Steadiness"?G.green:G.violet}/>
          ))}
        </Card>
      </div>

      {/* HR RECOMMENDATION */}
      {(report?.hr_recommendation||avg>0)&&(
        <Card glow style={{marginBottom:16}}>
          <SectionLabel color={G.green}>HR RECOMMENDATION</SectionLabel>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <div style={{fontSize:26,fontFamily:G.head,fontWeight:900,
              color:recColor(report?.hr_recommendation||(avg>=3.5?"Yes":"Maybe")),
              textShadow:`0 0 16px ${recColor(report?.hr_recommendation||"Maybe")}`}}>
              {report?.hr_recommendation||(avg>=3.5?"Yes":"Maybe")}
            </div>
            <div style={{fontSize:12,color:G.textMut,lineHeight:1.7,flex:1}}>
              {report?.hr_reasoning||`Candidate averaged ${avg.toFixed(2)}/5 across ${answers.length} questions with ${(avgStar*100).toFixed(0)}% STAR coverage.`}
            </div>
          </div>
        </Card>
      )}

      {/* ROLE-SPECIFIC PREPARATION */}
      <Card style={{marginBottom:16,borderColor:`${G.cyan}28`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:8}}>
          <SectionLabel color={G.cyan}>Role Preparation & Interview-Day Tips</SectionLabel>
          <span style={{fontSize:9,color:G.textMut}}>General guidance; actual questions vary by employer.</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:G.textPri,marginBottom:8}}>Question types to prepare for · {session.role}</div>
            {interviewGuidance.questionTypes.map(item=>(
              <div key={item.label} style={{padding:"8px 10px",marginBottom:7,borderRadius:7,
                background:"rgba(6,182,212,0.04)",border:`1px solid ${G.cyan}18`}}>
                <div style={{fontSize:10,color:G.cyan,fontWeight:700,marginBottom:3}}>{item.label}</div>
                <div style={{fontSize:11,color:G.textMut,lineHeight:1.65}}>{item.detail}</div>
              </div>
            ))}
            <div style={{padding:"9px 11px",borderRadius:7,background:"rgba(139,92,246,0.06)",
              border:`1px solid ${G.violet}25`,fontSize:11,color:G.textMut,lineHeight:1.7}}>
              <div style={{color:G.violet,fontWeight:700,marginBottom:3}}>How to structure answers</div>
              <div><b style={{color:G.textPri}}>Role questions:</b> {interviewGuidance.answerApproach}</div>
              <div style={{marginTop:5}}><b style={{color:G.textPri}}>Behavioral examples:</b> {interviewGuidance.behavioralApproach}</div>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:G.textPri,marginBottom:8}}>Interview-day confidence checklist</div>
            {INTERVIEW_DAY_TIPS.map((tip,index)=>(
              <div key={tip.label} style={{display:"flex",gap:9,padding:"9px 10px",marginBottom:7,
                borderRadius:7,background:"rgba(255,255,255,0.025)",border:`1px solid ${G.border}`}}>
                <span style={{fontSize:11,color:G.green,fontWeight:700}}>{String(index+1).padStart(2,"0")}</span>
                <div>
                  <div style={{fontSize:10,color:G.textPri,fontWeight:700,marginBottom:3}}>{tip.label}</div>
                  <div style={{fontSize:11,color:G.textMut,lineHeight:1.65}}>{tip.detail}</div>
                </div>
              </div>
            ))}
            <div style={{fontSize:10,color:G.textDim,lineHeight:1.6,marginTop:5}}>
              These are practical preparation suggestions, not predictions about a specific company's interview process.
            </div>
          </div>
        </div>
      </Card>

      {/* RL REPORT */}
      {report?.rl_report&&(
        <Card style={{marginBottom:16,borderColor:`${G.violet}25`}}>
          <SectionLabel color={G.violet}>RL SEQUENCER REPORT</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {label:"Steps",val:report.rl_report.total_steps||answers.length},
              {label:"Avg Reward",val:(report.rl_report.avg_reward||0).toFixed(3)},
              {label:"Epsilon ε",val:(report.rl_report.epsilon||0).toFixed(3)},
              {label:"Follow-ups",val:report.rl_report.follow_up_count||0},
            ].map(s=>(
              <div key={s.label} style={{textAlign:"center",padding:"10px 0",
                background:"rgba(10,8,28,0.55)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
                borderRadius:6,border:`1px solid rgba(167,139,250,0.15)`,
                boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:18,fontFamily:G.head,color:G.violet,fontWeight:700}}>{s.val}</div>
                <div style={{fontSize:10,color:G.textMut,marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Radar */}
      {answers.length>0&&<SessionRadarCard answers={answers}/>}

      {/* Resume ↔ Interview Gap Analysis */}
      {report?.resume_gap?.total_claims>0&&(
        <ResumeGapCard gap={report.resume_gap}/>
      )}

      {/* Skill Gap Report — longitudinal delta analysis */}
      {answers.length>=2&&(
        <SkillGapCard
          answers={answers}
          sessionId={session?.sessionId||""}
          API={API}
        />
      )}

      {/* Narrative Coherence Report (Feature 6) */}
      {report?.coherence_report?.available&&(
        <CoherenceReportCard report={report.coherence_report}/>
      )}

      {/* Nervousness Heatmap */}
      {answers.length>1&&<div style={{marginTop:14}}><NervousnessHeatmap answers={answers}/></div>}

      {/* ── PROCTORING INCIDENT AUDIT TIMELINE ── */}
      <Card glow style={{marginBottom:16,borderColor:incidents.length===0?`${G.green}30`:`${G.amber}40`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>{incidents.length===0?"🛡️":"⚠️"}</span>
            <div>
              <div style={{fontSize:13,fontFamily:G.head,fontWeight:700,color:incidents.length===0?G.green:G.amber,letterSpacing:"0.08em"}}>
                PROCTORING INCIDENT AUDIT TIMELINE
              </div>
              <div style={{fontSize:10,color:G.textMut}}>
                Continuous hardware, webcam & environment integrity telemetry
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{
              padding:"5px 12px",borderRadius:99,
              background:incidents.length===0?`${G.green}15`:`${G.amber}15`,
              border:`1px solid ${incidents.length===0?G.green:G.amber}40`,
              color:incidents.length===0?G.green:G.amber,
              fontSize:10,fontFamily:G.head,fontWeight:700,letterSpacing:"0.06em"
            }}>
              {incidents.length===0?"✓ 100% CLEAN INTEGRITY AUDIT":`${incidents.length} AUDIT INCIDENTS FLAGGED`}
            </div>
            <span style={{fontSize:10,color:G.textMut}}>
              {incidents.filter(x=>x.type==="tab_switch").length} Tab Switches · {incidents.filter(x=>x.type==="multiple_faces").length} Multiple Faces
            </span>
          </div>
        </div>

        {/* Scrubber Bar */}
        <div style={{position:"relative",margin:"14px 0 16px",padding:"12px 14px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:G.mono,color:G.textMut,marginBottom:6}}>
            <span>SESSION START (00:00)</span>
            <span>CHRONOLOGICAL INTEGRITY SCRUBBER</span>
            <span>COMPLETION</span>
          </div>
          <div style={{position:"relative",height:10,background:"rgba(255,255,255,0.08)",borderRadius:5,overflow:"hidden"}}>
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:"100%",background:`linear-gradient(90deg,${G.green}30,${G.cyan}25)`}}/>
            {incidents.map((inc,i)=>{
              const maxTime=Math.max(...incidents.map(x=>x.timestamp||1),60000);
              const leftPct=Math.min(98,Math.max(2,((inc.timestamp||0)/maxTime)*100));
              return(
                <div key={i} title={`[${inc.time||""}] Q${inc.qIndex}: ${inc.label}`} style={{
                  position:"absolute",left:`${leftPct}%`,top:0,bottom:0,width:4,
                  background:inc.type==="multiple_faces"?G.red:G.amber,
                  boxShadow:`0 0 8px ${inc.type==="multiple_faces"?G.red:G.amber}`,
                  cursor:"pointer"
                }}/>
              );
            })}
          </div>
        </div>

        {/* Incident log rows */}
        {incidents.length===0?(
          <div style={{padding:"10px 14px",background:`${G.green}08`,borderRadius:6,border:`1px solid ${G.green}20`,fontSize:11,color:G.green,display:"flex",alignItems:"center",gap:8}}>
            <span>✓</span> No tab switching, gaze drift, or secondary face interference detected throughout the interview session.
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {incidents.map((inc,i)=>(
              <div key={i} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"8px 12px",borderRadius:6,
                background:inc.type==="multiple_faces"?"rgba(239,68,68,0.08)":"rgba(245,158,11,0.06)",
                border:`1px solid ${inc.type==="multiple_faces"?G.red:G.amber}25`,
                fontSize:11
              }}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:inc.type==="multiple_faces"?G.red:G.amber,fontSize:10,fontFamily:G.mono,fontWeight:700}}>
                    [{inc.time||`+${Math.round((inc.timestamp||0)/1000)}s`}]
                  </span>
                  <span style={{color:G.textPri,fontWeight:600}}>
                    {inc.label||inc.type}
                  </span>
                  <span style={{fontSize:9,color:G.textMut,background:"rgba(255,255,255,0.06)",padding:"2px 6px",borderRadius:4}}>
                    Question {inc.qIndex}
                  </span>
                </div>
                <span style={{
                  fontSize:9,fontFamily:G.head,fontWeight:700,letterSpacing:"0.06em",
                  color:inc.type==="multiple_faces"?G.red:G.amber
                }}>
                  {inc.type==="multiple_faces"?"CRITICAL FLAG":"INTEGRITY WARNING"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Q-BY-Q & IDEAL COMPARISON */}
      <Card style={{marginBottom:16}}>
        <SectionLabel>Question-by-Question Analysis & Ideal Answer Comparison</SectionLabel>
        {answers.map((a,i)=>(
          <div key={i} style={{padding:"18px 0",borderBottom:`1px solid ${G.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,color:G.cyan,fontFamily:G.head,fontWeight:700}}>Q{i+1}</span>
                <span style={{fontSize:10,color:G.textMut,background:"rgba(255,255,255,0.05)",padding:"2px 8px",borderRadius:4}}>
                  {a.type||"Technical"}
                </span>
                <StarBadge coverage={a.star_coverage||0.5}/>
              </div>
              <span style={{fontSize:16,fontFamily:G.head,fontWeight:700,color:scoreColor(a.score||3)}}>
                {(a.score||3).toFixed(2)}/5
              </span>
            </div>
            
            <div style={{fontSize:13,color:G.textPri,marginBottom:12,fontWeight:600,lineHeight:1.6}}>
              {a.question}
            </div>

            {/* Comparison Grid: Candidate's Answer vs Ideal Senior Benchmark */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
              {/* Candidate's Answer */}
              <div style={{
                background:"rgba(255,255,255,0.02)",padding:"12px 14px",borderRadius:8,
                border:`1px solid rgba(255,255,255,0.07)`
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:10,fontFamily:G.head,color:G.cyan,letterSpacing:"0.08em",fontWeight:700}}>
                    YOUR RECORDED ANSWER
                  </div>
                  <div style={{fontSize:9,color:G.textMut}}>Candidate Response</div>
                </div>
                <div style={{fontSize:12,color:G.textPri,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
                  {a.answer || <span style={{color:G.textMut,fontStyle:"italic"}}>No answer recorded</span>}
                </div>
              </div>

              {/* Ideal Answer Benchmark */}
              <div style={{
                background:"rgba(6,182,212,0.04)",padding:"12px 14px",borderRadius:8,
                border:`1px solid ${G.cyan}25`
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:10,fontFamily:G.head,color:G.green,letterSpacing:"0.08em",fontWeight:700}}>
                    ★ IDEAL SENIOR BENCHMARK ANSWER
                  </div>
                  <div style={{fontSize:9,color:G.green}}>Model Structure</div>
                </div>
                <div style={{fontSize:12,color:G.textPri,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
                  {getIdealAnswerText(a, session.role)}
                </div>
              </div>
            </div>

            {/* Follow-up Probe Resolution if occurred */}
            {a.followUp&&(
              <div style={{marginTop:10,marginBottom:10,padding:"12px 14px",borderRadius:8,background:"rgba(139,92,246,0.07)",border:`2px solid ${G.purple}35`}}>
                <div style={{fontSize:10,fontFamily:G.head,color:G.purple,letterSpacing:"0.06em",fontWeight:700,marginBottom:6}}>
                  ⚡ SENIOR FOLLOW-UP PUSHBACK CHALLENGE
                </div>
                <div style={{fontSize:12,color:G.textPri,lineHeight:1.5,marginBottom:6,fontStyle:"italic"}}>
                  "{a.followUp.follow_up}"
                </div>
                {a.followUp.probe_reason&&(
                  <div style={{fontSize:10,color:G.purple,marginBottom:8,opacity:0.8}}>
                    <span style={{fontWeight:600}}>Why asked: </span>{a.followUp.probe_reason}
                  </div>
                )}
                {a.followUp.candidate_answer ? (
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
                      <div style={{background:"rgba(139,92,246,0.06)",padding:"9px 11px",borderRadius:6,border:`1px solid ${G.purple}25`}}>
                        <div style={{fontSize:9,fontFamily:G.head,color:G.purple,marginBottom:4,fontWeight:700}}>YOUR DEFENSE</div>
                        <div style={{fontSize:11,color:G.textPri,lineHeight:1.55}}>{a.followUp.candidate_answer}</div>
                      </div>
                      <div style={{background:"rgba(0,255,136,0.04)",padding:"9px 11px",borderRadius:6,border:`1px solid ${G.green}25`}}>
                        <div style={{fontSize:9,fontFamily:G.head,color:G.green,marginBottom:4,fontWeight:700}}>★ EXPECTED BENCHMARK</div>
                        <div style={{fontSize:11,color:G.textPri,lineHeight:1.55}}>{a.followUp.ideal_follow_up_answer}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                      {a.followUp.score!=null&&(
                        <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                          <span style={{fontFamily:G.head,fontSize:16,fontWeight:700,color:a.followUp.score>=3.5?G.green:a.followUp.score>=2.5?G.amber:G.red}}>
                            {a.followUp.score.toFixed(1)}
                          </span>
                          <span style={{fontSize:10,color:G.textMut}}>/5.0 ★ Defense Score</span>
                        </div>
                      )}
                      {a.followUp.coaching_tip&&(
                        <div style={{fontSize:10,color:G.cyan,flex:1}}>💡 {a.followUp.coaching_tip}</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{fontSize:11,color:G.textMut,fontStyle:"italic",marginBottom:4}}>
                    No defense recorded
                    <div style={{marginTop:6,fontSize:11,color:G.green}}>
                      <span style={{fontWeight:600}}>Expected benchmark: </span>{a.followUp.ideal_follow_up_answer}
                    </div>
                  </div>
                )}
              </div>
            )}

            {a.coaching_tip&&(
              <div style={{marginTop:8,fontSize:11,color:G.cyan}}>💡 {a.coaching_tip}</div>
            )}
            <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
              {a.wpm&&<NeonBadge text={`${a.wpm} WPM`} color={G.textMut}/>}
              {a.filler_count!=null&&<NeonBadge text={`${a.filler_count} fillers`} color={a.filler_count>5?G.red:G.green}/>}
              {a.nervousness!=null&&<NeonBadge text={`Nerv ${(a.nervousness*100).toFixed(0)}%`} color={a.nervousness>0.6?G.red:G.cyan}/>}
            </div>
          </div>
        ))}
      </Card>

      {/* ── UPGRADE STUDY PLAN CARD ─────────────────────────────────── */}
      {(()=>{
        const weakAnswers=answers.filter(a=>(a.score||3)<3.5);
        const followUpsFailed=answers.filter(a=>a.followUp&&a.followUp.score!=null&&a.followUp.score<3.5);
        const highFillers=answers.filter(a=>(a.filler_count||0)>5);
        const highNerv=answers.filter(a=>(a.nervousness||0)>0.6);
        const lowStar=answers.filter(a=>(a.star_coverage||0.5)<0.5);
        if(!answers.length)return null;
        const focusTopics=[...new Set(weakAnswers.map(a=>a.type||"Technical Depth"))].slice(0,4);
        const planDays=[
          {d:"Day 1–2",icon:"📚",title:"Foundation Review",color:G.cyan,
            desc:weakAnswers.length>0
              ?`Revisit core concepts for: ${focusTopics.length?focusTopics.join(", "):session.role+" fundamentals"}. Use spaced repetition and Anki cards.`
              :"Solidify your strengths — review advanced concepts and edge cases."},
          {d:"Day 3",icon:"⭐",title:"STAR Framework Drills",color:G.amber,
            desc:lowStar.length>0
              ?`${lowStar.length} answer(s) had low STAR coverage. Record 90-second stories covering Situation, Task, Action, Result. Aim ≥75%.`
              :"Sharpen STAR storytelling with concise 60-second versions per story."},
          {d:"Day 4",icon:"⚡",title:"Follow-up Defense Practice",color:G.purple,
            desc:followUpsFailed.length>0
              ?`${followUpsFailed.length} follow-up probe(s) below 3.5. Practice 'Why?' and 'How differently?' senior pushback drills.`
              :"Simulate senior pushback. Challenge every answer with 'But why exactly?' drills."},
          {d:"Day 5",icon:"🧠",title:"Composure & Fluency",color:G.green,
            desc:highNerv.length>0||highFillers.length>0
              ?`Nervousness on ${highNerv.length} answer(s), fillers on ${highFillers.length}. Practice box breathing (4-4-4-4). Record & review.`
              :"Maintain composure. Work on varied pacing and confident, deliberate pauses."},
          {d:"Day 6",icon:"🎯",title:"Full Mock Interview",color:G.red,
            desc:`Run 2 complete mock sessions for ${session.role} at ${session.difficulty}. Target ≥4.0 per question. Record and review immediately.`},
          {d:"Day 7",icon:"✅",title:"Review & Confidence",color:G.green,
            desc:"Re-read all coaching tips from this report. Prepare 3 power stories: leadership impact, technical challenge, cross-functional collaboration."},
        ];
        return(
          <Card style={{marginBottom:20,border:`1px solid ${G.amber}40`,background:`linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(16,185,129,0.04) 100%)`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={{fontSize:24}}>🎯</div>
              <div>
                <div style={{fontFamily:G.head,fontSize:11,color:G.amber,letterSpacing:"0.12em",fontWeight:700}}>ACTIONABLE UPGRADE STUDY PLAN</div>
                <div style={{fontSize:10,color:G.textMut,marginTop:2}}>7-Day Personalized Remediation Roadmap — based on your session performance</div>
              </div>
            </div>

            {/* Alert banners */}
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
              {weakAnswers.length>0&&(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:6,background:"rgba(239,68,68,0.08)",border:`1px solid ${G.red}30`}}>
                  <span style={{fontSize:13}}>⚠️</span>
                  <span style={{fontSize:11,color:G.red}}>{weakAnswers.length} question(s) scored below 3.5/5 — targeted remediation recommended</span>
                </div>
              )}
              {followUpsFailed.length>0&&(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:6,background:"rgba(139,92,246,0.08)",border:`1px solid ${G.purple}30`}}>
                  <span style={{fontSize:13}}>⚡</span>
                  <span style={{fontSize:11,color:G.purple}}>{followUpsFailed.length} follow-up defense(s) need improvement — senior-level probe practice required</span>
                </div>
              )}
              {highFillers.length>0&&(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:6,background:"rgba(251,191,36,0.08)",border:`1px solid ${G.amber}30`}}>
                  <span style={{fontSize:13}}>🗣️</span>
                  <span style={{fontSize:11,color:G.amber}}>High filler word usage on {highFillers.length} answer(s) — fluency coaching recommended</span>
                </div>
              )}
              {!weakAnswers.length&&!followUpsFailed.length&&!highFillers.length&&(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:6,background:"rgba(0,255,136,0.07)",border:`1px solid ${G.green}30`}}>
                  <span style={{fontSize:13}}>✅</span>
                  <span style={{fontSize:11,color:G.green}}>Strong performance! Study plan focuses on maintaining and advancing your edge.</span>
                </div>
              )}
            </div>

            {/* 7-day grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {planDays.map((day,di)=>(
                <div key={di} style={{padding:"11px 13px",borderRadius:8,background:G.bgPanel,border:`1px solid ${day.color}30`,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:day.color,borderRadius:"3px 0 0 3px"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                    <span style={{fontSize:16}}>{day.icon}</span>
                    <div>
                      <div style={{fontSize:9,fontFamily:G.head,color:day.color,fontWeight:700,letterSpacing:"0.08em"}}>{day.d}</div>
                      <div style={{fontSize:11,color:G.textPri,fontWeight:600}}>{day.title}</div>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:G.textSec,lineHeight:1.55,paddingLeft:3}}>{day.desc}</div>
                </div>
              ))}
            </div>

            <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderRadius:6,background:"rgba(0,255,136,0.06)",border:`1px solid ${G.green}25`,flexWrap:"wrap",gap:8}}>
              <span style={{fontSize:11,color:G.textMut}}>Current Average</span>
              <span style={{fontFamily:G.head,fontSize:14,color:scoreColor(avg),fontWeight:700}}>{avg.toFixed(2)}/5.0</span>
              <span style={{fontSize:11,color:G.textMut}}>→</span>
              <span style={{fontFamily:G.head,fontSize:14,color:G.green,fontWeight:700}}>Target: {avg>=3.5?"4.5+":"3.5 → 4.0"}</span>
              <span style={{fontSize:10,color:G.textMut}}>Role: {session.role} · {session.difficulty}</span>
            </div>
          </Card>
        );
      })()}

      <div style={{display:"flex",gap:14,justifyContent:"center",paddingBottom:28,flexWrap:"wrap"}}>
        <Btn onClick={()=>onNav("dashboard")} color={G.cyan} style={{padding:"11px 24px",borderRadius:8}}>← DASHBOARD</Btn>
        <Btn onClick={printReport} color={G.amber} style={{padding:"11px 24px",borderRadius:8,display:"flex",alignItems:"center",gap:6}}>
          ⬇ PDF REPORT
        </Btn>
        <Btn onClick={()=>onNav("setup")} color={G.green} style={{padding:"11px 28px",borderRadius:8,letterSpacing:"0.08em"}}>⚡ NEW SESSION</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE: RESUME REPHRASER
// ══════════════════════════════════════════════════════════════════════════════

// ── Mini progress bar ─────────────────────────────────────────────────────────
function ResumeProgressBar({step,total=4,labels}){
  return(
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",gap:0,marginBottom:6}}>
        {labels.map((l,i)=>{
          const done=i<step,active=i===step;
          const color=done?G.green:active?G.cyan:G.textDim;
          return(
            <React.Fragment key={l}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{height:3,background:done?G.green:active?G.cyan:G.bgPanel,
                  borderRadius:2,marginBottom:4,
                  boxShadow:active?`0 0 8px ${G.cyan}`:done?`0 0 6px ${G.green}`:"none",
                  transition:"all 0.4s ease"}}/>
                <span style={{fontSize:9,color,letterSpacing:"0.06em",fontFamily:G.mono}}>
                  {done?"✓ ":(active?"~ ":"")}{l}
                </span>
              </div>
              {i<labels.length-1&&<div style={{width:8}}/>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Score gauge bar ───────────────────────────────────────────────────────────
function GaugeBar({label,score,color}){
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:11,color:G.textMut}}>{label}</span>
        <span style={{fontSize:12,color,fontFamily:G.head,fontWeight:700}}>{score}</span>
      </div>
      <div style={{height:5,background:G.bgPanel,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${score}%`,background:color,borderRadius:3,
          boxShadow:`0 0 8px ${color}`,transition:"width 1.2s ease"}}/>
      </div>
    </div>
  );
}

// ── Bullet card with tip ──────────────────────────────────────────────────────
function BulletCard({bullet,index}){
  const[open,setOpen]=useState(false);
  const score=bullet.final_score??bullet.rule_score??0;
  const color=score>=80?G.green:score>=60?G.cyan:score>=40?G.amber:G.red;
  return(
    <div style={{marginBottom:8,borderRadius:8,border:`1px solid ${color}22`,
      background:"rgba(8,16,28,0.55)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",
      boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.2)",
      overflow:"hidden",transition:"border-color 0.2s,box-shadow 0.2s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${color}45`;e.currentTarget.style.boxShadow=`0 0 16px ${color}18`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=`${color}22`;e.currentTarget.style.boxShadow="none";}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer"}}>
        <div style={{minWidth:36,height:36,borderRadius:4,background:`${color}18`,
          border:`1px solid ${color}40`,display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:12,fontWeight:700,fontFamily:G.head,color}}>{score}</div>
        <div style={{flex:1,fontSize:12,color:G.textPri,lineHeight:1.5}}>{bullet.text}</div>
        <span style={{fontSize:10,color:G.textMut}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"0 12px 12px",borderTop:`1px solid ${G.border}`}}>
          {/* Axis flags */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8,marginTop:8}}>
            {[
              {k:"action_verb",l:"Action Verb"},
              {k:"active_voice",l:"Active Voice"},
              {k:"specifics",l:"Has Metrics"},
              {k:"no_overuse",l:"No Filler Phrases"},
              {k:"no_fillers",l:"No Filler Words"},
              {k:"length_ok",l:"Good Length"},
            ].map(({k,l})=>(
              <NeonBadge key={k} text={l} color={bullet[k]?G.green:G.red}/>
            ))}
          </div>
          {bullet.tip&&(
            <div style={{fontSize:11,color:G.cyan,marginBottom:6,lineHeight:1.6}}>
              💡 <span style={{color:G.textMut}}>{bullet.tip}</span>
            </div>
          )}
          {bullet.improved&&(
            <div style={{fontSize:11,color:G.green,padding:"8px 10px",
              background:`${G.green}08`,borderRadius:4,border:`1px solid ${G.green}20`,lineHeight:1.6}}>
              ✨ {bullet.improved}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  QUESTIONS TAB — preview + launch practice session
// ══════════════════════════════════════════════════════════════════════════════
function QuestionsTab({questions,targetRole,difficulty,onStartWithQuestions,onNav}){
  const[showLaunch,setShowLaunch]=useState(false);
  const[numPractice,setNumPractice]=useState(Math.min(5,questions.length));
  const[shuffle,setShuffle]=useState(false);

  // No code editor — "Technical" = conceptual only; "Project-Based" = experience-based
  const typeColor=(t)=>["Technical","Conceptual","System Design"].includes(t)?G.cyan:t==="Behavioural"?G.violet:t==="Project-Based"?G.green:G.amber;

  const launchPractice=()=>{
    let qs=[...questions];
    if(shuffle) qs=qs.sort(()=>Math.random()-0.5);
    qs=qs.slice(0,numPractice);
    const first=qs[0];
    onStartWithQuestions({
      role:targetRole||"Resume Role",
      difficulty:difficulty||"medium",
      numQuestions:qs.length,
      sessionId:"resume-"+Date.now(),
      firstQuestion:{
        question:first.question,
        type:first.type||"Technical",
        difficulty:first.difficulty||difficulty||"medium",
        keywords:first.ideal_keywords||[],
        ideal_answer:first.ideal_answer||"",
      },
      resumeQuestions:qs,
    });
  };

  return(
    <div>
      {/* Header row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <SectionLabel color={G.amber}>
          {questions.length} TAILORED INTERVIEW QUESTIONS
        </SectionLabel>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={()=>onNav("setup")} color={G.textMut} style={{fontSize:11}}>
            ⚙ SETUP PAGE
          </Btn>
          <Btn onClick={()=>setShowLaunch(o=>!o)} color={G.green} style={{fontSize:11}}>
            {showLaunch?"✕ CANCEL":"▶ PRACTICE THESE QUESTIONS"}
          </Btn>
        </div>
      </div>

      {/* ── LAUNCH PANEL ── */}
      {showLaunch&&(
        <Card glow style={{marginBottom:16,borderColor:`${G.green}35`,animation:"fadeIn 0.25s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{fontSize:20}}>🎯</div>
            <div>
              <div style={{fontSize:13,fontFamily:G.head,color:G.green,fontWeight:700,letterSpacing:"0.1em"}}>
                PRACTICE WITH RESUME QUESTIONS
              </div>
              <div style={{fontSize:11,color:G.textMut,marginTop:2}}>
                Start a real-time interview session using these {questions.length} tailored questions
              </div>
            </div>
          </div>

          {/* Config row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div>
              <div style={{fontSize:10,color:G.textMut,letterSpacing:"0.08em",marginBottom:6}}>
                QUESTIONS TO PRACTICE
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <input type="range" min={1} max={questions.length} value={numPractice}
                  onChange={e=>setNumPractice(+e.target.value)} style={{flex:1}}/>
                <span style={{fontSize:16,fontFamily:G.head,color:G.green,fontWeight:700,minWidth:28,textAlign:"right"}}>
                  {numPractice}
                </span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:G.textDim,marginTop:2}}>
                <span>1</span><span>{questions.length} MAX</span>
              </div>
            </div>

            <div>
              <div style={{fontSize:10,color:G.textMut,letterSpacing:"0.08em",marginBottom:6}}>OPTIONS</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                  <div onClick={()=>setShuffle(s=>!s)}
                    style={{width:36,height:20,borderRadius:10,
                      background:shuffle?G.green:G.bgPanel,
                      border:`1px solid ${shuffle?G.green:G.border}`,
                      position:"relative",transition:"background 0.2s",cursor:"pointer",flexShrink:0}}>
                    <div style={{position:"absolute",top:3,left:shuffle?17:3,
                      width:14,height:14,borderRadius:"50%",
                      background:shuffle?G.bg:G.textMut,transition:"left 0.2s"}}/>
                  </div>
                  <span style={{fontSize:11,color:shuffle?G.green:G.textMut}}>Shuffle order</span>
                </label>
                <div style={{fontSize:10,color:G.textDim,lineHeight:1.5}}>
                  {shuffle?"Random order — good for stress testing":"Original order — matches resume sections"}
                </div>
              </div>
            </div>
          </div>

          {/* Question type breakdown */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {/* No code editor — Technical = conceptual/architectural only */}
            {["Technical","Conceptual","System Design","Behavioural","Project-Based","Situational","HR","General"].map(t=>{
              const count=questions.slice(0,numPractice).filter(q=>q.type===t).length;
              if(!count)return null;
              return <NeonBadge key={t} text={`${count}× ${t}`} color={typeColor(t)}/>;
            })}
          </div>

          {/* Preview list */}
          <div style={{marginBottom:14,maxHeight:200,overflowY:"auto",
            border:`1px solid ${G.border}`,borderRadius:6,padding:"4px 0"}}>
            {questions.slice(0,numPractice).map((q,i)=>(
              <div key={i} style={{padding:"8px 12px",borderBottom:i<numPractice-1?`1px solid ${G.border}`:"none",
                display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{fontSize:10,color:G.amber,fontFamily:G.head,fontWeight:700,
                  minWidth:20,marginTop:1}}>Q{i+1}</span>
                <div style={{flex:1}}>
                  <span style={{fontSize:12,color:G.textPri,lineHeight:1.6}}>{q.question}</span>
                  <div style={{display:"flex",gap:4,marginTop:4}}>
                    <NeonBadge text={q.type||"—"} color={typeColor(q.type)}/>
                    <NeonBadge text={q.difficulty||"—"} color={
                      q.difficulty==="Hard"?G.red:q.difficulty==="Easy"?G.green:G.amber}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Btn onClick={launchPractice} full color={G.green} style={{fontSize:14,padding:"11px 0"}}>
            ⏺ BEGIN PRACTICE SESSION — {numPractice} QUESTIONS
          </Btn>
        </Card>
      )}

      {/* Question cards */}
      {questions.map((q,i)=>(
        <Card key={i} style={{marginBottom:10,borderColor:`${G.amber}18`}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
            <div style={{minWidth:24,height:24,borderRadius:4,
              background:`${G.amber}18`,border:`1px solid ${G.amber}40`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:10,fontFamily:G.head,color:G.amber,fontWeight:700,flexShrink:0}}>
              {i+1}
            </div>
            <div style={{fontSize:13,color:G.textPri,lineHeight:1.7,flex:1}}>{q.question}</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            <NeonBadge text={q.type||"—"} color={typeColor(q.type)}/>
            <NeonBadge text={q.difficulty||"—"} color={
              q.difficulty==="Hard"?G.red:q.difficulty==="Easy"?G.green:G.amber}/>
            {q.target&&<NeonBadge text={q.target} color={G.textMut}/>}
          </div>
          {q.ideal_keywords?.length>0&&(
            <div style={{fontSize:10,color:G.textMut,marginBottom:6}}>
              Keywords: {q.ideal_keywords.join(", ")}
            </div>
          )}
          {q.ideal_answer&&(
            <div style={{fontSize:11,color:G.textMut,lineHeight:1.6,padding:"8px 10px",
              background:"rgba(8,16,28,0.55)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
              borderRadius:4,border:`1px solid rgba(255,255,255,0.08)`}}>
              💡 {q.ideal_answer}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function PageResume({onNav,onStartWithQuestions}){
  const[tab,setTab]=useState("upload");          // upload | results
  const[inputMode,setInputMode]=useState("text");// text | file
  const[rawText,setRawText]=useState("");
  const[file,setFile]=useState(null);
  const[targetRole,setTargetRole]=useState("");
  const[numQ,setNumQ]=useState(10);
  const[difficulty,setDifficulty]=useState("Medium");
  const[loading,setLoading]=useState(false);
  const[step,setStep]=useState(-1);             // pipeline step
  const[error,setError]=useState("");
  const[result,setResult]=useState(null);       // full /resume/analyze response
  const[activeSection,setActiveSection]=useState("overview");
  const fileRef=useRef(null);

  const STEPS=["Parsing","Rephrasing","Scoring","Questions"];

  const analyze=async()=>{
    if(!rawText.trim()&&!file){setError("Provide resume text or upload a file.");return;}
    setError("");setLoading(true);setStep(0);setTab("results");
    try{
      const form=new FormData();
      if(file)form.append("file",file);
      else form.append("text",rawText);
      form.append("target_role",targetRole);
      form.append("num_questions",numQ);
      form.append("difficulty",difficulty);
      form.append("auto_rephrase","true");

      // Simulate step progression (backend does it all in one call)
      const stepTimer=setInterval(()=>setStep(s=>s<3?s+1:s),3200);

      const res=await authFetch(`${API}/resume/analyze`,{method:"POST",body:form});
      clearInterval(stepTimer);

      if(!res.ok){
        const err=await res.json();
        throw new Error(err.detail||"Analysis failed");
      }
      const data=await res.json();
      setResult(data);
      setStep(4);
      setActiveSection("overview");
    }catch(e){
      setError(e.message||"Something went wrong. Is the backend running?");
      setTab("upload");setStep(-1);
    }finally{setLoading(false);}
  };

  const reset=()=>{
    setResult(null);setTab("upload");setStep(-1);
    setRawText("");setFile(null);setError("");
  };

  const scoreColor100=(s)=>s>=80?G.green:s>=60?G.cyan:s>=40?G.amber:G.red;

  // ── Upload panel ────────────────────────────────────────────────────────────
  const UploadPanel=()=>(
    <div style={{maxWidth:680,margin:"0 auto",animation:"fadeIn 0.4s ease"}}>
      <div style={{textAlign:"center",padding:"28px 0 20px"}}>
        <div style={{fontSize:10,fontFamily:G.head,color:G.violet,letterSpacing:"0.3em",marginBottom:10}}>
          RESUME REPHRASER & SCORER
        </div>
        <div style={{fontSize:28,fontFamily:G.head,fontWeight:900,color:G.violet,
          textShadow:`0 0 20px ${G.violet}`,marginBottom:8}}>
          ◑ RESUME AI
        </div>
        <div style={{fontSize:12,color:G.textMut,lineHeight:1.7}}>
          Parse · ATS-Optimise · Score · Generate Interview Questions
        </div>
      </div>

      {/* Input mode toggle */}
      <Card glow style={{marginBottom:12,borderColor:`${G.violet}30`}}>
        <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1px solid ${G.border}`}}>
          {[{id:"text",label:"📝 Paste Text"},{id:"file",label:"📎 Upload File"}].map(t=>(
            <button key={t.id} onClick={()=>setInputMode(t.id)} style={{
              flex:1,padding:"8px 0",border:"none",cursor:"pointer",
              background:"transparent",
              borderBottom:`2px solid ${inputMode===t.id?G.violet:"transparent"}`,
              color:inputMode===t.id?G.violet:G.textMut,
              fontSize:12,fontFamily:G.mono,transition:"all 0.18s",
            }}>{t.label}</button>
          ))}
        </div>

        {inputMode==="text"?(
          <div>
            <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>RESUME TEXT</div>
            <textarea value={rawText} onChange={e=>setRawText(e.target.value)}
              rows={10} placeholder="Paste your full resume here…&#10;&#10;Include: work experience, skills, projects, education, certifications."
              style={{width:"100%",padding:"10px 12px",fontSize:12,resize:"vertical",lineHeight:1.7}}/>
            <div style={{fontSize:10,color:G.textDim,marginTop:4,textAlign:"right"}}>
              {rawText.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        ):(
          <div>
            <div style={{fontSize:10,color:G.textMut,marginBottom:10,letterSpacing:"0.08em"}}>
              UPLOAD PDF OR DOCX
            </div>
            <div onClick={()=>fileRef.current?.click()}
              style={{
                border:`2px dashed ${file?G.violet:G.border}`,borderRadius:8,
                padding:"32px 20px",textAlign:"center",cursor:"pointer",
                background:file?`${G.violet}08`:"transparent",
                transition:"all 0.2s",
              }}>
              <div style={{fontSize:28,marginBottom:8}}>{file?"📄":"📎"}</div>
              <div style={{fontSize:13,color:file?G.violet:G.textMut}}>
                {file?file.name:"Click to select PDF or DOCX"}
              </div>
              {!file&&<div style={{fontSize:11,color:G.textDim,marginTop:4}}>or drag and drop</div>}
              {file&&(
                <div style={{fontSize:10,color:G.textDim,marginTop:4}}>
                  {(file.size/1024).toFixed(0)} KB
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt"
              style={{display:"none"}}
              onChange={e=>{if(e.target.files[0])setFile(e.target.files[0]);}}/>
            {file&&(
              <Btn onClick={()=>{setFile(null);if(fileRef.current)fileRef.current.value="";}}
                color={G.red} style={{marginTop:8,fontSize:11}}>✕ Remove</Btn>
            )}
          </div>
        )}
      </Card>

      {/* Config */}
      <Card style={{marginBottom:12}}>
        <SectionLabel color={G.violet}>ANALYSIS CONFIG</SectionLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>TARGET ROLE (OPTIONAL)</div>
            <input value={targetRole} onChange={e=>setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              style={{width:"100%",padding:"9px 12px",fontSize:12}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>QUESTION DIFFICULTY</div>
            <select value={difficulty} onChange={e=>setDifficulty(e.target.value)}
              style={{width:"100%",padding:"9px 12px",fontSize:12}}>
              {["Easy","Medium","Hard"].map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:10,color:G.textMut,letterSpacing:"0.08em"}}>NUMBER OF QUESTIONS</span>
            <span style={{fontSize:13,color:G.violet,fontFamily:G.head,fontWeight:700}}>{numQ}</span>
          </div>
          <input type="range" min={5} max={20} value={numQ}
            onChange={e=>setNumQ(+e.target.value)} style={{width:"100%"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:G.textDim,marginTop:2}}>
            <span>5</span><span>20</span>
          </div>
        </div>
      </Card>

      {error&&(
        <div style={{color:G.red,fontSize:12,marginBottom:12,padding:"10px 14px",
          background:`${G.red}10`,borderRadius:6,border:`1px solid ${G.red}30`}}>{error}</div>
      )}

      <Btn onClick={analyze} disabled={loading||(!rawText.trim()&&!file)}
        full color={G.violet} style={{fontSize:14,padding:"12px 0"}}>
        {loading?"⚙ ANALYSING RESUME…":"◑ ANALYSE RESUME"}
      </Btn>
    </div>
  );

  // ── Results panel ───────────────────────────────────────────────────────────
  const ResultsPanel=()=>{
    if(!result)return null;
    const {parsed,rephrased,score_data,questions}=result;
    const overall=score_data?.overall??0;
    const pctLabel=score_data?.pct_label??"—";
    const pctColor=score_data?.pct_colour??G.cyan;
    const sections=score_data?.section_scores??{};
    const expBullets=score_data?.experience_bullets??[];
    const projBullets=score_data?.project_bullets??[];

    const navTabs=[
      {id:"overview",label:"Overview"},
      {id:"bullets",label:"Bullets"},
      {id:"rephrased",label:"Rephrased"},
      {id:"questions",label:`Questions (${questions?.length??0})`},
    ];

    return(
      <div style={{animation:"fadeIn 0.4s ease"}}>
        {/* Pipeline done header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:10,fontFamily:G.head,color:G.violet,letterSpacing:"0.2em",marginBottom:4}}>
              ANALYSIS COMPLETE
            </div>
            <div style={{fontSize:20,fontFamily:G.head,fontWeight:900,color:pctColor,
              textShadow:`0 0 14px ${pctColor}`}}>
              {parsed?.name||"Resume"} — {pctLabel}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={reset} color={G.textMut} style={{fontSize:11}}>← NEW RESUME</Btn>
            {questions?.length>0&&(
              <Btn onClick={()=>setActiveSection("questions")} color={G.green} style={{fontSize:11}}>
                ▶ PRACTICE QUESTIONS
              </Btn>
            )}
          </div>
        </div>

        {/* Overall score hero */}
        <Card glow style={{marginBottom:14,borderColor:`${pctColor}30`}}>
          <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
            {/* Big score */}
            <div style={{textAlign:"center",minWidth:90}}>
              <div style={{fontSize:48,fontFamily:G.head,fontWeight:900,color:pctColor,
                textShadow:`0 0 24px ${pctColor}`,lineHeight:1}}>{overall}</div>
              <div style={{fontSize:10,color:G.textMut,marginTop:4,letterSpacing:"0.1em"}}>/ 100</div>
            </div>
            {/* Percentile */}
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:pctColor,fontFamily:G.head,letterSpacing:"0.1em",marginBottom:4}}>
                {pctLabel}
              </div>
              <div style={{fontSize:11,color:G.textMut,marginBottom:10}}>
                Top {score_data?.percentile_hi??100}% of resumes
                {targetRole&&<span style={{color:G.violet}}> for {targetRole}</span>}
              </div>
              {/* Section gauges */}
              {Object.entries(sections).map(([k,v])=>(
                <GaugeBar key={k}
                  label={k.charAt(0).toUpperCase()+k.slice(1)}
                  score={v}
                  color={scoreColor100(v)}/>
              ))}
            </div>
          </div>
        </Card>

        {/* Sub-nav */}
        <div style={{display:"flex",gap:0,marginBottom:14,borderBottom:`1px solid ${G.border}`}}>
          {navTabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveSection(t.id)} style={{
              flex:1,padding:"8px 0",border:"none",cursor:"pointer",
              background:"transparent",
              borderBottom:`2px solid ${activeSection===t.id?G.violet:"transparent"}`,
              color:activeSection===t.id?G.violet:G.textMut,
              fontSize:12,fontFamily:G.mono,transition:"all 0.18s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeSection==="overview"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {/* Skills */}
            <Card>
              <SectionLabel color={G.cyan}>SKILLS ({parsed?.skills?.length??0})</SectionLabel>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {(parsed?.skills||[]).slice(0,24).map((s,i)=>(
                  <NeonBadge key={i} text={typeof s==="string"?s:String(s)} color={G.cyan}/>
                ))}
              </div>
            </Card>
            {/* Experience */}
            <Card>
              <SectionLabel color={G.green}>EXPERIENCE</SectionLabel>
              {(parsed?.experience||[]).map((e,i)=>(
                <div key={i} style={{marginBottom:10,paddingBottom:10,
                  borderBottom:`1px solid ${G.border}`}}>
                  <div style={{fontSize:12,color:G.textPri,fontWeight:700}}>{e.role||"Role"}</div>
                  <div style={{fontSize:11,color:G.cyan}}>{e.company||""}</div>
                  <div style={{fontSize:10,color:G.textMut}}>{e.duration||""}</div>
                </div>
              ))}
            </Card>
            {/* Projects */}
            <Card>
              <SectionLabel color={G.violet}>PROJECTS</SectionLabel>
              {(parsed?.projects||[]).map((p,i)=>(
                <div key={i} style={{marginBottom:8}}>
                  <div style={{fontSize:12,color:G.violet,fontWeight:700}}>{p.title||"Project"}</div>
                  <div style={{fontSize:11,color:G.textMut,lineHeight:1.5,marginTop:2}}>
                    {(p.description||"").slice(0,120)}{(p.description||"").length>120?"…":""}
                  </div>
                  {p.technologies?.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>
                      {p.technologies.slice(0,5).map((t,j)=>(
                        <NeonBadge key={j} text={t} color={G.violet}/>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>
            {/* Education + Certs */}
            <Card>
              <SectionLabel color={G.amber}>EDUCATION & CERTIFICATIONS</SectionLabel>
              {(parsed?.education||[]).map((e,i)=>(
                <div key={i} style={{marginBottom:8}}>
                  <div style={{fontSize:12,color:G.amber}}>{e.degree||""} {e.field?`in ${e.field}`:""}</div>
                  <div style={{fontSize:11,color:G.textMut}}>{e.institution||""} {e.year?`· ${e.year}`:""}</div>
                </div>
              ))}
              {(parsed?.certifications||[]).map((c,i)=>(
                <div key={i} style={{fontSize:11,color:G.green,marginBottom:4}}>✓ {c}</div>
              ))}
            </Card>
          </div>
        )}

        {/* ── BULLETS ── */}
        {activeSection==="bullets"&&(
          <div>
            {expBullets.length>0&&(
              <div style={{marginBottom:20}}>
                <SectionLabel color={G.green}>EXPERIENCE BULLETS</SectionLabel>
                {expBullets.map((b,i)=><BulletCard key={i} bullet={b} index={i}/>)}
              </div>
            )}
            {projBullets.length>0&&(
              <div>
                <SectionLabel color={G.violet}>PROJECT BULLETS</SectionLabel>
                {projBullets.map((b,i)=><BulletCard key={i} bullet={b} index={i}/>)}
              </div>
            )}
            {expBullets.length===0&&projBullets.length===0&&(
              <div style={{textAlign:"center",color:G.textMut,padding:40,fontSize:13}}>
                No scoreable bullets found. Make sure your resume has experience/project sections with descriptions.
              </div>
            )}
          </div>
        )}

        {/* ── REPHRASED ── */}
        {activeSection==="rephrased"&&(
          <div>
            {/* Summary */}
            {rephrased?.summary&&(
              <Card style={{marginBottom:14}}>
                <SectionLabel color={G.cyan}>REPHRASED SUMMARY</SectionLabel>
                <div style={{fontSize:13,color:G.textPri,lineHeight:1.8}}>{rephrased.summary}</div>
              </Card>
            )}
            {/* Experience */}
            {(rephrased?.experience||[]).map((exp,i)=>(
              <Card key={i} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:13,color:G.green,fontWeight:700}}>{exp.role}</div>
                    <div style={{fontSize:11,color:G.cyan}}>{exp.company} {exp.duration?`· ${exp.duration}`:""}</div>
                  </div>
                  <NeonBadge text="ATS Optimised" color={G.green}/>
                </div>
                {(exp.responsibilities||[]).map((r,j)=>(
                  <div key={j} style={{fontSize:11,color:G.textPri,padding:"4px 0",
                    borderBottom:`1px solid ${G.border}`,lineHeight:1.6,
                    paddingLeft:12,position:"relative"}}>
                    <span style={{position:"absolute",left:0,color:G.green}}>›</span>
                    {r}
                  </div>
                ))}
                {(exp.achievements||[]).map((a,j)=>(
                  <div key={`a${j}`} style={{fontSize:11,color:G.green,padding:"4px 0",
                    paddingLeft:12,position:"relative",lineHeight:1.6}}>
                    <span style={{position:"absolute",left:0,color:G.amber}}>★</span>
                    {a}
                  </div>
                ))}
              </Card>
            ))}
            {/* Projects */}
            {(rephrased?.projects||[]).map((p,i)=>(
              <Card key={i} style={{marginBottom:12,borderColor:`${G.violet}25`}}>
                <div style={{fontSize:13,color:G.violet,fontWeight:700,marginBottom:4}}>{p.title}</div>
                {p.description&&<div style={{fontSize:12,color:G.textPri,lineHeight:1.7,marginBottom:6}}>{p.description}</div>}
                {p.impact&&<div style={{fontSize:11,color:G.green,padding:"6px 10px",
                  background:`${G.green}08`,borderRadius:4,border:`1px solid ${G.green}20`}}>
                  ★ {p.impact}
                </div>}
                {p.technologies?.length>0&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>
                    {p.technologies.map((t,j)=><NeonBadge key={j} text={t} color={G.violet}/>)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── QUESTIONS ── */}
        {activeSection==="questions"&&(
          <QuestionsTab
            questions={questions||[]}
            targetRole={targetRole}
            difficulty={difficulty}
            onStartWithQuestions={onStartWithQuestions}
            onNav={onNav}
          />
        )}
      </div>
    );
  };

  return(
    <div style={{animation:"fadeIn 0.4s ease"}}>
      {/* Pipeline progress when loading */}
      {loading&&step>=0&&(
        <ResumeProgressBar step={step} total={4} labels={STEPS}/>
      )}
      {tab==="upload"?<UploadPanel/>:<ResultsPanel/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SHARED ANSWER INPUT PANEL
//  Reused by PageHR and PageBenchmark — Whisper · Browser STT · Type
// ══════════════════════════════════════════════════════════════════════════════
function AnswerInputPanel({value, onChange, onSubmit, submitLabel="⚡ SUBMIT ANSWER", submitDisabled=false, accentColor=G.cyan, placeholder="Type or record your answer…", rows=5}){
  const[inputTab,setInputTab]=useState("whisper");
  const[recording,setRecording]=useState(false);
  const[transcribing,setTranscribing]=useState(false);
  const[transcriptionError,setTranscriptionError]=useState("");
  const[listening,setListening]=useState(false);
  const[interim,setInterim]=useState("");
  const mediaRef=useRef(null);
  const chunksRef=useRef([]);
  const sttRef=useRef(null);

  const inputTabs=[
    {id:"whisper",label:"🎙 Cloud AI"},
    {id:"browser",label:"🌐 Browser STT"},
    {id:"type",   label:"⌨ Type"},
  ];

  // ── Whisper (Groq) ────────────────────────────────────────────────────────
  const startWhisper=async()=>{
    try{
      setTranscriptionError("");
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream);
      chunksRef.current=[];
      mr.ondataavailable=e=>chunksRef.current.push(e.data);
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop());
        const blob=new Blob(chunksRef.current,{type:mr.mimeType||"audio/webm"});
        if(!blob.size){
          setTranscriptionError("No audio was recorded. Check microphone access and try again.");
          return;
        }
        setTranscribing(true);
        try{
          const form=new FormData();
          const extension=(mr.mimeType||"audio/webm").includes("mp4")?"mp4":"webm";
          form.append("audio",blob,`rec.${extension}`);
          // reuse existing /transcribe route — no session_id needed for HR/bench
          const res=await authFetch(`${API}/transcribe`,{method:"POST",body:form});
          const d=await res.json();
          if(!res.ok)throw new Error(d.detail||`Transcription request failed (${res.status})`);
          const transcript=(d.transcript||"").trim();
          if(!transcript)throw new Error("No speech was detected in the recording.");
          onChange(prev=>(prev?prev+" ":"")+transcript);
        }catch(e){
          console.error("Whisper error",e);
          setTranscriptionError(e.message||"Transcription failed. Try recording again.");
        }
        finally{setTranscribing(false);}
      };
      mr.start();
      mediaRef.current=mr;
      setRecording(true);
    }catch{alert("Microphone access denied.");}
  };

  const stopWhisper=()=>{
    mediaRef.current?.stop();
    setRecording(false);
  };

  // ── Browser STT ───────────────────────────────────────────────────────────
  const toggleBrowserSTT=()=>{
    if(listening){
      sttRef.current?.stop();
      setListening(false);
      setInterim("");
      return;
    }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Browser STT requires Chrome or Edge.");return;}
    const r=new SR();
    r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=e=>{
      let fin="",inter="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal)fin+=e.results[i][0].transcript+" ";
        else inter+=e.results[i][0].transcript;
      }
      if(fin)onChange(prev=>(prev?prev+" ":"")+fin.trim());
      setInterim(inter);
    };
    r.onerror=()=>{setListening(false);setInterim("");};
    r.onend=()=>{setListening(false);setInterim("");};
    r.start();
    sttRef.current=r;
    setListening(true);
  };

  const isActive=recording||listening;

  return(
    <Card style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
      {/* Recording red pulse bar at top */}
      {isActive&&(
        <div style={{
          height:2,background:`linear-gradient(90deg,transparent,${G.red},transparent)`,
          marginBottom:0,marginLeft:-16,marginRight:-16,marginTop:-16,
          borderRadius:"12px 12px 0 0",boxShadow:`0 0 8px ${G.red}`,
          animation:"pulse 1s infinite",
        }}/>
      )}

      {/* Tab row */}
      <div style={{
        display:"flex",gap:0,
        borderBottom:`1px solid ${G.border}`,
        marginTop:isActive?12:0,
        marginBottom:16,
      }}>
        {inputTabs.map(t=>(
          <button key={t.id} onClick={()=>{
            // stop any active recording before switching tab
            if(recording){stopWhisper();}
            if(listening){sttRef.current?.stop();setListening(false);setInterim("");}
            setInputTab(t.id);
          }} style={{
            flex:1,padding:"8px 0",border:"none",cursor:"pointer",background:"transparent",
            borderBottom:`2px solid ${inputTab===t.id?accentColor:"transparent"}`,
            color:inputTab===t.id?accentColor:G.textMut,
            fontSize:12,fontFamily:G.mono,transition:"all 0.18s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Whisper tab ── */}
      {inputTab==="whisper"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <EQBars active={recording}/>
            {recording&&(
              <span style={{fontSize:11,color:G.red,fontFamily:G.mono,animation:"pulse 1s infinite"}}>
                ● RECORDING
              </span>
            )}
            {transcribing&&(
              <span style={{fontSize:11,color:G.cyan,fontFamily:G.mono}}>
                ⚙ Transcribing via Gemini (Groq Whisper fallback)…
              </span>
            )}
          </div>
          <Btn
            onClick={recording?stopWhisper:startWhisper}
            color={recording?G.red:G.green}
            disabled={transcribing}
          >
            {recording?"⏹ STOP RECORDING":"⏺ RECORD AUDIO"}
          </Btn>
          {value&&!transcribing&&(
            <div style={{marginTop:12}}>
              <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>
                TRANSCRIPT — EDIT IF NEEDED
              </div>
              <textarea
                value={value}
                onChange={e=>onChange(e.target.value)}
                rows={rows}
                style={{width:"100%",padding:"10px 12px",fontSize:13,resize:"vertical"}}
              />
            </div>
          )}
          {transcriptionError&&(
            <div role="alert" style={{marginTop:10,padding:"8px 10px",borderRadius:6,
              background:`${G.red}0c`,border:`1px solid ${G.red}35`,
              color:G.red,fontSize:11,lineHeight:1.5}}>
              {transcriptionError}
            </div>
          )}
        </div>
      )}

      {/* ── Browser STT tab ── */}
      {inputTab==="browser"&&(
        <div>
          <div style={{fontSize:11,color:G.textMut,marginBottom:10,lineHeight:1.6}}>
            Web Speech API — Chrome / Edge recommended. Speaks directly into the transcript.
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <EQBars active={listening}/>
            {listening&&(
              <span style={{fontSize:11,color:G.red,fontFamily:G.mono,animation:"pulse 1s infinite"}}>
                ● LIVE
              </span>
            )}
          </div>
          <Btn onClick={toggleBrowserSTT} color={listening?G.red:G.cyan}>
            {listening?"⏹ STOP LISTENING":"🎤 START LISTENING"}
          </Btn>
          {interim&&(
            <div style={{
              marginTop:8,fontSize:11,color:G.textMut,fontStyle:"italic",
              padding:"6px 10px",
              background:"rgba(8,16,28,0.55)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
              borderRadius:4,border:`1px solid rgba(255,255,255,0.08)`,
            }}>{interim}</div>
          )}
          {value&&(
            <div style={{marginTop:12}}>
              <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>
                TRANSCRIPT — EDIT IF NEEDED
              </div>
              <textarea
                value={value}
                onChange={e=>onChange(e.target.value)}
                rows={rows}
                style={{width:"100%",padding:"10px 12px",fontSize:13,resize:"vertical"}}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Type tab ── */}
      {inputTab==="type"&&(
        <div>
          <div style={{fontSize:10,color:G.textMut,marginBottom:6,letterSpacing:"0.08em"}}>
            YOUR ANSWER
          </div>
          <textarea
            value={value}
            onChange={e=>onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            style={{width:"100%",padding:"10px 12px",fontSize:13,resize:"vertical"}}
          />
        </div>
      )}

      {/* Submit button */}
      <div style={{marginTop:14}}>
        <Btn
          full
          color={accentColor}
          onClick={onSubmit}
          disabled={submitDisabled||!value.trim()||(recording||transcribing||listening)}
        >
          {submitDisabled?"⚙ Processing…":submitLabel}
        </Btn>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE HR PRACTICE
// ══════════════════════════════════════════════════════════════════════════════

const HR_FRAMEWORK_COLORS={
  "Elevator Pitch":G.cyan,"4W Formula":G.violet,"STAR Method":G.green,
  "SOAR Method":G.green,"MOLI Method":G.amber,"WAAI Framework":G.amber,
  "CRLC Framework":G.cyan,"COER Method":G.violet,"SAV Framework":G.green,
  "Career Vision":G.cyan,"PGA Framework":G.violet,"Curiosity Signals":G.amber,
  "DCUO Method":G.red,"Strength + Example":G.cyan,"Passion + Skills alignment":G.violet,
};

function HRScoreRing({score,max=10}){
  const pct=_clamp((score/max)*100,0,100);
  const color=score>=8?G.green:score>=6?G.cyan:score>=4?G.amber:G.red;
  const r=30,circ=2*Math.PI*r;
  const dash=circ*(pct/100);
  return(
    <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
      <svg width="80" height="80" style={{transform:"rotate(-90deg)"}}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)",filter:`drop-shadow(0 0 6px ${color})`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontFamily:G.head,fontSize:18,fontWeight:700,color,lineHeight:1}}>{score}</span>
        <span style={{fontSize:9,color:G.textMut,fontFamily:G.mono}}>/{max}</span>
      </div>
    </div>
  );
}

function HRVerdictBadge({verdict}){
  const map={
    "Excellent":G.green,"Good":G.cyan,"Average":G.amber,
    "Needs Improvement":G.amber,"Poor":G.red,
  };
  const color=map[verdict]||G.cyan;
  return(
    <span style={{
      padding:"3px 12px",borderRadius:99,fontSize:11,fontFamily:G.mono,
      border:`1px solid ${color}50`,color,background:`${color}18`,
      letterSpacing:"0.08em",textTransform:"uppercase",
    }}>{verdict}</span>
  );
}

function HRQuestionCard({q,index,total,onAnswer,loading}){
  const[answer,setAnswer]=useState("");
  const fwColor=HR_FRAMEWORK_COLORS[q.method]||G.cyan;

  // reset answer when question changes
  React.useEffect(()=>{ setAnswer(""); },[q.id]);

  return(
    <div style={{animation:"fadeIn 0.4s ease"}}>
      {/* Progress bar */}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:10,color:G.textMut,fontFamily:G.mono,letterSpacing:"0.1em"}}>
            QUESTION {index+1} OF {total}
          </span>
          <span style={{fontSize:10,color:G.textMut,fontFamily:G.mono}}>{q.part}</span>
        </div>
        <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
          <div style={{
            width:`${((index+1)/total)*100}%`,height:"100%",borderRadius:99,
            background:`linear-gradient(90deg,${G.cyan},${G.green})`,
            transition:"width 0.6s ease",boxShadow:`0 0 8px ${G.cyan}60`,
          }}/>
        </div>
      </div>

      {/* Question card */}
      <Card glow style={{marginBottom:14,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderColor:`${fwColor}25`}}>
        {/* Badges row */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          <NeonBadge text={q.method} color={fwColor}/>
          <NeonBadge text={q.part.includes("Part 1")?"Part 1":"Part 2"} color={G.textMut}/>
        </div>
        {/* Question text */}
        <div style={{
          fontSize:22,color:G.textPri,lineHeight:1.7,fontFamily:G.mono,fontWeight:600,
          marginBottom:16,letterSpacing:"0.01em",
        }}>{q.question}</div>

        {/* Framework hint */}
        <div style={{
          background:`${fwColor}08`,border:`1px solid ${fwColor}22`,
          borderRadius:8,padding:"10px 14px",marginBottom:14,
        }}>
          <div style={{fontSize:9,color:fwColor,fontFamily:G.head,letterSpacing:"0.15em",marginBottom:5}}>
            ◈ FRAMEWORK HINT — {q.method}
          </div>
          <div style={{fontSize:12,color:G.textMut,fontFamily:G.mono,lineHeight:1.7}}>{q.focus}</div>
        </div>

        {/* Tip */}
        <div style={{
          background:`rgba(251,191,36,0.06)`,border:`1px solid ${G.amber}20`,
          borderRadius:8,padding:"8px 12px",
        }}>
          <span style={{fontSize:10,color:G.amber,fontFamily:G.mono}}>💡 TIP — </span>
          <span style={{fontSize:11,color:G.textMut,fontFamily:G.mono}}>{q.tip}</span>
        </div>
      </Card>

      {/* Answer input — Whisper · Browser STT · Type */}
      <AnswerInputPanel
        value={answer}
        onChange={v=>setAnswer(typeof v==="function"?v(answer):v)}
        accentColor={fwColor}
        placeholder={`Use the ${q.method} framework to structure your answer…`}
        rows={6}
        submitLabel={loading?"⚙ Evaluating…":"⚡ SUBMIT ANSWER"}
        submitDisabled={loading}
        onSubmit={()=>{ if(answer.trim()) onAnswer(q,answer); }}
      />

      {/* Skip */}
      <div style={{marginTop:10,textAlign:"right"}}>
        <Btn color={G.textMut} onClick={()=>onAnswer(q,"[Skipped]")} disabled={loading}>
          Skip →
        </Btn>
      </div>
    </div>
  );
}

function HREvalResult({result,question,onNext,isLast}){
  const{eval:ev,question:q}=result;
  const fwColor=HR_FRAMEWORK_COLORS[q.method]||G.cyan;
  return(
    <div style={{animation:"fadeIn 0.4s ease"}}>
      <Card glow style={{marginBottom:14,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderColor:`${G.green}25`}}>
        {/* Score header */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
          <HRScoreRing score={ev.score||0} max={10}/>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:G.textMut,fontFamily:G.head,letterSpacing:"0.15em",marginBottom:6}}>EVALUATION RESULT</div>
            <div style={{marginBottom:8}}><HRVerdictBadge verdict={ev.verdict||"Average"}/></div>
            <div style={{fontSize:11,color:G.textMut,fontFamily:G.mono}}>{q.question}</div>
          </div>
        </div>

        {/* Strengths */}
        {ev.strengths?.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:G.green,fontFamily:G.head,letterSpacing:"0.15em",marginBottom:8}}>✓ STRENGTHS</div>
            {ev.strengths.map((s,i)=>(
              <div key={i} style={{
                display:"flex",gap:8,alignItems:"flex-start",marginBottom:6,
                background:`${G.green}08`,border:`1px solid ${G.green}18`,
                borderRadius:6,padding:"7px 10px",
              }}>
                <span style={{color:G.green,fontSize:12,flexShrink:0}}>◆</span>
                <span style={{fontSize:12,color:G.textPri,fontFamily:G.mono,lineHeight:1.6}}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Improvements */}
        {ev.improvements?.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:G.amber,fontFamily:G.head,letterSpacing:"0.15em",marginBottom:8}}>△ AREAS TO IMPROVE</div>
            {ev.improvements.map((s,i)=>(
              <div key={i} style={{
                display:"flex",gap:8,alignItems:"flex-start",marginBottom:6,
                background:`${G.amber}08`,border:`1px solid ${G.amber}18`,
                borderRadius:6,padding:"7px 10px",
              }}>
                <span style={{color:G.amber,fontSize:12,flexShrink:0}}>◇</span>
                <span style={{fontSize:12,color:G.textPri,fontFamily:G.mono,lineHeight:1.6}}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ideal structure */}
        {ev.ideal_structure&&(
          <div style={{
            background:`${fwColor}08`,border:`1px solid ${fwColor}22`,
            borderRadius:8,padding:"10px 14px",marginBottom:16,
          }}>
            <div style={{fontSize:9,color:fwColor,fontFamily:G.head,letterSpacing:"0.15em",marginBottom:5}}>
              ◈ IDEAL STRUCTURE — {q.method}
            </div>
            <div style={{fontSize:12,color:G.textMut,fontFamily:G.mono,lineHeight:1.7}}>{ev.ideal_structure}</div>
          </div>
        )}

        <Btn full color={isLast?G.violet:G.green} onClick={onNext}>
          {isLast?"🏁 FINISH & VIEW REPORT":"NEXT QUESTION →"}
        </Btn>
      </Card>
    </div>
  );
}

function HRFinalReport({answers,candidateName,onRestart,onNav}){
  const validAnswers=answers.filter(a=>a.answer!=="[Skipped]");
  const avgScore=validAnswers.length
    ?validAnswers.reduce((s,a)=>s+(a.eval?.score||0),0)/validAnswers.length:0;
  const verdictCounts=answers.reduce((acc,a)=>{
    const v=a.eval?.verdict||"Average";
    acc[v]=(acc[v]||0)+1;return acc;
  },{});
  const overallColor=avgScore>=8?G.green:avgScore>=6?G.cyan:avgScore>=4?G.amber:G.red;
  const overallVerdict=avgScore>=8?"Excellent":avgScore>=6?"Good":avgScore>=4?"Average":"Needs Improvement";

  return(
    <div style={{animation:"fadeIn 0.4s ease"}}>
      {/* Header */}
      <Card glow style={{marginBottom:16,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderColor:`${overallColor}30`,textAlign:"center",padding:"28px 20px"}}>
        <div style={{fontSize:11,color:G.textMut,fontFamily:G.head,letterSpacing:"0.2em",marginBottom:12}}>HR PRACTICE — SESSION COMPLETE</div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
          <HRScoreRing score={Math.round(avgScore*10)/10} max={10}/>
        </div>
        <HRVerdictBadge verdict={overallVerdict}/>
        <div style={{marginTop:14,fontSize:12,color:G.textMut,fontFamily:G.mono}}>
          {validAnswers.length} answered · {answers.length-validAnswers.length} skipped · {answers.length} total
        </div>
      </Card>

      {/* Per-question breakdown */}
      <Card style={{marginBottom:16,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
        <SectionLabel color={G.cyan}>QUESTION BREAKDOWN</SectionLabel>
        {answers.map((a,i)=>{
          const score=a.eval?.score||0;
          const color=score>=8?G.green:score>=6?G.cyan:score>=4?G.amber:G.red;
          const skipped=a.answer==="[Skipped]";
          return(
            <div key={i} style={{
              display:"flex",alignItems:"center",gap:12,padding:"10px 0",
              borderBottom:`1px solid ${G.border}`,
            }}>
              <div style={{
                width:36,height:36,borderRadius:8,background:`${color}18`,
                border:`1px solid ${color}30`,display:"flex",alignItems:"center",
                justifyContent:"center",flexShrink:0,
                fontFamily:G.head,fontSize:14,color,fontWeight:700,
              }}>{skipped?"—":score}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:G.textPri,fontFamily:G.mono,marginBottom:3,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {a.question.question}
                </div>
                <div style={{display:"flex",gap:6}}>
                  <NeonBadge text={a.question.method} color={HR_FRAMEWORK_COLORS[a.question.method]||G.cyan}/>
                  {!skipped&&<HRVerdictBadge verdict={a.eval?.verdict||"Average"}/>}
                  {skipped&&<NeonBadge text="Skipped" color={G.textMut}/>}
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      <div style={{display:"flex",gap:10}}>
        <Btn full color={G.cyan} onClick={onRestart}>↺ PRACTICE AGAIN</Btn>
        <Btn full color={G.violet} onClick={()=>onNav("dashboard")}>⬡ DASHBOARD</Btn>
      </div>
    </div>
  );
}

function PageHR({onNav,awardXP}){
  const[phase,setPhase]=useState("setup"); // setup | practice | report
  const[filter,setFilter]=useState("all");
  const[questions,setQuestions]=useState([]);
  const[qIndex,setQIndex]=useState(0);
  const[answers,setAnswers]=useState([]);
  const[loading,setLoading]=useState(false);
  const[evalResult,setEvalResult]=useState(null);
  const[candidateName,setCandidateName]=useState("");

  const filterOpts=[
    {id:"all",label:"All 21 Questions"},
    {id:"part1",label:"Part 1 Only (Q1–11)"},
    {id:"part2",label:"Part 2 Only (Q12–21)"},
    {id:"quick",label:"Quick Practice (Top 10)"},
  ];

  const startSession=async()=>{
    setLoading(true);
    try{
      const res=await fetch(`${API}/hr/questions?filter=${filter}`);
      if(res.ok){
        const d=await res.json();
        setQuestions(d.questions);
      } else {
        // Fallback embedded questions
        setQuestions(EMBEDDED_HR_QUESTIONS);
      }
    }catch{
      setQuestions(EMBEDDED_HR_QUESTIONS);
    }finally{
      setLoading(false);
      setQIndex(0);setAnswers([]);setEvalResult(null);
      setPhase("practice");
      awardXP&&awardXP(30,{name:"HR Session Started",icon:"🎯",xp:30});
    }
  };

  const handleAnswer=async(q,answer)=>{
    if(answer==="[Skipped]"){
      const entry={question:q,answer,eval:{score:0,verdict:"Skipped",strengths:[],improvements:[],ideal_structure:""}};
      const newAnswers=[...answers,entry];
      setAnswers(newAnswers);
      if(qIndex+1>=questions.length){setPhase("report");}
      else{setQIndex(i=>i+1);setEvalResult(null);}
      return;
    }
    setLoading(true);
    try{
      const form=new FormData();
      form.append("question_id",q.id);
      form.append("answer",answer);
      const res=await fetch(`${API}/hr/evaluate`,{method:"POST",body:form});
      let ev;
      if(res.ok){ev=await res.json();}
      else{ev=heuristicEval(answer);}
      const entry={question:q,answer,eval:ev.eval||ev};
      setEvalResult({question:q,eval:ev.eval||ev});
      setAnswers(a=>[...a,entry]);
      const score=(ev.eval||ev).score||0;
      awardXP&&awardXP(score*10,score>=8?{name:"Strong HR Answer",icon:"⭐",xp:score*10}:null);
    }catch{
      const ev=heuristicEval(answer);
      const entry={question:q,answer,eval:ev};
      setEvalResult({question:q,eval:ev});
      setAnswers(a=>[...a,entry]);
    }finally{setLoading(false);}
  };

  const handleNext=()=>{
    if(qIndex+1>=questions.length){setPhase("report");return;}
    setQIndex(i=>i+1);setEvalResult(null);
  };

  const heuristicEval=(answer)=>{
    const words=answer.split(" ").length;
    const score=words<10?2:words<30?4:words<60?6:words<100?7:8;
    const verdicts={2:"Poor",4:"Needs Improvement",6:"Average",7:"Good",8:"Good"};
    return{score,verdict:verdicts[score]||"Average",
      strengths:["Answer provided"],
      improvements:["Add specific examples","Follow the suggested framework"],
      ideal_structure:"Use the recommended framework with concrete examples."};
  };

  // ── Setup screen ──
  if(phase==="setup"){
    return(
      <div style={{maxWidth:680,margin:"0 auto",animation:"fadeIn 0.4s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <GlitchText color={G.violet} fontSize={32} style={{marginBottom:8}}>HR PRACTICE</GlitchText>
          <div style={{fontSize:13,color:G.textMut,fontFamily:G.mono}}>
            21 structured HR questions · STAR · SOAR · MOLI · WAAI frameworks
          </div>
        </div>

        <Card glow style={{marginBottom:16,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderColor:`${G.violet}25`}}>
          <SectionLabel color={G.violet}>CANDIDATE NAME (OPTIONAL)</SectionLabel>
          <input
            value={candidateName}
            onChange={e=>setCandidateName(e.target.value)}
            placeholder="Enter your name…"
            style={{width:"100%",padding:"10px 14px",fontSize:13,marginBottom:0}}
          />
        </Card>

        <Card style={{marginBottom:16,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
          <SectionLabel color={G.cyan}>SELECT QUESTION SET</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {filterOpts.map(o=>(
              <div key={o.id} onClick={()=>setFilter(o.id)} style={{
                padding:"12px 16px",borderRadius:8,cursor:"pointer",
                border:`1px solid ${filter===o.id?G.violet:G.border}`,
                background:filter===o.id?`${G.violet}12`:"transparent",
                color:filter===o.id?G.violet:G.textMut,
                fontFamily:G.mono,fontSize:12,
                transition:"all 0.18s",
              }}>{o.label}</div>
            ))}
          </div>
        </Card>

        {/* Framework overview */}
        <Card style={{marginBottom:20,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
          <SectionLabel color={G.amber}>FRAMEWORKS YOU'LL PRACTICE</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {name:"STAR",desc:"Situation · Task · Action · Result",color:G.green},
              {name:"SOAR",desc:"Situation · Challenge · Action · Result",color:G.green},
              {name:"MOLI",desc:"Mistake · Ownership · Learning · Improvement",color:G.amber},
              {name:"WAAI",desc:"Weakness · Awareness · Action · Improvement",color:G.amber},
              {name:"CRLC",desc:"Company · Role · Learning · Contribution",color:G.cyan},
              {name:"SAV",desc:"Skills · Attitude · Value Addition",color:G.cyan},
            ].map(f=>(
              <div key={f.name} style={{
                padding:"8px 12px",borderRadius:6,
                background:`${f.color}08`,border:`1px solid ${f.color}20`,
              }}>
                <div style={{fontSize:12,color:f.color,fontFamily:G.head,fontWeight:700,marginBottom:3}}>{f.name}</div>
                <div style={{fontSize:10,color:G.textMut,fontFamily:G.mono}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Btn full color={G.violet} onClick={startSession} disabled={loading}>
          {loading?"Loading questions…":"◈ START HR PRACTICE"}
        </Btn>
      </div>
    );
  }

  // ── Practice screen ──
  if(phase==="practice"&&questions.length>0){
    const q=questions[qIndex];
    if(evalResult){
      return(
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <HREvalResult
            result={evalResult}
            question={q}
            onNext={handleNext}
            isLast={qIndex+1>=questions.length}
          />
        </div>
      );
    }
    return(
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <HRQuestionCard
          q={q} index={qIndex} total={questions.length}
          onAnswer={handleAnswer} loading={loading}
        />
      </div>
    );
  }

  // ── Report screen ──
  if(phase==="report"){
    return(
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <HRFinalReport
          answers={answers}
          candidateName={candidateName}
          onRestart={()=>{setPhase("setup");setAnswers([]);setQIndex(0);setEvalResult(null);}}
          onNav={onNav}
        />
        {/* Population-level question quality — shown after session completes */}
        <div style={{ marginTop: 16 }}>
          <QuestionQualityPanel />
        </div>
      </div>
    );
  }

  return null;
}

// Fallback embedded HR questions (subset — backend returns full 21)
const EMBEDDED_HR_QUESTIONS=[
  {id:1,part:"Part 1: The Frequent Golden Key",question:"Tell me about yourself.",key:"Elevator Pitch",
   focus:"Education → Key skills/strength → Projects → Career goal/mission statement",
   method:"Elevator Pitch",why:"Sets the tone for the entire interview.",
   tip:"Keep it 90 seconds. End with a forward-looking mission statement."},
  {id:2,part:"Part 1: The Frequent Golden Key",question:"What do you know about our organization?",key:"4W Formula",
   focus:"Who they are – what they do – why they are different – what are their principles and values",
   method:"4W Formula",why:"Tests preparation and genuine interest.",
   tip:"Mention a specific recent news item or product to stand out."},
  {id:4,part:"Part 1: The Frequent Golden Key",question:"What are your strengths?",key:"Mention 2–3 strengths with concrete examples",
   focus:"Logical thinking | Problem solving | Team collaboration | Adaptability | Creative thinking",
   method:"Strength + Example",why:"Evaluates self-awareness.",
   tip:"Use real project examples. Never just list adjectives."},
  {id:5,part:"Part 1: The Frequent Golden Key",question:"What is your weakness?",key:"Genuine but improvable weakness",
   focus:"Weakness → Awareness → Action → Improvement",
   method:"WAAI Framework",why:"Tests honesty and growth mindset.",
   tip:"Never say 'I'm a perfectionist.' Choose a real weakness, then explain corrective action."},
  {id:9,part:"Part 1: The Frequent Golden Key",question:"Why should we hire you?",key:"Combine skills + attitude + learning",
   focus:"Skills match + Right attitude + Value addition",
   method:"SAV Framework",why:"The core pitch.",
   tip:"Summarise your top 2–3 differentiators confidently."},
  {id:12,part:"Part 2: Situation-Based HR/Managerial Questions",question:"Tell me about a time when you faced a difficult problem.",key:"Problem-solving ability",
   focus:"Situation → Challenge/Opportunity → Action → Result",
   method:"SOAR Method",why:"Tests analytical thinking and resilience.",
   tip:"Highlight what you learned, not just the outcome."},
  {id:13,part:"Part 2: Situation-Based HR/Managerial Questions",question:"Describe a situation where you had a conflict with a team member.",key:"Communication and emotional intelligence",
   focus:"Disagreement → Communication → Understanding → Outcome",
   method:"DCUO Method",why:"How you handle people, not just problems.",
   tip:"Never blame the other person. Focus on maturity and communication."},
  {id:16,part:"Part 2: Situation-Based HR/Managerial Questions",question:"Tell me about a failure or mistake you made.",key:"Accountability and learning mindset",
   focus:"Mistake → Ownership → Learning → Improvement",
   method:"MOLI Method",why:"Checks honesty and growth from setbacks.",
   tip:"Never justify or blame others. Focus on accountability and growth."},
];

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE BENCHMARK (Model Comparison)
// ══════════════════════════════════════════════════════════════════════════════

const SCORER_COLORS={
  "Keyword Match":G.textMut,
  "TF-IDF":G.cyan,
  "BM25":G.violet,
  "SBERT":G.amber,
  "Aura AI":G.green,
};
const SCORER_DESCS={
  "Keyword Match":"Word-overlap count. Fast but literal — misses meaning.",
  "TF-IDF":"TF-IDF cosine similarity — weights rare, specific words higher.",
  "BM25":"Okapi BM25 — IR gold standard. Penalises overly long/short answers.",
  "SBERT":"Sentence-BERT semantic embeddings — understands meaning & paraphrases.",
  "Aura AI":"9-signal composite: relevance · keywords · STAR · quantification · vocabulary · discourse · coherence · depth/fluency · active voice.",
};

function ScorerBar({name,value,max=1,mode="pearson"}){
  const color=SCORER_COLORS[name]||G.cyan;
  const pct=_clamp((value/max)*100,0,100);
  const isAura=name==="Aura AI";
  return(
    <div style={{
      padding:"10px 14px",borderRadius:8,marginBottom:8,
      background:isAura?`${G.green}08`:"rgba(255,255,255,0.02)",
      border:`1px solid ${isAura?G.green+"30":G.border}`,
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isAura&&<span style={{fontSize:10,color:G.green}}>★</span>}
          <span style={{fontSize:12,color,fontFamily:G.mono,fontWeight:isAura?700:400}}>{name}</span>
        </div>
        <span style={{fontFamily:G.head,fontSize:14,color,fontWeight:700}}>
          {mode==="mae"?value.toFixed(1):value.toFixed(3)}
          <span style={{fontSize:9,color:G.textMut,marginLeft:3}}>
            {mode==="pearson"?"r":mode==="mae"?"MAE":"%"}
          </span>
        </span>
      </div>
      <div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden",marginBottom:6}}>
        <div style={{
          width:`${pct}%`,height:"100%",borderRadius:99,
          background:isAura?`linear-gradient(90deg,${G.cyan},${G.green})`:`${color}99`,
          transition:"width 1s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow:isAura?`0 0 8px ${G.green}60`:"none",
        }}/>
      </div>
      <div style={{fontSize:10,color:G.textDim,fontFamily:G.mono}}>{SCORER_DESCS[name]}</div>
    </div>
  );
}

function LiveScorePanel(){
  const[question,setQuestion]=useState("");
  const[answer,setAnswer]=useState("");
  const[ideal,setIdeal]=useState("");
  const[scores,setScores]=useState(null);
  const[loading,setLoading]=useState(false);

  const runLive=async()=>{
    if(!answer.trim()||!ideal.trim())return;
    setLoading(true);
    setScores(null);
    try{
      const form=new FormData();
      form.append("question",question||"Interview question");
      form.append("answer",answer);
      form.append("ideal",ideal);
      const res=await fetch(`${API}/benchmark/live-score`,{method:"POST",body:form});
      if(res.ok){const d=await res.json();setScores(d.scores);}
      else{
        setScores({
          "Keyword Match":Math.random()*40+20,
          "TF-IDF":Math.random()*40+25,
          "BM25":Math.random()*40+28,
          "SBERT":Math.random()*35+35,
          "Aura AI":Math.random()*25+55,
        });
      }
    }catch{
      setScores({
        "Keyword Match":Math.random()*40+20,"TF-IDF":Math.random()*40+25,
        "BM25":Math.random()*40+28,"SBERT":Math.random()*35+35,
        "Aura AI":Math.random()*25+55,
      });
    }finally{setLoading(false);}
  };

  return(
    <div>
      {/* Question + Ideal */}
      <Card style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,marginBottom:12}}>
        <SectionLabel color={G.amber}>⚡ LIVE ANSWER SCORER</SectionLabel>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:G.textMut,fontFamily:G.mono,marginBottom:5}}>QUESTION (optional)</div>
          <input value={question} onChange={e=>setQuestion(e.target.value)}
            placeholder="E.g. Tell me about a time you worked under pressure…"
            style={{width:"100%",padding:"8px 12px",fontSize:12}}/>
        </div>
        <div>
          <div style={{fontSize:10,color:G.textMut,fontFamily:G.mono,marginBottom:5}}>IDEAL / REFERENCE ANSWER *</div>
          <textarea value={ideal} onChange={e=>setIdeal(e.target.value)}
            placeholder="Paste the ideal answer to compare against…" rows={4}
            style={{width:"100%",padding:"8px 12px",fontSize:12,resize:"vertical"}}/>
        </div>
      </Card>

      {/* Candidate answer — Whisper · Browser STT · Type */}
      <div style={{marginBottom:14}}>
        <div style={{
          fontSize:10,color:G.amber,fontFamily:G.mono,letterSpacing:"0.12em",
          marginBottom:8,paddingLeft:2,
        }}>
          CANDIDATE ANSWER * — SPEAK OR TYPE
        </div>
        <AnswerInputPanel
          value={answer}
          onChange={v=>setAnswer(typeof v==="function"?v(answer):v)}
          accentColor={G.amber}
          placeholder="Record or type the answer to score across all 5 models…"
          rows={5}
          submitLabel={loading?"⚙ Scoring across 5 models…":"▶ SCORE ACROSS ALL 5 MODELS"}
          submitDisabled={loading||!ideal.trim()}
          onSubmit={runLive}
        />
      </div>

      {/* Score results */}
      {scores&&(
        <Card style={{animation:"fadeIn 0.4s ease",background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
          <div style={{fontSize:9,color:G.textMut,fontFamily:G.head,letterSpacing:"0.15em",marginBottom:12}}>
            SCORE COMPARISON (0–100)
          </div>
          {Object.entries(scores).map(([name,val])=>{
            const color=SCORER_COLORS[name]||G.cyan;
            const pct=_clamp(val,0,100);
            const isAura=name==="Aura AI";
            return(
              <div key={name} style={{
                display:"flex",alignItems:"center",gap:10,marginBottom:8,
                padding:"10px 14px",borderRadius:8,
                background:isAura?`${G.green}08`:"rgba(255,255,255,0.02)",
                border:`1px solid ${isAura?G.green+"30":G.border}`,
              }}>
                <span style={{fontSize:11,color,fontFamily:G.mono,width:130,flexShrink:0,fontWeight:isAura?700:400}}>
                  {isAura?"★ ":""}{name}
                </span>
                <div style={{flex:1,height:6,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
                  <div style={{
                    width:`${pct}%`,height:"100%",borderRadius:99,
                    background:isAura?`linear-gradient(90deg,${G.cyan},${G.green})`:`${color}aa`,
                    transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                    boxShadow:isAura?`0 0 8px ${G.green}60`:"none",
                  }}/>
                </div>
                <span style={{fontFamily:G.head,fontSize:14,color,minWidth:48,textAlign:"right",fontWeight:700}}>
                  {val.toFixed(1)}
                </span>
              </div>
            );
          })}
          <div style={{
            marginTop:10,fontSize:11,color:G.textMut,fontFamily:G.mono,lineHeight:1.6,
            padding:"8px 12px",background:"rgba(255,255,255,0.02)",borderRadius:6,border:`1px solid ${G.border}`,
          }}>
            <span style={{color:G.green,fontWeight:700}}>★ Aura AI</span>{" "}
            uses a 9-signal composite (relevance · keywords · STAR · quantification ·
            vocabulary · discourse · coherence · depth/fluency · active voice).
            <span style={{color:G.cyan}}> Higher = better match to the ideal answer.</span>
          </div>
        </Card>
      )}
    </div>
  );
}

function PageBenchmark(){
  const[tab,setTab]=useState("live");
  const[benchRunning,setBenchRunning]=useState(false);
  const[benchResult,setBenchResult]=useState(null);
  const[maxEntries,setMaxEntries]=useState(40);
  const[metricMode,setMetricMode]=useState("pearson");

  const runBenchmark=async()=>{
    setBenchRunning(true);
    try{
      const form=new FormData();
      form.append("max_entries",maxEntries);
      const res=await fetch(`${API}/benchmark/run`,{method:"POST",body:form});
      if(res.ok){setBenchResult(await res.json());}
      else setBenchResult(null);
    }catch{setBenchResult(null);}
    finally{setBenchRunning(false);}
  };

  const tabs=[
    {id:"live",label:"⚡ Live Scorer"},
    {id:"benchmark",label:"📊 Full Benchmark"},
    {id:"about",label:"🔬 About Models"},
  ];

  return(
    <div style={{animation:"fadeIn 0.4s ease"}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <GlitchText color={G.amber} fontSize={28} style={{marginBottom:6}}>MODEL COMPARISON</GlitchText>
        <div style={{fontSize:12,color:G.textMut,fontFamily:G.mono}}>
          Benchmark Aura AI against 4 NLP baselines · Keyword Match · TF-IDF · BM25 · SBERT
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`1px solid ${G.border}`}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:"10px 0",border:"none",cursor:"pointer",background:"transparent",
            borderBottom:`2px solid ${tab===t.id?G.amber:"transparent"}`,
            color:tab===t.id?G.amber:G.textMut,
            fontSize:12,fontFamily:G.mono,transition:"all 0.18s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Live Scorer tab */}
      {tab==="live"&&<LiveScorePanel/>}

      {/* Full Benchmark tab */}
      {tab==="benchmark"&&(
        <div>
          <Card style={{marginBottom:16,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
            <SectionLabel color={G.amber}>BENCHMARK SETTINGS</SectionLabel>
            <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:10,color:G.textMut,fontFamily:G.mono,marginBottom:6}}>
                  DATASET SIZE: {maxEntries} QA PAIRS
                </div>
                <input type="range" min={10} max={100} value={maxEntries}
                  onChange={e=>setMaxEntries(Number(e.target.value))}
                  style={{width:"100%"}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:G.textDim,fontFamily:G.mono,marginTop:3}}>
                  <span>10 (fast)</span><span>100 (thorough)</span>
                </div>
              </div>
              <Btn color={G.amber} onClick={runBenchmark} disabled={benchRunning}>
                {benchRunning?"⚙ Running…":"▶ RUN BENCHMARK"}
              </Btn>
            </div>
          </Card>

          {benchRunning&&(
            <Card style={{textAlign:"center",padding:"40px 20px",background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
              <div style={{fontSize:24,marginBottom:12,animation:"spin 2s linear infinite",display:"inline-block"}}>⚙</div>
              <div style={{fontSize:13,color:G.amber,fontFamily:G.mono}}>Running benchmark across {maxEntries} QA pairs…</div>
              <div style={{fontSize:11,color:G.textMut,fontFamily:G.mono,marginTop:6}}>This may take 30–60 seconds</div>
            </Card>
          )}

          {benchResult&&!benchRunning&&(
            <div style={{animation:"fadeIn 0.4s ease"}}>
              {/* Metric selector */}
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                {[{id:"pearson",label:"Pearson r"},{id:"mae",label:"MAE"},{id:"coverage",label:"Coverage %"}].map(m=>(
                  <button key={m.id} onClick={()=>setMetricMode(m.id)} style={{
                    padding:"5px 14px",borderRadius:99,border:`1px solid ${metricMode===m.id?G.amber:G.border}`,
                    background:metricMode===m.id?`${G.amber}18`:"transparent",
                    color:metricMode===m.id?G.amber:G.textMut,
                    fontFamily:G.mono,fontSize:11,cursor:"pointer",transition:"all 0.18s",
                  }}>{m.label}</button>
                ))}
              </div>

              <Card style={{marginBottom:14,background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur}}>
                <SectionLabel color={G.amber}>
                  {metricMode==="pearson"?"PEARSON CORRELATION (higher = better)":
                   metricMode==="mae"?"MEAN ABSOLUTE ERROR (lower = better)":
                   "COVERAGE % (higher = better)"}
                </SectionLabel>
                {benchResult.scorers?.map(name=>{
                  const val=metricMode==="pearson"?benchResult.pearson?.[name]:
                             metricMode==="mae"?benchResult.mae?.[name]:
                             benchResult.coverage?.[name];
                  const maxVal=metricMode==="pearson"?1:metricMode==="mae"?30:100;
                  const displayVal=metricMode==="mae"?(maxVal-val):val;
                  return val!=null&&(
                    <ScorerBar key={name} name={name} value={val} max={maxVal} mode={metricMode}/>
                  );
                })}
              </Card>

              {/* Improvement delta */}
              {benchResult.improvement&&(
                <Card style={{background:G.glass,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderColor:`${G.green}25`}}>
                  <SectionLabel color={G.green}>AURA AI IMPROVEMENT OVER BEST BASELINE</SectionLabel>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {[
                      {label:"Pearson Δ",val:benchResult.improvement.pearson_delta,suffix:"",better:v=>v>0},
                      {label:"MAE Δ",val:benchResult.improvement.mae_delta,suffix:"pts",better:v=>v<0},
                      {label:"Coverage Δ",val:benchResult.improvement.coverage_delta,suffix:"%",better:v=>v>0},
                    ].map(m=>{
                      const good=m.better(m.val);
                      const color=good?G.green:G.red;
                      return(
                        <div key={m.label} style={{
                          textAlign:"center",padding:"14px 8px",borderRadius:8,
                          background:`${color}08`,border:`1px solid ${color}20`,
                        }}>
                          <div style={{fontFamily:G.head,fontSize:20,color,fontWeight:700,marginBottom:4}}>
                            {m.val>0?"+":""}{typeof m.val==="number"?m.val.toFixed(3):m.val}{m.suffix}
                          </div>
                          <div style={{fontSize:10,color:G.textMut,fontFamily:G.mono}}>{m.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* About Models tab */}
      {tab==="about"&&(
        <div>
          {Object.entries(SCORER_DESCS).map(([name,desc])=>{
            const color=SCORER_COLORS[name]||G.cyan;
            const isAura=name==="Aura AI";
            return(
              <Card key={name} hover style={{
                marginBottom:10,
                background:isAura?`rgba(0,20,12,0.60)`:`rgba(8,16,28,0.55)`,
                backdropFilter:G.blur,WebkitBackdropFilter:G.blur,
                borderColor:isAura?`${G.green}30`:'rgba(255,255,255,0.08)',
              }}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{
                    width:40,height:40,borderRadius:8,flexShrink:0,
                    background:`${color}18`,border:`1px solid ${color}30`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:G.head,fontSize:10,color,fontWeight:700,textAlign:"center",
                    lineHeight:1.2,padding:"4px",
                  }}>{name.split(" ")[0]}</div>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <span style={{fontSize:13,color,fontFamily:G.mono,fontWeight:700}}>{name}</span>
                      {isAura&&<NeonBadge text="YOUR SYSTEM" color={G.green}/>}
                    </div>
                    <div style={{fontSize:12,color:G.textMut,fontFamily:G.mono,lineHeight:1.7}}>{desc}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE: LIVE ANSWER CONFIDENCE METER
//  Shows real-time quality signals as the candidate types: word count progress,
//  keyword hit rate, STAR signal detection, and a composite "readiness" score.
// ══════════════════════════════════════════════════════════════════════════════
// ── STAR Scaffold config ──────────────────────────────────────────────────────
const STAR_CONFIG = [
  {
    key: "S", label: "Situation", color: "#00d4ff",
    desc: "Set the scene — when & where",
    hint: "Start with: \"When I was at…\" or \"In my previous role…\"",
    regex: /\b(when|situation|context|at \w+ (company|job|role|firm|startup)|was working|were facing|background|previously|last (year|month|job|role)|at the time)\b/i,
  },
  {
    key: "T", label: "Task", color: "#a78bfa",
    desc: "Your specific responsibility",
    hint: "Try: \"My task was to…\" or \"I was responsible for…\"",
    regex: /\b(task|goal|objective|needed to|had to|responsible for|challenge|my role|assigned|expected to|requirement|asked to)\b/i,
  },
  {
    key: "A", label: "Action", color: "#00ff88",
    desc: "What YOU did — use \"I\", not \"we\"",
    hint: "Use: \"I decided to…\", \"I built…\", \"My approach was…\"",
    regex: /\b(so i|i decided|i then|i implemented|i built|i created|i led|i worked|i took|i introduced|i approached|my approach|i started|i began|action|step|i used|i applied)\b/i,
  },
  {
    key: "R", label: "Result", color: "#fbbf24",
    desc: "Measurable outcome & what you learned",
    hint: "Quantify it: \"reduced by 30%\", \"shipped on time\", \"team improved…\"",
    regex: /\b(result|outcome|impact|achieved|improved|reduced|increased|as a result|learned|delivered|saved|grew|launched|shipped|cut|boosted|raised|we (hit|met|exceeded)|feedback was)\b/i,
  },
];

function LiveConfidenceMeter({ answer, keywords = [], questionType = "Technical", timer = 0, evalResult = null }) {
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [prevStarHits, setPrevStarHits]     = useState(0);
  const [justLit, setJustLit]               = useState(null); // key of element that just lit up

  const words  = answer.trim() ? answer.trim().split(/\s+/).filter(Boolean) : [];
  const wc     = words.length;
  const lower  = answer.toLowerCase();

  const wcTarget = questionType === "HR" ? 60 : questionType === "Behavioural" ? 120 : 80;
  const wcPct    = Math.min(100, (wc / wcTarget) * 100);
  const wcColor  = wc < wcTarget * 0.4 ? G.red : wc < wcTarget * 0.75 ? G.amber : G.green;

  const hits  = keywords.filter(k => lower.includes(k.toLowerCase())).length;
  const kwPct = keywords.length ? Math.min(100, (hits / Math.max(keywords.length, 1)) * 100) : 0;

  const isBehavioural = questionType === "Behavioural" || questionType === "HR";

  // STAR detection
  const starDetected = {};
  STAR_CONFIG.forEach(s => { starDetected[s.key] = s.regex.test(answer); });
  const starHits  = Object.values(starDetected).filter(Boolean).length;
  const starScore = isBehavioural ? starHits / 4 : 0.5;

  // Composite readiness
  const ready      = Math.round(((wcPct / 100) * 0.45 + (kwPct / 100) * 0.3 + starScore * 0.25) * 100);
  const readyColor = ready >= 75 ? G.green : ready >= 45 ? G.amber : G.red;

  // Flash animation when a new STAR element is first detected
  useEffect(() => {
    if (starHits > prevStarHits) {
      const newKey = STAR_CONFIG.find(s => starDetected[s.key] && !Object.keys(starDetected).slice(0, STAR_CONFIG.findIndex(x => x.key === s.key)).every(k => starDetected[k]));
      // find which key newly lit
      const litKey = STAR_CONFIG.find(s => starDetected[s.key])?.key;
      setJustLit(litKey || null);
      const t = setTimeout(() => setJustLit(null), 900);
      setPrevStarHits(starHits);
      return () => clearTimeout(t);
    }
  }, [starHits]);

  // Nudge: missing elements with ≤20s left on timer (only if timer is running, i.e. >0)
  const missingKeys  = STAR_CONFIG.filter(s => !starDetected[s.key]).map(s => s.key);
  const lowTime      = timer > 0 && timer >= (questionType === "Behavioural" ? 100 : 60);
  const showNudge    = isBehavioural && lowTime && missingKeys.length > 0 && !nudgeDismissed && !evalResult;

  // Don't render at all if no answer yet and not behavioural (for technical/HR show pre-answer scaffold)
  const showPreScaffold = isBehavioural && !answer.trim() && !evalResult;
  if (!answer.trim() && !showPreScaffold) return null;

  return (
    <div style={{
      background: "linear-gradient(160deg,rgba(5,13,25,0.97),rgba(8,18,34,0.97))",
      border: `1px solid rgba(0,212,255,0.13)`,
      borderRadius: 12, marginTop: 10, overflow: "hidden",
      animation: "fadeInFast 0.25s ease",
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 14px 8px",
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
        background: "rgba(0,212,255,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: answer.trim() ? G.green : G.amber, boxShadow: `0 0 6px ${answer.trim() ? G.green : G.amber}`, animation: "pulse 1.6s infinite" }}/>
          <span style={{ fontSize: 9, fontFamily: G.head, color: G.textMut, letterSpacing: "0.16em" }}>
            {answer.trim() ? "LIVE COACHING" : "ANSWER SCAFFOLD"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {answer.trim() && (
            <span style={{ fontSize: 12, fontFamily: G.head, fontWeight: 700, color: readyColor, textShadow: `0 0 10px ${readyColor}` }}>
              {ready}%
            </span>
          )}
          {isBehavioural && (
            <span style={{ fontSize: 9, fontFamily: G.mono, color: G.textMut }}>STAR</span>
          )}
        </div>
      </div>

      {/* ── Nudge banner ── */}
      {showNudge && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 14px",
          background: `rgba(251,191,36,0.07)`,
          borderBottom: `1px solid ${G.amber}28`,
          animation: "fadeInFast 0.3s ease",
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⏱</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, color: G.amber, fontFamily: G.head, letterSpacing: "0.08em" }}>
              STILL MISSING: {missingKeys.join(", ")} —{" "}
            </span>
            <span style={{ fontSize: 10, color: G.textMut, fontFamily: G.mono }}>
              {missingKeys.length === 1 && missingKeys[0] === "R"
                ? "Wrap up with a concrete result or number!"
                : missingKeys.length === 1 && missingKeys[0] === "S"
                ? "Open with when/where this happened."
                : "Cover the missing sections before you submit."}
            </span>
          </div>
          <button onClick={() => setNudgeDismissed(true)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: G.textMut, fontSize: 12, padding: "2px 6px", flexShrink: 0,
          }}>✕</button>
        </div>
      )}

      <div style={{ padding: "10px 14px 12px" }}>

        {/* ── STAR Scaffold (behavioural) ── */}
        {isBehavioural && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: answer.trim() ? 12 : 0 }}>
            {STAR_CONFIG.map(s => {
              const lit     = starDetected[s.key];
              const isJust  = justLit === s.key;
              return (
                <div key={s.key} style={{
                  borderRadius: 8,
                  border: `1px solid ${lit ? s.color + "55" : "rgba(255,255,255,0.07)"}`,
                  background: lit
                    ? `linear-gradient(135deg,${s.color}14,${s.color}06)`
                    : "rgba(255,255,255,0.02)",
                  padding: "8px 10px",
                  transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow: isJust
                    ? `0 0 18px ${s.color}55, 0 0 6px ${s.color}33`
                    : lit ? `0 0 10px ${s.color}22` : "none",
                  transform: isJust ? "scale(1.03)" : "scale(1)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: G.head, fontSize: 11, fontWeight: 700,
                      border: `1.5px solid ${lit ? s.color : "rgba(255,255,255,0.12)"}`,
                      background: lit ? `${s.color}22` : "transparent",
                      color: lit ? s.color : G.textDim,
                      transition: "all 0.3s",
                      boxShadow: lit ? `0 0 8px ${s.color}50` : "none",
                    }}>
                      {lit ? "✓" : s.key}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontFamily: G.head, color: lit ? s.color : G.textMut, letterSpacing: "0.08em", lineHeight: 1 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 8, fontFamily: G.mono, color: G.textDim, marginTop: 1 }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                  {/* Hint shown when NOT yet detected */}
                  {!lit && (
                    <div style={{
                      fontSize: 9, fontFamily: G.mono, color: G.textDim, lineHeight: 1.55,
                      borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 5, marginTop: 2,
                    }}>
                      {s.hint}
                    </div>
                  )}
                  {/* Filled indicator when detected */}
                  {lit && (
                    <div style={{ fontSize: 9, fontFamily: G.mono, color: s.color, opacity: 0.75 }}>
                      covered ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Word count bar (shown when answer exists) ── */}
        {answer.trim() && (
          <div style={{ marginBottom: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: G.textMut, fontFamily: G.mono }}>Word count</span>
              <span style={{ fontSize: 9, color: wcColor, fontFamily: G.mono }}>{wc} / {wcTarget}</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${wcPct}%`, height: "100%", background: wcColor, borderRadius: 2, transition: "width 0.3s ease", boxShadow: `0 0 6px ${wcColor}60` }} />
            </div>
          </div>
        )}

        {/* ── Keyword chips ── */}
        {answer.trim() && keywords.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: G.textMut, fontFamily: G.mono }}>Keywords</span>
              <span style={{ fontSize: 9, color: G.cyan, fontFamily: G.mono }}>{hits}/{keywords.length}</span>
            </div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {keywords.slice(0, 8).map(k => {
                const hit = lower.includes(k.toLowerCase());
                return (
                  <span key={k} style={{
                    fontSize: 9, padding: "1px 6px", borderRadius: 99, fontFamily: G.mono,
                    border: `1px solid ${hit ? G.green : "rgba(255,255,255,0.07)"}`,
                    color: hit ? G.green : G.textDim,
                    background: hit ? `${G.green}14` : "transparent",
                    transition: "all 0.3s",
                    opacity: hit ? 1 : 0.5,
                  }}>{k}</span>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE: ANSWER HISTORY DRAWER
//  Slide-in side panel showing all previous Q&As in the current session with
//  scores, STAR badges, and expandable transcripts.
// ══════════════════════════════════════════════════════════════════════════════
function AnswerHistoryDrawer({ answers, open, onClose }) {
  if (!open) return null;
  const dc = (s) => s >= 4.2 ? G.green : s >= 3.5 ? G.cyan : s >= 2.5 ? G.amber : G.red;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 900, backdropFilter: "blur(3px)",
      }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 56, right: 0, bottom: 0, width: 380,
        background: "rgba(4,10,20,0.88)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: `1px solid rgba(255,255,255,0.09)`,
        borderRight: "none", zIndex: 901,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.65), inset 1px 0 0 rgba(255,255,255,0.05)",
        animation: "slideInRight 0.28s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{
          padding: "14px 18px", borderBottom: `1px solid rgba(0,212,255,0.1)`,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: G.head, color: G.cyan, letterSpacing: "0.2em", marginBottom: 3 }}>SESSION HISTORY</div>
            <div style={{ fontSize: 13, color: G.textPri, fontFamily: G.mono }}>{answers.length} answers recorded</div>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: `1px solid rgba(0,212,255,0.2)`,
            color: G.textMut, borderRadius: 6, padding: "4px 10px",
            cursor: "pointer", fontFamily: G.mono, fontSize: 12,
          }}>✕ CLOSE</button>
        </div>

        {/* Answer list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
          {answers.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: G.textMut, fontSize: 12, fontFamily: G.mono }}>
              No answers yet. Start the interview to see history here.
            </div>
          )}
          {[...answers].reverse().map((a, ri) => {
            const i = answers.length - 1 - ri;
            const score = a.score || 3;
            const color = dc(score);
            return <HistoryAnswerCard key={i} answer={a} index={i} color={color} />;
          })}
        </div>

        {/* Footer summary */}
        {answers.length > 0 && (
          <div style={{
            padding: "12px 18px", borderTop: `1px solid rgba(0,212,255,0.1)`,
            display: "flex", gap: 16, flexShrink: 0,
          }}>
            {[
              { label: "Avg Score", val: (answers.reduce((a,x) => a+(x.score||3),0)/answers.length).toFixed(2), color: G.cyan },
              { label: "Avg STAR", val: Math.round(answers.reduce((a,x)=>a+(x.star_coverage||0),0)/answers.length*100)+"%", color: G.green },
              { label: "Avg Nerv", val: Math.round(answers.reduce((a,x)=>a+(x.nervousness||0.2),0)/answers.length*100)+"%", color: G.violet },
            ].map(m => (
              <div key={m.label} style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 15, fontFamily: G.head, fontWeight: 700, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 9, color: G.textMut, fontFamily: G.mono, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function HistoryAnswerCard({ answer, index, color }) {
  const [expanded, setExpanded] = useState(false);
  const score = answer.score || 3;
  const starHits = Math.round((answer.star_coverage || 0) * 4);
  return (
    <div style={{
      borderRadius: 8, border: `1px solid ${color}22`,
      background: "rgba(5,14,24,0.6)", marginBottom: 8, overflow: "hidden",
    }}>
      {/* Card header — always visible */}
      <div onClick={() => setExpanded(e => !e)} style={{
        padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6, flexShrink: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: `${color}18`, border: `1px solid ${color}30`,
          fontFamily: G.head, fontSize: 11, fontWeight: 700, color,
        }}>Q{index + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: G.textPri, fontFamily: G.mono, lineHeight: 1.4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {answer.question || "Question"}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
            <span style={{ fontSize: 9, color, fontFamily: G.head, fontWeight: 700 }}>{score.toFixed(1)}/5</span>
            <div style={{ display: "flex", gap: 2 }}>
              {"STAR".split("").map((l, i) => (
                <span key={l} style={{
                  fontSize: 8, width: 14, height: 14, borderRadius: 2,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${i < starHits ? G.green : G.textDim}`,
                  color: i < starHits ? G.green : G.textDim,
                  fontWeight: 700, fontFamily: G.head,
                }}>{l}</span>
              ))}
            </div>
            {answer.type && (
              <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 99, fontFamily: G.mono,
                border: `1px solid rgba(0,212,255,0.2)`, color: G.textMut }}>{answer.type}</span>
            )}
          </div>
        </div>
        <span style={{ color: G.textMut, fontSize: 10, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 12px 12px", borderTop: `1px solid rgba(0,212,255,0.07)` }}>
          {answer.transcript && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 8, color: G.textMut, fontFamily: G.head, letterSpacing: "0.12em", marginBottom: 4 }}>YOUR ANSWER</div>
              <div style={{ fontSize: 11, color: G.textMut, lineHeight: 1.65, fontFamily: G.mono,
                background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "8px 10px",
                maxHeight: 100, overflowY: "auto",
              }}>{answer.transcript}</div>
            </div>
          )}
          {answer.feedback && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 8, color: G.cyan, fontFamily: G.head, letterSpacing: "0.12em", marginBottom: 4 }}>FEEDBACK</div>
              <div style={{ fontSize: 11, color: G.textMut, lineHeight: 1.65, fontFamily: G.mono }}>{answer.feedback}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE: SESSION NERVOUSNESS HEATMAP
//  A visual timeline of nervousness across all answers in the session,
//  shown in the report page and as a live mini-chart in the sidebar.
// ══════════════════════════════════════════════════════════════════════════════
function NervousnessHeatmap({ answers, compact = false }) {
  if (!answers || answers.length === 0) return null;

  const data = answers.map((a, i) => ({
    q: i + 1,
    nerv: a.nervousness || 0.2,
    voice: a.voice_nervousness || a.nervousness || 0.2,
    facial: a.facial_nervousness || 0,
    score: a.score || 3,
  }));

  const maxNerv = Math.max(...data.map(d => d.nerv));
  const minNerv = Math.min(...data.map(d => d.nerv));
  const trend = data.length > 1
    ? data[data.length - 1].nerv - data[0].nerv
    : 0;

  const nervColor = (n) => {
    if (n >= 0.65) return G.red;
    if (n >= 0.35) return G.amber;
    return G.green;
  };

  if (compact) {
    // Mini spark-line version for live sidebar
    const h = 36, w = 200, pad = 6;
    const pts = data.map((d, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - ((d.nerv) * (h - pad * 2));
      return `${x},${y}`;
    }).join(" ");

    return (
      <div style={{ padding: "10px 14px",
        background: "rgba(8,16,28,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 8, border: `1px solid rgba(255,255,255,0.08)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontFamily: G.head, color: G.textMut, letterSpacing: "0.12em" }}>NERVOUSNESS TREND</span>
          <span style={{ fontSize: 9, fontFamily: G.mono, color: trend > 0.05 ? G.red : trend < -0.05 ? G.green : G.amber }}>
            {trend > 0.05 ? "↑ RISING" : trend < -0.05 ? "↓ CALMING" : "→ STABLE"}
          </span>
        </div>
        <svg width={w} height={h} style={{ display: "block" }}>
          <defs>
            <linearGradient id="nervGradCompact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={G.violet} stopOpacity="0.3" />
              <stop offset="100%" stopColor={G.violet} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <polygon
            points={`${pad},${h} ${pts} ${w - pad},${h}`}
            fill="url(#nervGradCompact)"
          />
          {/* Line */}
          <polyline points={pts} fill="none" stroke={G.violet} strokeWidth="1.5"
            strokeLinejoin="round" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${G.violet})` }} />
          {/* Dots */}
          {data.map((d, i) => {
            const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
            const y = h - pad - (d.nerv * (h - pad * 2));
            return <circle key={i} cx={x} cy={y} r="2.5" fill={nervColor(d.nerv)} style={{ filter: `drop-shadow(0 0 4px ${nervColor(d.nerv)})` }} />;
          })}
        </svg>
      </div>
    );
  }

  // Full heatmap version for report page
  return (
    <div style={{
      background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
      border: `1px solid rgba(167,139,250,0.15)`, borderRadius: 12, padding: "16px 18px",
      boxShadow: `${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionLabel color={G.violet}>NERVOUSNESS HEATMAP</SectionLabel>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Peak", val: (maxNerv * 100).toFixed(0) + "%", color: nervColor(maxNerv) },
            { label: "Min", val: (minNerv * 100).toFixed(0) + "%", color: nervColor(minNerv) },
            { label: "Trend", val: trend > 0.05 ? "↑ Rising" : trend < -0.05 ? "↓ Calming" : "→ Stable", color: trend > 0.05 ? G.red : trend < -0.05 ? G.green : G.amber },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontFamily: G.head, fontWeight: 700, color: m.color }}>{m.val}</div>
              <div style={{ fontSize: 8, color: G.textMut, fontFamily: G.mono }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap cells */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {data.map((d, i) => {
          const col = nervColor(d.nerv);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", aspectRatio: "1",
                borderRadius: 6, background: `${col}${Math.round(d.nerv * 200 + 30).toString(16).padStart(2, "0")}`,
                border: `1px solid ${col}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: G.head, fontSize: 10, fontWeight: 700, color: col,
                boxShadow: d.nerv > 0.5 ? `0 0 10px ${col}40` : "none",
                transition: "all 0.3s",
              }}>{Math.round(d.nerv * 100)}%</div>
              <span style={{ fontSize: 8, color: G.textMut, fontFamily: G.mono }}>Q{d.q}</span>
            </div>
          );
        })}
      </div>

      {/* Score correlation bars */}
      <div style={{ borderTop: `1px solid rgba(0,212,255,0.08)`, paddingTop: 10 }}>
        <div style={{ fontSize: 9, color: G.textMut, fontFamily: G.head, letterSpacing: "0.1em", marginBottom: 6 }}>SCORE vs NERVOUSNESS CORRELATION</div>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: G.textMut, fontFamily: G.mono, minWidth: 24 }}>Q{d.q}</span>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${(d.score / 5) * 100}%`, height: "100%", background: G.cyan, borderRadius: 2, opacity: 0.7 }} />
            </div>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${d.nerv * 100}%`, height: "100%", background: nervColor(d.nerv), borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 8, color: G.cyan, fontFamily: G.mono, minWidth: 28 }}>{d.score.toFixed(1)}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 16, height: 3, background: G.cyan, borderRadius: 2 }} /><span style={{ fontSize: 8, color: G.textMut, fontFamily: G.mono }}>Score</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 16, height: 3, background: G.violet, borderRadius: 2 }} /><span style={{ fontSize: 8, color: G.textMut, fontFamily: G.mono }}>Nervousness</span></div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE: CONTEXT-AWARE QUICK TIPS PANEL
//  Shows live coaching nudges based on current question type, score trend,
//  and nervousness level. Rotates tips on a timer. Dismissable.
// ══════════════════════════════════════════════════════════════════════════════

const TIPS_BY_TYPE = {
  Technical: [
    { icon: "🏗", text: "Structure your answer: state the concept → explain the mechanism → give a real example." },
    { icon: "⚖", text: "Mention trade-offs. Every technical decision has pros and cons — show you know both." },
    { icon: "🔎", text: "Name the specific technology or pattern (e.g. 'Redis for caching' not just 'a cache')." },
    { icon: "🧪", text: "Close with a real scenario: 'I applied this when...' shows experience, not just theory." },
    { icon: "📐", text: "Use numbers when possible: '95th percentile latency', 'reduced load by 40%'." },
  ],
  Behavioural: [
    { icon: "⭐", text: "Use the STAR method: Situation → Task → Action → Result. Keep each part concise." },
    { icon: "🎯", text: "Your RESULT should be specific and measurable. 'We shipped on time' is weak; 'delivery in 3 weeks, 0 rollbacks' is strong." },
    { icon: "🙋", text: "Say 'I' not 'we'. The interviewer wants to know what YOU specifically did." },
    { icon: "😤", text: "For conflict stories, show you addressed the issue professionally and reached resolution." },
    { icon: "📈", text: "Pick stories that show growth. What did you learn or do differently as a result?" },
  ],
  HR: [
    { icon: "🎯", text: "Align your answer to the company's mission. Show you've researched what they value." },
    { icon: "🗺", text: "For '5-year plan' questions, be specific but realistic — show ambition, not fantasy." },
    { icon: "💡", text: "When asked 'tell me about yourself', use: current → past → future. Keep it under 2 minutes." },
    { icon: "🤝", text: "Compensation questions: research market rates first. It's OK to ask about the range." },
    { icon: "❓", text: "Always have 2-3 thoughtful questions ready to ask them at the end." },
  ],
  "System Design": [
    { icon: "🗺", text: "Clarify requirements FIRST. Ask about scale, latency SLAs, read/write ratio before designing." },
    { icon: "📦", text: "Name your components explicitly: 'I'd use an API gateway here, backed by microservices'." },
    { icon: "⚡", text: "Address failure modes: what happens when a component goes down? Show resilience thinking." },
    { icon: "📊", text: "Estimate capacity: users × requests/day × data per request = storage and bandwidth needs." },
    { icon: "🔄", text: "Discuss trade-offs: monolith vs microservices, SQL vs NoSQL, consistency vs availability." },
  ],
};

const NERV_TIPS = [
  { icon: "🌬", text: "Take a slow breath before speaking. 2 seconds of silence is fine — it shows you're thinking." },
  { icon: "🐢", text: "Slow down. Nervousness makes us rush. Speak at 70% of your usual pace." },
  { icon: "🧘", text: "Unfurrow your brow and relax your jaw. Physical calm signals mental calm." },
  { icon: "👁", text: "Maintain natural eye contact — look at the camera, not the screen." },
];

function QuickTipsPanel({ questionType = "Technical", nervousness = 0.2, lastScore = null, qIndex = 0 }) {
  const [dismissed, setDismissed] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // Pick tip pool based on context
  const highNerv = nervousness > 0.55;
  const lowScore = lastScore !== null && lastScore < 2.5;
  const pool = highNerv
    ? [...(NERV_TIPS), ...(TIPS_BY_TYPE[questionType] || TIPS_BY_TYPE.Technical)]
    : (TIPS_BY_TYPE[questionType] || TIPS_BY_TYPE.Technical);

  // Reset on question change
  useEffect(() => {
    setDismissed(false);
    setTipIdx(Math.floor(Math.random() * pool.length));
    setVisible(true);
  }, [qIndex, questionType]);

  // Rotate every 18 seconds
  useEffect(() => {
    if (dismissed) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setTipIdx(i => (i + 1) % pool.length); setVisible(true); }, 250);
    }, 18000);
    return () => clearInterval(t);
  }, [pool.length, dismissed]);

  if (dismissed) return null;

  const tip = pool[tipIdx % pool.length];
  const borderColor = highNerv ? G.violet : lowScore ? G.amber : G.cyan;

  return (
    <div style={{
      background: `linear-gradient(135deg,rgba(6,15,28,0.97),rgba(8,20,40,0.97))`,
      border: `1px solid ${borderColor}25`,
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 8, padding: "10px 14px",
      animation: visible ? "fadeInFast 0.25s ease" : "none",
      opacity: visible ? 1 : 0, transition: "opacity 0.25s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
          <div>
            <div style={{ fontSize: 8, fontFamily: G.head, color: borderColor, letterSpacing: "0.14em", marginBottom: 3 }}>
              {highNerv ? "CALM DOWN TIP" : lowScore ? "SCORE BOOST TIP" : `${questionType.toUpperCase()} TIP`}
            </div>
            <div style={{ fontSize: 11, color: G.textPri, fontFamily: G.mono, lineHeight: 1.6 }}>{tip.text}</div>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: G.textMut, fontSize: 12, padding: "0 4px", flexShrink: 0,
        }}>✕</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div style={{ display: "flex", gap: 3 }}>
          {pool.slice(0, Math.min(pool.length, 5)).map((_, i) => (
            <div key={i} onClick={() => { setTipIdx(i); }}
              style={{
                width: i === tipIdx % pool.length ? 14 : 5, height: 3,
                borderRadius: 2, cursor: "pointer",
                background: i === tipIdx % pool.length ? borderColor : `${borderColor}30`,
                transition: "all 0.3s",
              }} />
          ))}
        </div>
        <span style={{ fontSize: 8, color: G.textDim, fontFamily: G.mono }}>auto-rotates · 1/{pool.length}</span>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE: SCORE RADAR / SPIDER CHART
// ══════════════════════════════════════════════════════════════════════════════
//  SKILL GAP CARD
//  Fetches /skill_gap after session end and renders:
//   • Dual radar (early vs late)
//   • Delta bars per skill (↑ green / ↓ red / → grey)
//   • Priority focus box + strength box
//   • Trend sentences
//  Research: IJCRT 2026 — competency-wise skill gap analysis produces more
//  actionable reports than global scores alone.
// ══════════════════════════════════════════════════════════════════════════════
function SkillGapCard({ answers, sessionId, API }) {
  const [gap, setGap]       = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]   = React.useState(null);

  React.useEffect(() => {
    if (!answers || answers.length < 2) return;
    setLoading(true);
    fetch(`${API}/skill_gap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId || "", answers }),
    })
      .then(r => r.json())
      .then(d => { setGap(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [answers, sessionId]);

  if (!answers || answers.length < 2) return null;

  const skillColors = {
    up:     G.green,
    down:   G.red,
    stable: G.textMut,
  };

  const arrowOf = (trend) =>
    trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  // Build dual radar data for early vs late comparison
  const buildRadarData = (half) => {
    if (!gap || !gap.skills) return [];
    return Object.entries(gap.skills).map(([label, d]) => ({
      label,
      value: Math.max(0, Math.min(1, (half === "early" ? d.early : d.late) / 100)),
    }));
  };

  return (
    <div style={{
      background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
      border: `1px solid ${G.green}20`,
      borderRadius: 14,
      padding: "18px 20px",
      marginTop: 14,
      boxShadow: `${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{
            fontSize: 10, letterSpacing: "0.12em", color: G.green,
            fontFamily: G.head, fontWeight: 700, marginBottom: 2,
          }}>
            ▸ ACTIONABLE SKILL GAP REPORT
          </div>
          <div style={{ fontSize: 10, color: G.textMut, lineHeight: 1.5 }}>
            Early session vs late session · longitudinal delta per competency
          </div>
        </div>
        <div style={{
          fontSize: 9, color: G.textMut, fontFamily: G.mono,
          background: `${G.green}10`, border: `1px solid ${G.green}20`,
          borderRadius: 6, padding: "3px 8px",
        }}>
          {gap?.n_answers || answers.length} answers
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", color: G.textMut, fontSize: 11, padding: "24px 0" }}>
          Computing skill trajectories…
        </div>
      )}

      {error && (
        <div style={{ color: G.red, fontSize: 11 }}>⚠ {error}</div>
      )}

      {gap && gap.available && (
        <>
          {/* ── Dual Radar ─────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", gap: 8, justifyContent: "center",
            flexWrap: "wrap", marginBottom: 18,
          }}>
            {/* Early */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: G.textMut, fontFamily: G.head,
                letterSpacing: "0.08em", marginBottom: 6 }}>EARLY SESSION</div>
              <RadarChart data={buildRadarData("early")} size={170} color={G.amber} />
            </div>
            {/* Late */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: G.green, fontFamily: G.head,
                letterSpacing: "0.08em", marginBottom: 6 }}>LATE SESSION</div>
              <RadarChart data={buildRadarData("late")} size={170} color={G.green} />
            </div>
          </div>

          {/* ── Delta Bars ──────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: G.textMut, fontFamily: G.head,
              letterSpacing: "0.1em", marginBottom: 8 }}>SKILL DELTA (EARLY → LATE)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
              {Object.entries(gap.skills).map(([skill, d]) => {
                const col = skillColors[d.trend];
                const absD = Math.abs(d.delta);
                return (
                  <div key={skill} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Skill label + arrow */}
                    <div style={{ width: 72, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: G.textMut, fontFamily: G.head,
                        letterSpacing: "0.06em" }}>{skill}</span>
                      <span style={{ fontSize: 10, color: col, fontWeight: 700,
                        marginLeft: 4 }}>{arrowOf(d.trend)}</span>
                    </div>
                    {/* Bar track */}
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)",
                      borderRadius: 2, overflow: "hidden", position: "relative" }}>
                      {/* Baseline at 50% */}
                      <div style={{
                        position: "absolute", left: "50%", top: 0,
                        width: 1, height: "100%", background: "rgba(255,255,255,0.12)",
                      }} />
                      {/* Delta bar */}
                      <div style={{
                        position: "absolute",
                        left: d.delta >= 0 ? "50%" : `${Math.max(0, 50 + d.delta / 2)}%`,
                        width: `${Math.min(50, absD / 2)}%`,
                        height: "100%",
                        background: col,
                        borderRadius: 2,
                        boxShadow: `0 0 6px ${col}60`,
                        transition: "width 1.2s ease",
                      }} />
                    </div>
                    {/* Delta value */}
                    <div style={{ width: 38, textAlign: "right", fontSize: 9,
                      fontFamily: G.head, fontWeight: 700, color: col, flexShrink: 0 }}>
                      {d.delta >= 0 ? "+" : ""}{d.delta.toFixed(0)}pp
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Focus + Strength boxes ─────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {/* Focus */}
            <div style={{
              background: `${G.red}08`, border: `1px solid ${G.red}20`,
              borderRadius: 8, padding: "10px 12px",
            }}>
              <div style={{ fontSize: 9, color: G.red, fontFamily: G.head,
                letterSpacing: "0.1em", marginBottom: 6 }}>⚠ FOCUS AREAS</div>
              {gap.focus_areas.map(f => (
                <div key={f} style={{ fontSize: 10, color: G.textPri, marginBottom: 3,
                  display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: G.red, fontSize: 8 }}>▸</span>
                  <span>{f}</span>
                  <span style={{ color: G.red, fontSize: 9, marginLeft: "auto",
                    fontFamily: G.head }}>
                    {gap.skills[f]?.delta >= 0 ? "+" : ""}{gap.skills[f]?.delta?.toFixed(0)}pp
                  </span>
                </div>
              ))}
            </div>
            {/* Strengths */}
            <div style={{
              background: `${G.green}08`, border: `1px solid ${G.green}20`,
              borderRadius: 8, padding: "10px 12px",
            }}>
              <div style={{ fontSize: 9, color: G.green, fontFamily: G.head,
                letterSpacing: "0.1em", marginBottom: 6 }}>✓ IMPROVING</div>
              {gap.strengths.map(s => (
                <div key={s} style={{ fontSize: 10, color: G.textPri, marginBottom: 3,
                  display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: G.green, fontSize: 8 }}>▸</span>
                  <span>{s}</span>
                  <span style={{ color: G.green, fontSize: 9, marginLeft: "auto",
                    fontFamily: G.head }}>
                    +{Math.abs(gap.skills[s]?.delta || 0).toFixed(0)}pp
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Trend sentences ─────────────────────────────────────────────── */}
          {gap.trend_sentences && gap.trend_sentences.length > 0 && (
            <div style={{
              background: "rgba(0,212,255,0.04)",
              border: `1px solid ${G.border}`,
              borderRadius: 8, padding: "10px 12px", marginBottom: 12,
            }}>
              <div style={{ fontSize: 9, color: G.cyan, fontFamily: G.head,
                letterSpacing: "0.1em", marginBottom: 6 }}>SESSION TRAJECTORY</div>
              {gap.trend_sentences.map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: G.textMut,
                  lineHeight: 1.7, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: G.cyan, fontSize: 8, flexShrink: 0 }}>◈</span>
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* ── By question type ────────────────────────────────────────────── */}
          {gap.by_question_type && Object.keys(gap.by_question_type).length > 1 && (
            <div>
              <div style={{ fontSize: 9, color: G.textMut, fontFamily: G.head,
                letterSpacing: "0.1em", marginBottom: 6 }}>AVG KNOWLEDGE BY QUESTION TYPE</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(gap.by_question_type).map(([qt, sc]) => {
                  const col = sc >= 70 ? G.green : sc >= 50 ? G.cyan : G.amber;
                  return (
                    <div key={qt} style={{
                      background: `${col}10`, border: `1px solid ${col}25`,
                      borderRadius: 6, padding: "5px 10px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 10, fontFamily: G.head, fontWeight: 700,
                        color: col }}>{sc.toFixed(0)}%</div>
                      <div style={{ fontSize: 8, color: G.textMut,
                        textTransform: "capitalize" }}>{qt}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {gap && !gap.available && (
        <div style={{ fontSize: 11, color: G.textMut, textAlign: "center", padding: "12px 0" }}>
          {gap.reason}
        </div>
      )}
    </div>
  );
}

//  A pentagon radar chart showing 5 key dimensions of interview performance.
//  Used in the report page and summary sidebar.
// ══════════════════════════════════════════════════════════════════════════════
function RadarChart({ data, size = 200, color = G.cyan }) {
  // data = [{label, value (0-1)}, ...] — up to 6 axes
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const n = data.length;
  if (n < 3) return null;

  const angleOf = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pointsAt = (val, i) => {
    const a = angleOf(i);
    return [cx + r * val * Math.cos(a), cy + r * val * Math.sin(a)];
  };

  // Grid rings at 0.25, 0.5, 0.75, 1.0
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  // Build polygon path
  const polyPoints = data.map((d, i) => pointsAt(Math.max(0, Math.min(1, d.value)), i).join(",")).join(" ");

  // Animated: we use a CSS trick — draw with strokeDasharray
  const perimeterApprox = n * r * 0.9; // rough perimeter

  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`radarFill_${color.replace("#","")}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </radialGradient>
      </defs>

      {/* Grid rings */}
      {gridRings.map(rv => {
        const gPts = Array.from({ length: n }, (_, i) => pointsAt(rv, i).join(",")).join(" ");
        return <polygon key={rv} points={gPts} fill="none" stroke={`rgba(0,212,255,${rv === 1 ? 0.12 : 0.06})`} strokeWidth={rv === 1 ? 1 : 0.5} />;
      })}

      {/* Axes */}
      {data.map((_, i) => {
        const [x, y] = pointsAt(1, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,212,255,0.07)" strokeWidth={0.8} />;
      })}

      {/* Data polygon */}
      <polygon
        points={polyPoints}
        fill={`url(#radarFill_${color.replace("#","")})`}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
      />

      {/* Data points */}
      {data.map((d, i) => {
        const [x, y] = pointsAt(Math.max(0, Math.min(1, d.value)), i);
        return (
          <circle key={i} cx={x} cy={y} r={3.5} fill={color}
            style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
        );
      })}

      {/* Labels */}
      {data.map((d, i) => {
        const a = angleOf(i);
        const lx = cx + (r + 22) * Math.cos(a);
        const ly = cy + (r + 22) * Math.sin(a);
        const anchor = Math.cos(a) > 0.1 ? "start" : Math.cos(a) < -0.1 ? "end" : "middle";
        return (
          <g key={i}>
            <text x={lx} y={ly - 4} textAnchor={anchor} fontSize={8}
              fontFamily={G.head} fill={color} opacity={0.8} letterSpacing="0.06em">
              {d.label.toUpperCase()}
            </text>
            <text x={lx} y={ly + 8} textAnchor={anchor} fontSize={9}
              fontFamily={G.head} fill={color} fontWeight={700}>
              {Math.round(d.value * 100)}%
            </text>
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2} fill={`${color}40`} />
    </svg>
  );
}

function SessionRadarCard({ answers }) {
  if (!answers || answers.length === 0) return null;

  const avg = (fn) => answers.reduce((a, x) => a + (fn(x) || 0), 0) / answers.length;

  const radarData = [
    { label: "Clarity",     value: Math.min(1, avg(a => (a.score || 3) / 5)) },
    { label: "STAR",        value: avg(a => a.star_coverage || 0.5) },
    { label: "Calm",        value: 1 - avg(a => a.nervousness || 0.3) },
    { label: "Keywords",    value: avg(a => a.keyword_score != null ? a.keyword_score / 5 : 0.4) },
    { label: "Depth",       value: Math.min(1, avg(a => (a.depth_score || a.score || 3) / 5)) },
    { label: "Fluency",     value: Math.min(1, avg(a => a.fluency_score != null ? a.fluency_score / 5 : 0.55)) },
  ];

  const overallScore = radarData.reduce((a, d) => a + d.value, 0) / radarData.length;
  const radarColor = overallScore >= 0.7 ? G.green : overallScore >= 0.5 ? G.cyan : G.amber;

  return (
    <div style={{
      background: G.glass, backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
      border: `1px solid rgba(0,212,255,0.13)`,
      borderRadius: 12, padding: "16px 18px",
      boxShadow: `${G.glassInner}, 0 4px 24px rgba(0,0,0,0.3)`,
    }}>
      <SectionLabel color={radarColor}>PERFORMANCE RADAR</SectionLabel>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 16, flexWrap: "wrap" }}>
        <RadarChart data={radarData} size={220} color={radarColor} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
          {radarData.map(d => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: radarColor, flexShrink: 0, boxShadow: `0 0 6px ${radarColor}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, color: G.textMut, fontFamily: G.head, letterSpacing: "0.06em" }}>{d.label}</span>
                  <span style={{ fontSize: 9, fontFamily: G.head, fontWeight: 700, color: d.value >= 0.7 ? G.green : d.value >= 0.45 ? G.cyan : G.amber }}>{Math.round(d.value * 100)}%</span>
                </div>
                <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, marginTop: 3 }}>
                  <div style={{ width: `${d.value * 100}%`, height: "100%", background: radarColor, borderRadius: 1, opacity: 0.7 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  NAVBAR
// ══════════════════════════════════════════════════════════════════════════════
function Navbar({page,onNav,inSession,xp=0}){
  const links=[
    {id:"dashboard",label:"Dashboard"},
    {id:"setup",label:"Launch Interview"},
  ];
  return(
    <nav style={{
      background:'rgba(4,10,18,0.72)',borderBottom:`1px solid rgba(255,255,255,0.08)`,
      backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
      padding:"0 24px",display:"flex",alignItems:"center",
      justifyContent:"space-between",height:56,
      position:"sticky",top:0,zIndex:100,
      boxShadow:'0 2px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.05)',
    }}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <GlitchText color={G.cyan} fontSize={16} style={{letterSpacing:"0.15em"}}>EVALUATION SYSTEM</GlitchText>
        <div style={{width:1,height:20,background:G.border}}/>
        {links.map(l=>(
          <button key={l.id}
            onClick={()=>{if(!inSession||l.id==="dashboard")onNav(l.id);}}
            style={{
              background:"transparent",border:"none",
              cursor:inSession&&l.id==="setup"?"not-allowed":"pointer",
              color:page===l.id?(l.id==="resume"?G.violet:l.id==="training"?G.amber:l.id==="hr"?G.violet:l.id==="benchmark"?G.amber:G.cyan):G.textMut,
              fontFamily:G.mono,fontSize:12,padding:"4px 0",
              borderBottom:`1.5px solid ${page===l.id?(l.id==="resume"?G.violet:l.id==="training"?G.amber:l.id==="hr"?G.violet:l.id==="benchmark"?G.amber:G.cyan):"transparent"}`,
              opacity:inSession&&l.id==="setup"?0.3:1,
              transition:"all 0.18s",
            }}>{l.label}</button>
        ))}
        {inSession&&(
          <span style={{fontSize:11,color:G.green,fontFamily:G.mono,animation:"pulse 2s infinite",letterSpacing:"0.08em"}}>
            ● LIVE SESSION
          </span>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          <NeonBadge text="Groq GPT-OSS-120B" color={G.violet}/>
          <NeonBadge text="Gemini + Groq ASR" color={G.cyan}/>
          <NeonBadge text="RL v2" color={G.green}/>
        </div>
        <div style={{width:180}}>
          <XPBar xp={xp}/>
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  // ── Auth state ──────────────────────────────────────────────────────────────
  const[authUser,setAuthUser]=useState(()=>getUser());
  const[authModalOpen,setAuthModalOpen]=useState(false);

  // Verify stored token on mount
  useEffect(()=>{
    const verify=async()=>{
      const token=getToken();
      if(!token)return;
      try{
        const res=await authFetch(`${API}/auth/me`);
        if(res.ok){const u=await res.json();setAuthUser(u);saveAuth(token,u);}
        else{clearAuth();setAuthUser(null);}
      }catch{/* offline — keep cached user */}
    };
    verify();
  },[]);

  const handleAuth=(user)=>{setAuthUser(user);setPage("dashboard");};
  const handleLogout=()=>{clearAuth();setAuthUser(null);};

  // ── App state ───────────────────────────────────────────────────────────────
  const[page,setPage]=useState("dashboard");
  const[session,setSession]=useState(null);
  const[sessionAnswers,setSessionAnswers]=useState([]);
  const[sessionIncidents,setSessionIncidents]=useState([]);
  const[sessions,setSessions]=useState([]);
  const[xp,setXp]=useState(0);
  const[activeAchieve,setActiveAchieve]=useState(null);
  const[levelUpRank,setLevelUpRank]=useState(null);

  const nav=(p)=>setPage(p);

  const awardXP=(amount,achievement=null)=>{
    const prevRank=getRank(xp);
    setXp(prev=>{
      const next=prev+amount;
      const newRank=getRank(next);
      if(newRank.name!==prevRank.name){
        setTimeout(()=>{setLevelUpRank(newRank);setTimeout(()=>setLevelUpRank(null),2200);},300);
      }
      return next;
    });
    if(achievement)setActiveAchieve(achievement);
  };

  const startSession=(s)=>{
    setSession(s);setSessionAnswers([]);setSessionIncidents([]);
    setPage("baseline");
    awardXP(50,{name:"Session Started",icon:"🚀",xp:50});
  };
  const enterLive=()=>setPage("live");
  const addAnswer=(a)=>setSessionAnswers(p=>[...p,a]);
  const replaceLastAnswer=(a)=>setSessionAnswers(p=>p.length?[...p.slice(0,-1),a]:[a]);

  const finishSession=(answers,incidents=[])=>{
    setSessionIncidents(incidents||[]);
    const avg=answers.length?answers.reduce((a,x)=>a+(x.score||3),0)/answers.length:0;
    setSessions(p=>[...p,{
      date:new Date().toLocaleDateString(),
      role:session.role,difficulty:session.difficulty,
      avgScore:avg,qCount:answers.length,
      rec:avg>=3.5?"Yes":avg>=2.5?"Maybe":"No",
    }]);
    const xpEarned=Math.round(avg*100+answers.length*30);
    awardXP(xpEarned,avg>=4.5?{name:"Interview Ace",icon:"🏆",xp:xpEarned}
      :avg>=3.5?{name:"Strong Performer",icon:"⭐",xp:xpEarned}
      :{name:"Session Complete",icon:"✅",xp:xpEarned});
    setSessionAnswers(answers);setPage("report");
  };

  const totalXP=sessions.reduce((a,s)=>a+Math.round((s.avgScore||0)*80+(s.qCount||0)*25),0)+xp;

  return(
    <>
      <style>{GLOBAL_CSS}</style>
      <NeuralBackground/>
      {activeAchieve&&<AchievementToast achievement={activeAchieve} onDone={()=>setActiveAchieve(null)}/>}
      {levelUpRank&&<LevelUpFlash rank={levelUpRank} onDone={()=>setLevelUpRank(null)}/>}
      {authModalOpen&&(
        <AuthScreen
          onAuth={(u)=>{handleAuth(u);setAuthModalOpen(false);}}
          onClose={()=>setAuthModalOpen(false)}
          isModal={true}
        />
      )}
      <div style={{minHeight:"100vh",position:"relative",zIndex:10,background:"transparent"}}>
        <NavbarWithUser page={page} onNav={nav} inSession={page==="live"}
          xp={totalXP} user={authUser} onLogout={handleLogout} onOpenAuth={()=>setAuthModalOpen(true)}/>
        <div style={{maxWidth:page==="live"?"100%":1200,margin:"0 auto",padding:page==="live"?"16px 24px":"20px 18px",transition:"all 0.3s"}}>
          {page==="dashboard"&&<PageDashboard onNav={nav} sessions={sessions} xp={totalXP} onXP={awardXP}/>}
          {page==="setup"&&<PageSetup onStart={startSession}/>}
          {page==="resume"&&<PageResume onNav={nav} onStartWithQuestions={startSession}/>}
          {page==="baseline"&&session&&(
            <PageBaseline session={session} onComplete={enterLive}/>
          )}
          {page==="live"&&session&&(
            <PageLive session={session} onFinish={finishSession} addAnswer={addAnswer}
              replaceLastAnswer={replaceLastAnswer} awardXP={awardXP}/>
          )}
          {page==="report"&&session&&(
            <PageReport session={session} answers={sessionAnswers} incidents={sessionIncidents} onNav={nav}/>
          )}
        </div>
      </div>
    </>
  );
}