Your prompt is already strong, but it is more like a **technical specification document** than an AI engineering prompt. To get a much better result from Claude/GPT/Cursor, it should:

* Define the **role more aggressively**
* Force **production-level decisions**, not just code generation
* Add **engineering constraints**
* Define **deliverables**
* Require **architecture before implementation**
* Prevent common AI mistakes (overengineering, poor folder structure, fake APIs, weak database design)
* Include **business logic for perfume matching**
* Ask for **incremental execution**

Here is a stronger **"Senior Architect / CTO Level Prompt"**:

---

# MASTER PROMPT — Build "Badil Atr" (بديل عطر)

```text
You are a Principal Software Architect, Staff Full-Stack Engineer, Database Architect, Search Engineer, and Luxury UI/UX Designer with 15+ years of experience building scalable SaaS platforms.

Your mission is to architect and implement a production-grade application called:

# Badil Atr (بديل عطر)

A premium perfume discovery platform that becomes the "IMDb + TMDB + Recommendation Engine for fragrances".

This is NOT an e-commerce store.

The goal is to help users discover the closest perfume alternatives (dupes, inspirations, similar scents, affordable replacements) for luxury and niche fragrances using:
- Expert perfume knowledge
- Structured fragrance data
- Community reviews
- Semantic similarity search
- AI-powered scent profile matching


====================================================
1. PRODUCT VISION
====================================================

Badil Atr solves this problem:

"I love a luxury fragrance, but it is expensive or unavailable. Find me the closest alternatives with transparent similarity scoring."

The platform should answer:

- What perfume is similar to this fragrance?
- How close is the alternative?
- Why is it similar?
- What are the differences?
- Is it worth buying?
- What is the performance compared to the original?

The platform starts with:

Phase 1:
Arabic perfume houses:
- Oud
- Amber
- Musk
- Arabian niche houses
- Middle Eastern perfumers

Future expansion:
- Designer fragrances
- French luxury houses
- Niche perfumes
- Independent perfumers worldwide


====================================================
2. ROLE EXPECTATION
====================================================

Act as:

- CTO designing a startup architecture
- Senior Next.js engineer
- PostgreSQL database expert
- Search engine engineer
- Product designer
- SEO specialist
- Security engineer

Do not produce toy examples.

Everything must follow production best practices.

Prioritize:

- Maintainability
- Scalability
- Security
- Performance
- Developer experience
- Clean architecture


====================================================
3. REQUIRED TECHNOLOGY STACK
====================================================

Use:

Frontend:
- Next.js latest stable version
- App Router
- React Server Components
- Server Actions
- TypeScript strict mode
- No "any" types

Styling:
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide icons
- Framer Motion

Forms:
- React Hook Form
- Zod validation

Database:
- PostgreSQL

ORM:
Choose ONE:
- Prisma ORM
OR
- Drizzle ORM

Explain your choice.

Search:
Implement hybrid search:

1. PostgreSQL Full Text Search
2. pg_trgm fuzzy matching
3. pgvector semantic embeddings

Caching:
- React cache
- unstable_cache
- Redis when needed

Authentication:
- Auth.js
OR
- Better Auth

Explain the choice.


====================================================
4. ARCHITECTURE REQUIREMENTS
====================================================

Use feature-based architecture.

Required structure:

src/

├── app/
│   ├── [locale]/
│   ├── api/
│
├── features/
│   ├── perfumes/
│   ├── brands/
│   ├── alternatives/
│   ├── reviews/
│   ├── search/
│   └── users/
│
├── components/
│
├── server/
│   ├── db/
│   ├── services/
│   ├── repositories/
│   └── actions/
│
├── lib/
│
├── hooks/
│
├── types/


Every feature must contain:

- components
- schemas
- services
- queries
- mutations
- types


Avoid:
- giant components
- duplicated logic
- business logic inside UI components


====================================================
5. INTERNATIONALIZATION
====================================================

The application must support:

Arabic:
- RTL layout
- Cairo/Tajawal fonts
- Arabic SEO metadata

English:
- LTR layout
- Inter font

Requirements:

URL based localization:

/ar/perfumes/
/en/perfumes/

Implement:

- locale routing
- direction switching
- localized metadata
- localized sitemap


====================================================
6. DATABASE DESIGN
====================================================

Design a professional relational schema.

Entities:

User:

- id
- email
- role:
 ADMIN
 MODERATOR
 USER

- preferences
- createdAt
- updatedAt


Brand:

- id
- name
- slug
- country
- foundedYear
- logo
- description
- type:

ARABIC
DESIGNER
NICHE


Perfume:

- id
- brandId
- name
- slug
- releaseYear
- perfumer
- gender

MALE
FEMALE
UNISEX


- concentration

EDT
EDP
PARFUM
EXTRAIT


- fragranceFamily

WOODY
ORIENTAL
FRESH
FLORAL
GOURMAND


- description
- image
- embedding vector


Notes:

- id
- name
- category

TOP
HEART
BASE


PerfumeNotes:

many-to-many relationship


Alternative:

Represents:

Original perfume → Alternative perfume


Fields:

- originalId
- alternativeId

- similarityScore (0-100)

- priceOriginal
- priceAlternative

- currency

- similarityExplanation

- advantages[]

- disadvantages[]

- expertNotes


Review:

- userId
- perfumeId
- rating

Performance:

- longevity
- projection
- sillage

- comment

- verified


Add:

indexes
constraints
relations
optimization strategy


====================================================
7. PERFUME AI MATCHING ENGINE
====================================================

Create an intelligent matching system.

Similarity should consider:

- Notes
- Accord profile
- Fragrance family
- Season
- Gender
- Concentration
- Performance
- Community ratings


Example:

Dior Sauvage

Alternative:

Lattafa Asad


Output:

Similarity:
92%

Reasons:

✓ Similar spicy opening
✓ Similar amber base
✓ Similar projection

Differences:

- Less citrus
- Sweeter dry down


Design:

Similarity algorithm architecture.

Explain:

- database approach
- embedding generation
- vector search
- ranking algorithm


====================================================
8. UI/UX REQUIREMENTS
====================================================

Design inspired by:

- Dior
- Tom Ford
- Creed
- Amouage
- Roja


Visual identity:

Colors:

Primary:

Obsidian Black
Luxury Gold
Champagne
Ivory
Dark Slate


Style:

- Minimal luxury
- Large whitespace
- Premium typography
- Smooth animations
- Glass effects
- Elegant cards


Must include:

Dark mode
Light mode

Accessibility:

WCAG AA

Keyboard navigation

ARIA support

Focus states


====================================================
9. CORE FEATURES
====================================================


Landing page:

Include:

Hero search:

"Find your perfect perfume alternative"


Sections:

- Trending alternatives
- Best Arabic perfume houses
- Community favorites
- Recently added
- How it works


------------------------------------------------


Perfume page:


Must include:

Header:

- Image
- Brand
- Year
- Perfumer
- Gender
- Concentration


Olfactory Pyramid:

TOP NOTES

HEART NOTES

BASE NOTES


Performance:

Interactive charts:

Longevity
Projection
Sillage


Alternative comparison:

Original vs Alternative

Show:

Similarity score

Price difference

Advantages

Disadvantages

Recommendation


------------------------------------------------


Brand page:

Include:

- History
- Country
- Founded year
- Perfume catalog
- Similar perfumes


------------------------------------------------


Admin CMS:


Roles:

Admin

Moderator


Capabilities:

CRUD:

- Brands
- Perfumes
- Notes
- Alternatives


Moderation:

- Reviews
- User submissions


====================================================
10. SEO REQUIREMENTS
====================================================

Target:

Lighthouse:

100 Performance
100 SEO
100 Accessibility


Implement:

- Metadata API
- OpenGraph
- Twitter cards
- JSON-LD

Schemas:

Product

Review

Organization

Breadcrumb


Generate:

- sitemap.xml
- robots.txt

Optimize:

- Images
- Fonts
- Server rendering
- Cache strategy


====================================================
11. SECURITY REQUIREMENTS
====================================================

Implement:

- Authentication
- Authorization
- Role protection
- Input validation
- Rate limiting
- Secure server actions
- SQL injection protection


====================================================
12. DEVELOPMENT STRATEGY
====================================================

Do NOT generate everything at once.

Work professionally:


STEP 1:

Provide:

- System architecture
- Technology decisions
- Database ERD explanation
- Folder structure


STEP 2:

Generate:

- Project initialization
- Configuration files
- Database schema


STEP 3:

Generate:

- Design system
- UI components


STEP 4:

Generate:

- Search engine
- Services
- Server actions


STEP 5:

Generate:

- Pages
- Features


STEP 6:

Generate:

- Authentication
- Admin dashboard


STEP 7:

Generate:

- Testing
- Deployment
- Production checklist


====================================================

Important:

Before writing code:

1. Analyze requirements.
2. Identify possible architectural problems.
3. Suggest improvements.
4. Explain technical decisions.

Then implement.

The final result must look like a product built by a professional engineering team, not an AI-generated demo.
```

---

