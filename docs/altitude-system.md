# Altitude System Design

**Altitude = Max concurrent users your code can reliably handle**

---

## The Altitude Scale

| Level | Altitude | Users | Stage | Typical Company |
|-------|----------|-------|-------|-----------------|
| GROUNDED | 0 | 0 | Broken | - |
| HANGAR | - | 1 | Dev only | Solo dev |
| RUNWAY | 0 ft | 10 | Demo-ready | Pre-launch |
| TAKEOFF | 1,000 ft | 100 | MVP live | Friends & family |
| CLIMBING | 10,000 ft | 1K | Beta users | Early adopters |
| CRUISING | 35,000 ft | 10K | Production | Seed stage |
| STRATOSPHERE | 50,000 ft | 100K | Scaling | Series A |
| KARMAN | 100 km | 1M | PMF achieved | Series B+ |
| ORBIT | 400 km | 10M | Enterprise | Unicorn |
| GEOSTATIONARY | 36,000 km | 100M | Global | Netflix tier |
| VOYAGER | ∞ | 1B+ | Interplanetary | FAANG |

---

## Category → Altitude Contribution

Each of the 12 categories contributes to maximum altitude. Think of them as rocket components - if one fails, you can't reach full altitude.

### Altitude Formula

```
MAX_ALTITUDE = BASE × MULTIPLIER

where:
  BASE = min(category_limits)  // Weakest link determines base
  MULTIPLIER = avg(category_scores) / 100  // Overall health

BOTTLENECK = category with lowest limit
```

### Category Altitude Limits

Each category has a maximum user capacity it can support before becoming a bottleneck:

| Category | Component | What Limits Scale | Max Users If Perfect |
|----------|-----------|-------------------|---------------------|
| **Database** | Fuel Tanks | Connections, queries/sec | 10M |
| **Backend** | Engines | Request handling, compute | 5M |
| **Deployment** | Staging | Deploy speed, rollback | 1M |
| **Security** | Heat Shield | Attack mitigation | 500K |
| **Error Handling** | Life Support | Graceful degradation | 500K |
| **Authentication** | Airlock | Session management | 200K |
| **API Integrations** | Comms | External API limits | 100K |
| **State Management** | Guidance | Memory, cache hits | 100K |
| **Testing** | Pre-flight | Bug escape rate | 50K |
| **Version Control** | Flight Recorder | Deploy confidence | 50K |
| **Design/UX** | Aerodynamics | Load time, UX issues | 20K |
| **Frontend** | Capsule | Bundle size, render | 10K |

### Scoring Each Category (0-100%)

Each category is scored based on what's detected:

#### Database (Fuel Tanks)
| Score | Configuration | Max Users |
|-------|---------------|-----------|
| 0-20 | SQLite / No DB | 100 |
| 20-40 | Single Postgres | 5,000 |
| 40-60 | + Connection pooling | 25,000 |
| 60-80 | + Read replica | 100,000 |
| 80-90 | + Caching layer | 500,000 |
| 90-100 | + Sharding / Multi-region | 10,000,000 |

#### Backend (Engines)
| Score | Configuration | Max Users |
|-------|---------------|-----------|
| 0-20 | No framework / Express basics | 500 |
| 20-40 | Framework + error handling | 5,000 |
| 40-60 | + Rate limiting | 25,000 |
| 60-80 | + Horizontal scaling ready | 100,000 |
| 80-90 | + Load balancer | 500,000 |
| 90-100 | + Auto-scaling + CDN | 5,000,000 |

#### Security (Heat Shield)
| Score | Configuration | Max Users |
|-------|---------------|-----------|
| 0-20 | No security measures | 50 (will get hacked) |
| 20-40 | Basic auth + HTTPS | 1,000 |
| 40-60 | + Input validation + headers | 10,000 |
| 60-80 | + Rate limiting + CSRF | 50,000 |
| 80-90 | + WAF + encryption | 200,000 |
| 90-100 | + Penetration tested + SOC2 | 500,000 |

