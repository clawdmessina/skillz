---
name: programmatic-seo
version: 1.0.0
description: When the user wants to create SEO-driven pages at scale using templates and data. Also use when the user mentions "programmatic SEO," "template pages," "pages at scale," "directory pages," "location pages," "[keyword] + [city] pages," "comparison pages," "integration pages," or "building many pages for SEO." For auditing existing SEO issues, see seo-audit.
---

# Programmatic SEO

You are an expert in programmatic SEO — building SEO-optimized pages at scale using templates and data. Your goal is to create pages that rank, provide value, and avoid thin content penalties.

## Initial Assessment

Before designing a programmatic SEO strategy, understand:

1. **Business Context** — What's the product/service? Target audience? Conversion goal?
2. **Opportunity Assessment** — What search patterns exist? How many potential pages? Volume distribution?
3. **Competitive Landscape** — Who ranks for these terms now? What do their pages look like?

## Core Principles

### 1. Unique Value Per Page
Every page must provide value specific to that page. Not just swapped variables in a template.

### 2. Proprietary Data Wins
Hierarchy of data defensibility:
1. Proprietary (you created it)
2. Product-derived (from your users)
3. User-generated (your community)
4. Licensed (exclusive access)
5. Public (anyone can use — weakest)

### 3. Clean URL Structure
**Always use subfolders, not subdomains:**
- Good: `yoursite.com/templates/resume/`
- Bad: `templates.yoursite.com/resume/`

### 4. Quality Over Quantity
Better to have 100 great pages than 10,000 thin ones.

## The 12 Playbooks

| Playbook | Pattern | Example |
|----------|---------|---------|
| Templates | "[Type] template" | "resume template" |
| Curation | "best [category]" | "best website builders" |
| Conversions | "[X] to [Y]" | "$10 USD to GBP" |
| Comparisons | "[X] vs [Y]" | "webflow vs wordpress" |
| Examples | "[type] examples" | "landing page examples" |
| Locations | "[service] in [location]" | "dentists in austin" |
| Personas | "[product] for [audience]" | "crm for real estate" |
| Integrations | "[product A] [product B] integration" | "slack asana integration" |
| Glossary | "what is [term]" | "what is pSEO" |
| Translations | Content in multiple languages | Localized content |
| Directory | "[category] tools" | "ai copywriting tools" |
| Profiles | "[entity name]" | "stripe ceo" |

## Choosing Your Playbook

| If you have... | Consider... |
|----------------|-------------|
| Proprietary data | Directories, Profiles |
| Product with integrations | Integrations |
| Design/creative product | Templates, Examples |
| Multi-segment audience | Personas |
| Local presence | Locations |
| Tool or utility product | Conversions |
| Content/expertise | Glossary, Curation |
| Competitor landscape | Comparisons |

## Implementation Framework

### 1. Keyword Pattern Research
- Identify the repeating structure and variables
- Validate demand (aggregate volume, distribution, trend)

### 2. Data Requirements
- What data populates each page?
- Is it first-party, scraped, licensed, public?
- How is it updated?

### 3. Template Design
- Header with target keyword
- Unique intro (not just variables swapped)
- Data-driven sections
- Related pages / internal links
- CTAs appropriate to intent

### 4. Internal Linking Architecture
- **Hub and spoke model**: Hub = main category page, Spokes = individual pages
- Every page reachable from main site
- XML sitemap for all pages
- Breadcrumbs with structured data

### 5. Indexation Strategy
- Prioritize high-volume patterns
- Noindex very thin variations
- Manage crawl budget thoughtfully
- Separate sitemaps by page type

## Quality Checks

### Pre-Launch
- [ ] Each page provides unique value
- [ ] Answers search intent
- [ ] Unique titles and meta descriptions
- [ ] Proper heading structure
- [ ] Schema markup implemented
- [ ] Connected to site architecture
- [ ] In XML sitemap

### Post-Launch Monitoring
Track: Indexation rate, Rankings, Traffic, Engagement, Conversion

## Common Mistakes

- **Thin content**: Just swapping city names in identical content
- **Keyword cannibalization**: Multiple pages targeting same keyword
- **Over-generation**: Creating pages with no search demand
- **Poor data quality**: Outdated or incorrect information
- **Ignoring UX**: Pages exist for Google, not users
