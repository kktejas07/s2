# IQEApp MVC → MVVM Migration Analysis

## Current State

```
Layer             Lines      Pattern
─────────────────────────────────────────
IQEApp.Web/Views    86K cshtml    Razor + inline jQuery
IQEApp.Web/Controllers  15K cs    Thin delegation + inline PDF/Excel
IQEApp.Web/Models       9K cs     ViewModels + BusinessModel (40% of logic!)
IQEApp.Service          6K cs     Dapper queries, basic CRUD
IQEApp.Domain           2K cs     Pure POCOs
IQEApp.Core            572 cs     Helpers, cache, session
─────────────────────────────────────────
Total: ~118K lines, 187 .cs files, 239 .cshtml files
```

**Critical finding**: 40% of business logic lives in `*BusinessModel` classes inside `Models/` folder, co-located with ViewModels. DI (Unity) is installed but never used — all services are `new`'d up directly.

---

## Architecture Options

### Option A: ASP.NET Core + Vue 3 (Recommended)

```
┌─────────────────────────────────────────────────┐
│  Frontend (SPA)                                  │
│  Vue 3 + Pinia (MVVM) + TypeScript              │
│  PrimeVue / Naive UI (components)               │
│  Axios (HTTP)                                    │
├─────────────────────────────────────────────────┤
│  BFF / API Gateway                               │
│  ASP.NET Core 8/9 Web API                        │
│  SignalR (real-time)                             │
│  ┌────────────────────────────────────────────┐  │
│  │  AI Services                               │  │
│  │  Azure OpenAI / Semantic Kernel            │  │
│  │  ML.NET / Azure AI Document Intelligence   │  │
│  └────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Business Logic Layer                            │
│  IQEApp.Business (new) ← extracted from         │
│    *BusinessModel classes + controllers         │
├─────────────────────────────────────────────────┤
│  Service Layer                                   │
│  IQEApp.Service (refactored to async)           │
│  Dapper + Stored Procedures (keep)              │
├─────────────────────────────────────────────────┤
│  Domain + Core (keep as-is)                     │
│  IQEApp.Domain, IQEApp.Core                     │
├─────────────────────────────────────────────────┤
│  Data                                            │
│  SQL Server (keep) + Azure Blob (keep)          │
└─────────────────────────────────────────────────┘
```

### Option B: Blazor WebAssembly

```
┌─────────────────────────────────────────────────┐
│  Blazor WebAssembly (MVVM via Component)        │
│  .NET 8/9 + C# (no JS framework needed)        │
│  MudBlazor / Radzen / Telerik                   │
├─────────────────────────────────────────────────┤
│  ASP.NET Core API (hosted)                      │
│  + Azure OpenAI / Semantic Kernel               │
├─────────────────────────────────────────────────┤
│  Business + Service layers (same as Option A)   │
└─────────────────────────────────────────────────┘
```

### Option C: ASP.NET Core MVC + HTMX (Progressive)

```
┌─────────────────────────────────────────────────┤
│  ASP.NET Core MVC + HTMX + Alpine.js            │
│  (minimal JS, server-rendered HTML fragments)   │
│  + AI at the API/Service layer                  │
├─────────────────────────────────────────────────┤
│  Keep existing Razor patterns, replace jQuery   │
│  with HTMX for AJAX, Alpine for client state    │
└─────────────────────────────────────────────────┘
```

---

## Recommended Tech Stack (Option A — Full MVVM)

### Frontend (MVVM Pattern)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Vue 3 + Composition API | Reactive MVVM via `ref()`/`reactive()`, TypeScript support |
| **State** | Pinia | Typed store modules per domain |
| **Component Lib** | PrimeVue 4 | DataTable, Tree, Dialog, FileUpload — maps to existing Grid.Mvc, jsTree, Dropzone |
| **HTTP** | Axios + interceptors | Auth token injection, error handling |
| **Forms** | VeeValidate + Zod | Replaces `jquery.validate.unobtrusive` |
| **Routing** | Vue Router | Route guards for auth |
| **Charts** | Apache ECharts | Dashboard counts |
| **Build** | Vite + Vitest | Fast HMR, modern build |

### Backend

| Layer | Technology | Migration Path |
|-------|-----------|---------------|
| **Runtime** | ASP.NET Core 9 | Port from .NET Framework 4.8 |
| **API** | ASP.NET Core Web API Controllers | Replace MVC controllers (keep route structure) |
| **Auth** | ASP.NET Core Identity + JWT | Replace FormsAuthentication |
| **Validation** | FluentValidation | Replace inline data annotations |
| **DI** | Built-in `Microsoft.Extensions.DI` | Remove Unity, wire properly |
| **Mapping** | Mapster (lighter) or AutoMapper 13 | Replace AutoMapper 4.1 |
| **ORM** | Dapper (keep, async-ify) | Same, just make `async` |
| **Real-time** | SignalR | Visit status updates, notifications |
| **PDF** | QuestPDF (modern) | Replace iTextSharp/Syncfusion/Spire |
| **Excel** | ClosedXML (keep) | Already works |
| **Logging** | Serilog | Replace log4net |
| **Caching** | IDistributedCache + Redis | Replace `MemoryCache`/`Singleton` |

### AI Integration

| Capability | Technology | Use Case |
|-----------|-----------|----------|
| **LLM Orchestration** | Semantic Kernel | AI workflows, chain-of-thought for QC |
| **Vision/OCR** | Azure AI Document Intelligence | Extract data from inspection photos, scan documents |
| **Text Generation** | Azure OpenAI (GPT-4o) | Auto-generate inspection reports, email drafts |
| **Embeddings + RAG** | Azure AI Search + pgvector | Search past inspection reports, knowledge base |
| **Classification** | ML.NET | Predict inspection outcomes, flag anomalies |
| **Chatbot** | Copilot Studio / custom chatbot | Internal assistant for coordinators |