#### Testing (Pre-flight)
| Score | Configuration | Max Users |
|-------|---------------|-----------|
| 0-20 | No tests | 100 (will break) |
| 20-40 | Some unit tests | 1,000 |
| 40-60 | + Integration tests | 5,000 |
| 60-80 | + E2E + CI/CD | 20,000 |
| 80-90 | + Mutation testing | 50,000 |
| 90-100 | + Chaos engineering | 50,000+ |

#### Deployment (Staging)
| Score | Configuration | Max Users |
|-------|---------------|-----------|
| 0-20 | Manual FTP | 100 |
| 20-40 | Git push + basic CI | 1,000 |
| 40-60 | + Staging environment | 10,000 |
| 60-80 | + Blue-green deploys | 100,000 |
| 80-90 | + Canary releases | 500,000 |
| 90-100 | + Feature flags + instant rollback | 1,000,000 |

---

## Altitude Calculation Algorithm

```typescript
interface CategoryResult {
  category: string
  score: number        // 0-100
  maxUsers: number     // Based on score tier
  bottleneck: boolean  // Is this the limiting factor?
  fixes: Fix[]         // What would increase altitude
}

interface AltitudeReport {
  currentAltitude: number      // Feet or km
  altitudeLevel: string        // CRUISING, ORBIT, etc.
  maxConcurrentUsers: number   // The key metric
  bottleneck: CategoryResult   // What's holding you back
  categories: CategoryResult[]
  toNextLevel: {
    level: string
    usersNeeded: number
    fixes: Fix[]
    estimatedHours: number
    estimatedCost: number
  }
}

function calculateAltitude(categories: CategoryResult[]): AltitudeReport {
  // Find the bottleneck (lowest maxUsers)
  const sorted = [...categories].sort((a, b) => a.maxUsers - b.maxUsers)
  const bottleneck = sorted[0]
  
  // Your altitude is limited by your weakest component
  const maxConcurrentUsers = bottleneck.maxUsers
  
  // Calculate overall score (affects multiplier)
  const avgScore = categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  
  // Apply multiplier based on overall health
  const healthMultiplier = avgScore / 100
  const effectiveUsers = Math.floor(maxConcurrentUsers * healthMultiplier)
  
  // Convert to altitude
  const altitude = usersToAltitude(effectiveUsers)
  
  return {
    currentAltitude: altitude.value,
    altitudeLevel: altitude.level,
    maxConcurrentUsers: effectiveUsers,
    bottleneck: { ...bottleneck, bottleneck: true },
    categories: categories.map(c => ({
      ...c,
      bottleneck: c.category === bottleneck.category
    })),
    toNextLevel: calculateNextLevel(effectiveUsers, categories)
  }
}

function usersToAltitude(users: number): { value: number, level: string, unit: string } {
  if (users === 0) return { value: 0, level: 'GROUNDED', unit: 'ft' }
  if (users < 10) return { value: 0, level: 'HANGAR', unit: 'ft' }
  if (users < 100) return { value: 0, level: 'RUNWAY', unit: 'ft' }
  if (users < 1000) return { value: 1000, level: 'TAKEOFF', unit: 'ft' }
  if (users < 10000) return { value: 10000, level: 'CLIMBING', unit: 'ft' }
  if (users < 100000) return { value: 35000, level: 'CRUISING', unit: 'ft' }
  if (users < 1000000) return { value: 50000, level: 'STRATOSPHERE', unit: 'ft' }
  if (users < 10000000) return { value: 100, level: 'KARMAN', unit: 'km' }
  if (users < 100000000) return { value: 400, level: 'ORBIT', unit: 'km' }
  if (users < 1000000000) return { value: 36000, level: 'GEOSTATIONARY', unit: 'km' }
  return { value: Infinity, level: 'VOYAGER', unit: 'km' }
}
```

---

## Example Report

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║  📊 ALTITUDE REPORT: github.com/startup/saas-app                              ║
║                                                                                ║
║  ═══════════════════════════════════════════════════════════════════════════  ║
║                                                                                ║
║  CURRENT ALTITUDE: 12,500 ft                                                  ║
║  LEVEL: CLIMBING ✈️                                                           ║
║  MAX USERS: ~3,200 concurrent                                                 ║
║                                                                                ║
║  ████████████░░░░░░░░░░░░░░░░░░ 32% to CRUISING (10K)                         ║
║                                                                                ║
║  ───────────────────────────────────────────────────────────────────────────  ║
║                                                                                ║
║  🔴 BOTTLENECK: Database (Fuel Tanks)                                         ║
║                                                                                ║
║  Your database is limiting altitude. Single Postgres instance                 ║
║  becomes the bottleneck around 5,000 concurrent users.                        ║
║                                                                                ║
║  ───────────────────────────────────────────────────────────────────────────  ║
║                                                                                ║
║  COMPONENT STATUS:                                                            ║
║                                                                                ║
║  Database       ███████░░░░░░░░ 45%  3,200 users   🔴 BOTTLENECK              ║
║  └─ Single Postgres, no replicas, basic pooling                              ║
║                                                                                ║
║  Backend        ██████████████░ 92%  450K users    ✅ GOOD                    ║
║  └─ Next.js API routes, rate limiting, error handling                        ║
║                                                                                ║
║  Security       ███████████░░░░ 72%  35K users     ⚠️ IMPROVE                 ║
║  └─ Auth configured, missing: CSP headers, rate limit per user               ║
║                                                                                ║
║  Deployment     █████████████░░ 85%  120K users    ✅ GOOD                    ║
║  └─ Vercel CI/CD, preview deploys, instant rollback                          ║
║                                                                                ║
║  Testing        █████░░░░░░░░░░ 35%  2K users      ⚠️ IMPROVE                 ║
║  └─ Some unit tests, no E2E, no CI test step                                 ║
║                                                                                ║
║  ───────────────────────────────────────────────────────────────────────────  ║
║                                                                                ║
║  🚀 TO REACH CRUISING (10K users):                                            ║
║                                                                                ║
║  1. Add PostgreSQL read replica                                               ║
║     └─ +6,800 users │ ~$50/mo │ 2 hours │ [Generate Config]                  ║
║                                                                                ║
║  2. Add Redis caching for hot queries                                         ║
║     └─ +15,000 users │ ~$25/mo │ 4 hours │ [Generate Code]                   ║
║                                                                                ║
║  3. Add E2E tests for critical paths                                          ║
║     └─ +3,000 users │ $0 │ 6 hours │ [Generate Tests]                        ║
║                                                                                ║
║  ═══════════════════════════════════════════════════════════════════════════  ║
║                                                                                ║
║  Total to CRUISING: 12 hours │ +$75/mo                                        ║
║                                                                                ║
║  [Complete All] [Create PR] [Download Report]                                 ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Leaderboard System