### Where AI Adds Value to This App

```
Process Step          AI Application
──────────────────────────────────────────────
Service Order Entry   Auto-classify inspection type from description
                      Suggest POs based on client history

Visit Scheduling      Predict optimal inspector assignment
                      Auto-detect scheduling conflicts

Inspection Capture    OCR on inspection reports
                      Image analysis for defect detection
                      Auto-generate report narrative from photos

Quality Check         Anomaly detection in expense claims
                      NLP sentiment on customer feedback

Invoice Generation    Auto-line-item extraction from visit data
                      Flag invoice discrepancies

Reports               NL query on past reports ("show me all failed
                      inspections last month")
                      Auto-summarize visit outcomes

Dashboard             Predictive: projected revenue, overdue invoices
                      AI-driven insights ("3 clients down 40% YoY")
```

---

## Migration Strategy (Phased)

### Phase 0: Foundation (2-3 weeks)
- [ ] Extract `*BusinessModel` classes into `IQEApp.Business` project
- [ ] Wire up DI (Microsoft.Extensions.DI) — register all services
- [ ] Convert all synchronous Dapper calls to `async`
- [ ] Add ASP.NET Core Web API project alongside existing MVC

### Phase 1: Auth + API Layer (2 weeks)
- [ ] Replace FormsAuthentication with ASP.NET Core Identity + JWT
- [ ] Build Web API controllers mirroring existing MVC routes
- [ ] Replace `SingletonScreenFeatureMapping` with proper `MemoryCache`/`Redis`
- [ ] Add SignalR for real-time notifications

### Phase 2: Frontend SPA (4-6 weeks)
- [ ] Scaffold Vue 3 + Pinia + Vue Router project
- [ ] Build shared components (DataTable, FileUpload, Dialog)
- [ ] Migrate simple views first: Login, Dashboard, Master Data
- [ ] Migrate directory/grid views with PrimeVue DataTable
- [ ] Migrate complex workflows: VisitProcessing, Invoice, ServiceOrder
- [ ] Implement form validation with VeeValidate

### Phase 3: AI Integration (ongoing)
- [ ] Set up Azure OpenAI / Semantic Kernel
- [ ] Build AI service layer: `IQEApp.AI` project
- [ ] Integrate AI-assisted report generation
- [ ] Add chatbot for internal queries
- [ ] Document intelligence for auto-processing inspection docs

### Phase 4: PDF/Reporting Modernization (2-3 weeks)
- [ ] Replace iTextSharp/Syncfusion/Spire with QuestPDF
- [ ] Move all PDF/Excel generation to service layer
- [ ] Build React/Vue-based report viewer instead of PDF download

---

## Migration Complexity by Module

| Module | Views | Controller Logic | Complex Forms | AI Potential | Difficulty |
|--------|-------|-----------------|---------------|--------------|------------|
| Login/Auth | Low | Low | No | Low | ★☆☆ |
| Dashboard | 2 | 1 action | No | Medium (insights) | ★☆☆ |
| Master Data | Low | Low | No | Low | ★☆☆ |
| Client/Mfr | Medium | Medium | Yes | Low | ★★☆ |
| Service Order | High | High | Yes | Medium | ★★★ |
| Control Number | Medium | Medium | Yes | Low | ★★☆ |
| Purchase Order | Medium | Medium | Yes | Low | ★★☆ |
| **Visit Processing** | **Very High** | **Very High** | **Yes** | **High** | **★★★★** |
| **Invoice** | **Very High** | **Very High** | **Yes** | **High** | **★★★★** |
| Reports | Medium | Medium | No | Very High | ★★☆ |
| File Upload | Medium | Medium | Yes | High (OCR) | ★★☆ |
| User Management | High | High | Yes | Low | ★★★ |
| _AddUser1.cshtml (16K lines)_ | _Massive_ | _-_ | _Yes_ | _Low_ | _★★★★★_ |
| Enquiry/Docs | Low | Low | No | Medium | ★☆☆ |
| Payment/Finance | Low | Low | No | Medium | ★☆☆ |

---

## Key Risks

| Risk | Mitigation |
|------|-----------|
| **16K-line view** (`_AddUser1.cshtml`) | Break into 8-10 smaller components first, then port one at a time |
| **40% logic in ViewModel files** | Phase 0 extraction is non-negotiable before any MVVM migration |
| **FormsAuthentication → JWT** | Run both auth systems in parallel during transition |
| **600+ stored procedures** | Keep during migration, add API endpoints gradually |
| **Team learning curve** | Vue 3 is gentler than Angular; consider Blazor if team is C#-only |
| **Cost of AI services** | Start with free-tier Azure OpenAI + Semantic Kernel PoC before committing |

---

## Blazor vs Vue 3 Decision Matrix

| Factor | Blazor WASM | Vue 3 |
|--------|-------------|-------|
| MVVM native | Yes (C#) | Yes (Composition API) |
| Team skills | C# only | Need JS/TS |
| Bundle size | ~4MB initial | ~150KB |
| Performance | .NET WASM | Native JS |
| Ecosystem | Smaller | Massive |
| AI integration | Via API | Via API |
| Migration from MVC | Rewrite views twice (R→Blazor) | Rewrite views once (R→Vue) |
| Best for | C# teams, intranet apps | Modern web, mobile-responsive |

**Recommendation**: Vue 3 if you want a modern, fast, mobile-friendly SPA. Blazor if your team has zero JS appetite and this is strictly an internal app. Either way, the backend architecture (Phase 0) is identical.