### Global Leaderboards

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  🏆 ALTITUDE LEADERBOARD                                                       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  FILTER: [All] [Web] [Mobile] [Backend] [CLI]   TIMEFRAME: [All Time] [Month] ║
║                                                                                ║
║  ───────────────────────────────────────────────────────────────────────────  ║
║                                                                                ║
║  TOP OPEN SOURCE PROJECTS                                                      ║
║                                                                                ║
║  #   Project              Altitude      Level          Max Users              ║
║  ─────────────────────────────────────────────────────────────────────────    ║
║  1.  vercel/next.js       ∞            VOYAGER        1B+      ██████████████ ║
║  2.  facebook/react       36,000 km    GEOSTATIONARY  800M     █████████████░ ║
║  3.  vitejs/vite          400 km       ORBIT          45M      ████████████░░ ║
║  4.  tailwindlabs/...     100 km       KARMAN         8M       ██████████░░░░ ║
║  5.  shadcn/ui            50,000 ft    STRATOSPHERE   320K     ████████░░░░░░ ║
║  6.  t3-oss/create-t3     35,000 ft    CRUISING       85K      ██████░░░░░░░░ ║
║  7.  your-startup/app     12,500 ft    CLIMBING       3.2K     ███░░░░░░░░░░░ ║
║                                                                                ║
║  ───────────────────────────────────────────────────────────────────────────  ║
║                                                                                ║
║  FASTEST CLIMBERS (This Week)                                                  ║
║                                                                                ║
║  #   Project              Before → After         Δ Altitude    Δ Users        ║
║  ─────────────────────────────────────────────────────────────────────────    ║
║  1.  startup/mvp          TAKEOFF → CLIMBING     +9,000 ft     +2,500         ║
║  2.  dev/side-project     RUNWAY → TAKEOFF       +1,000 ft     +90            ║
║  3.  corp/legacy-app      CLIMBING → CRUISING    +25,000 ft    +8,000         ║
║                                                                                ║
║  ───────────────────────────────────────────────────────────────────────────  ║
║                                                                                ║
║  YOUR POSITION                                                                 ║
║                                                                                ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │  your-startup/app                                                        │  ║
║  │                                                                          │  ║
║  │  Rank: #7 of 1,234 SaaS apps                                            │  ║
║  │  Altitude: 12,500 ft (CLIMBING)                                         │  ║
║  │  Top 0.5% of all scanned repos                                          │  ║
║  │                                                                          │  ║
║  │  To reach #6: Fix database bottleneck (+22,500 ft)                      │  ║
║  │                                                                          │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Category Leaderboards

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  🛡️ SECURITY LEADERBOARD (Heat Shield)                                        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  TOP SECURITY IMPLEMENTATIONS                                                  ║
║                                                                                ║
║  #   Project              Score    Features                                   ║
║  ─────────────────────────────────────────────────────────────────────────    ║
║  1.  1password/...        100%     SOC2, Zero-trust, Bug bounty, Audited     ║
║  2.  supabase/supabase    96%      Row-level security, Encryption, WAF       ║
║  3.  clerk/javascript     94%      MFA, Session encryption, RBAC             ║
║  4.  your-startup/app     72%      Auth ✓, Headers ⚠️, Rate limit ⚠️          ║
║                                                                                ║
║  YOUR GAPS:                                                                    ║
║  • Missing Content-Security-Policy header                                     ║
║  • No per-user rate limiting                                                  ║
║  • Session cookies not encrypted                                              ║
║                                                                                ║
║  [Generate Security Fixes] → Jump to rank #2 in your tier                    ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Badges & Achievements

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  🎖️ ACHIEVEMENTS                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  UNLOCKED:                                                                     ║
║                                                                                ║
║  ✈️  FIRST FLIGHT        Reached TAKEOFF for the first time                   ║
║  🧪 TEST PILOT           Added first automated tests                          ║
║  🛡️ HEAT SHIELD          Passed security audit                                ║
║  📈 CLIMBING FAST        Gained 5,000 ft in one week                          ║
║                                                                                ║
║  LOCKED:                                                                       ║
║                                                                                ║
║  🚀 ORBIT ACHIEVED       Reach ORBIT level (10M users capable)                ║
║  ⭐ VOYAGER CLASS        Reach VOYAGER level (1B+ users)                      ║
║  🔒 ZERO VULN            Pass security scan with 0 vulnerabilities            ║
║  🧪 100% COVERAGE        Achieve 100% test coverage                           ║
║  ⚡ SPEED DEMON          Response time <100ms p99                             ║
║  🌍 GLOBAL REACH         Multi-region deployment                              ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Database Schema for Leaderboard

```sql
-- Altitude snapshots (historical tracking)
CREATE TABLE altitude_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repos(id),
  
  -- Core metrics
  altitude_feet INTEGER NOT NULL,
  altitude_level TEXT NOT NULL,  -- CLIMBING, CRUISING, ORBIT, etc.
  max_concurrent_users INTEGER NOT NULL,
  
  -- Category scores
  category_scores JSONB NOT NULL,
  bottleneck_category TEXT NOT NULL,
  
  -- Computed rankings
  global_rank INTEGER,
  category_rank INTEGER,  -- Rank within same project type
  percentile DECIMAL(5,2),  -- Top X%
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for leaderboard queries
  @@index([altitude_feet DESC, created_at DESC])
  @@index([altitude_level, created_at DESC])
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repos(id),
  
  achievement_type TEXT NOT NULL,  -- FIRST_FLIGHT, ORBIT_ACHIEVED, etc.
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Context when achieved
  altitude_when_achieved INTEGER,
  snapshot_id UUID REFERENCES altitude_snapshots(id),
  
  UNIQUE(repo_id, achievement_type)
);

-- Leaderboard views
CREATE MATERIALIZED VIEW leaderboard_global AS
SELECT 
  r.id as repo_id,
  r.full_name,
  r.category,
  s.altitude_feet,
  s.altitude_level,
  s.max_concurrent_users,
  ROW_NUMBER() OVER (ORDER BY s.altitude_feet DESC) as rank,
  PERCENT_RANK() OVER (ORDER BY s.altitude_feet) * 100 as percentile
FROM repos r
JOIN LATERAL (
  SELECT * FROM altitude_snapshots 
  WHERE repo_id = r.id 
  ORDER BY created_at DESC 
  LIMIT 1
) s ON true
WHERE r.is_public = true;

-- Fastest climbers this week
CREATE VIEW fastest_climbers_week AS
SELECT 
  r.full_name,
  old.altitude_feet as altitude_before,
  new.altitude_feet as altitude_after,
  new.altitude_feet - old.altitude_feet as altitude_gain,
  new.max_concurrent_users - old.max_concurrent_users as users_gain
FROM repos r
JOIN altitude_snapshots old ON old.repo_id = r.id 
  AND old.created_at >= NOW() - INTERVAL '7 days'
JOIN altitude_snapshots new ON new.repo_id = r.id 
  AND new.created_at >= NOW() - INTERVAL '1 day'
WHERE new.altitude_feet > old.altitude_feet
ORDER BY altitude_gain DESC
LIMIT 100;
```

---

## API Endpoints

```typescript
// GET /api/leaderboard
interface LeaderboardRequest {
  category?: 'web' | 'mobile' | 'backend' | 'cli' | 'all'
  timeframe?: 'all' | 'month' | 'week'
  limit?: number
  offset?: number
}

interface LeaderboardResponse {
  entries: {
    rank: number
    repo: {
      owner: string
      name: string
      fullName: string
    }
    altitude: {
      feet: number
      level: string
      maxUsers: number
    }
    change?: {
      rankDelta: number
      altitudeDelta: number
    }
  }[]
  userPosition?: {
    rank: number
    percentile: number
    toNextRank: {
      repo: string
      altitudeNeeded: number
      suggestedFixes: Fix[]
    }
  }
}

// GET /api/leaderboard/climbers
// Returns fastest improving repos

// GET /api/achievements/:repoId
// Returns unlocked and available achievements

// GET /api/altitude/:repoId/history
// Returns altitude over time for charting
```

---

## Gamification Elements

### Progress Bars
- Show % to next level
- Celebrate level-ups with animation

### Streaks
- "7-day altitude streak" for consistent improvement
- "Green streak" for days without security vulns

### Competitions
- Weekly "Climb Challenge" for most improvement
- Monthly "Security Sprint"

### Social
- Share altitude badges
- "View repos at my altitude"
- "Compare with competitor"

