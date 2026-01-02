'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// =============================================================================
// TYPES
// =============================================================================

type AltitudeLevel = 
  | 'GROUNDED' 
  | 'HANGAR' 
  | 'RUNWAY' 
  | 'TAKEOFF' 
  | 'CLIMBING' 
  | 'CRUISING' 
  | 'STRATOSPHERE' 
  | 'KARMAN' 
  | 'ORBIT' 
  | 'GEOSTATIONARY' 
  | 'VOYAGER'

interface CategoryStatus {
  id: string
  name: string
  component: string // Rocket part name
  score: number
  maxUsers: number
  status: 'checking' | 'good' | 'warning' | 'critical' | 'bottleneck'
  icon: string
}

interface AltitudeReport {
  level: AltitudeLevel
  altitudeValue: number
  altitudeUnit: 'ft' | 'km'
  maxUsers: number
  categories: CategoryStatus[]
  bottleneck: string
  percentToNext: number
  nextLevel: AltitudeLevel
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ALTITUDE_LEVELS: Record<AltitudeLevel, { 
  color: string
  bgColor: string
  description: string
  emoji: string
}> = {
  GROUNDED: { color: 'text-red-500', bgColor: 'bg-red-500/20', description: 'Critical issues', emoji: '🚫' },
  HANGAR: { color: 'text-gray-400', bgColor: 'bg-gray-500/20', description: 'Development only', emoji: '🔧' },
  RUNWAY: { color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', description: 'Ready to launch', emoji: '🛫' },
  TAKEOFF: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', description: 'Just launched', emoji: '✈️' },
  CLIMBING: { color: 'text-blue-400', bgColor: 'bg-blue-400/20', description: 'Gaining altitude', emoji: '📈' },
  CRUISING: { color: 'text-blue-500', bgColor: 'bg-blue-500/20', description: 'Production stable', emoji: '✈️' },
  STRATOSPHERE: { color: 'text-indigo-500', bgColor: 'bg-indigo-500/20', description: 'Scaling up', emoji: '🌤️' },
  KARMAN: { color: 'text-purple-500', bgColor: 'bg-purple-500/20', description: 'Edge of space', emoji: '🌍' },
  ORBIT: { color: 'text-violet-500', bgColor: 'bg-violet-500/20', description: 'In orbit', emoji: '🛰️' },
  GEOSTATIONARY: { color: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500/20', description: 'Global coverage', emoji: '🌐' },
  VOYAGER: { color: 'text-amber-400', bgColor: 'bg-amber-400/20', description: 'Interplanetary', emoji: '🚀' },
}

// Map categories to rocket parts (from bottom to top)
const ROCKET_PARTS: { id: string; name: string; component: string; icon: string }[] = [
  { id: 'testing', name: 'Testing', component: 'Pre-flight', icon: '🧪' },
  { id: 'backend', name: 'Backend', component: 'Engines', icon: '⚙️' },
  { id: 'deployment', name: 'Deployment', component: 'Staging', icon: '🚀' },
  { id: 'database', name: 'Database', component: 'Fuel Tanks', icon: '💾' },
  { id: 'designUx', name: 'Design/UX', component: 'Aerodynamics', icon: '🎨' },
  { id: 'versionControl', name: 'Version Control', component: 'Flight Recorder', icon: '📝' },
  { id: 'security', name: 'Security', component: 'Heat Shield', icon: '🛡️' },
  { id: 'errorHandling', name: 'Error Handling', component: 'Life Support', icon: '⚠️' },
  { id: 'authentication', name: 'Auth', component: 'Airlock', icon: '🔐' },
  { id: 'apiIntegrations', name: 'API Integrations', component: 'Comms', icon: '🔌' },
  { id: 'stateManagement', name: 'State Mgmt', component: 'Guidance', icon: '📊' },
  { id: 'frontend', name: 'Frontend', component: 'Capsule', icon: '🖥️' },
]

// =============================================================================
// ROCKET VISUALIZATION COMPONENT
// =============================================================================

export function RocketVisualization({ 
  report, 
  isAnalyzing = false,
  analyzingCategory = null 
}: { 
  report: AltitudeReport | null
  isAnalyzing?: boolean
  analyzingCategory?: string | null
}) {
  const levelInfo = report ? ALTITUDE_LEVELS[report.level] : ALTITUDE_LEVELS.HANGAR
  
  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Altitude Display */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isAnalyzing ? (
          <div className="text-xl text-gray-400">Calculating altitude...</div>
        ) : report && (
          <>
            <div className={`text-5xl font-bold ${levelInfo.color}`}>
              {report.altitudeValue.toLocaleString()} {report.altitudeUnit}
            </div>
            <div className={`text-2xl font-semibold mt-2 ${levelInfo.color}`}>
              {levelInfo.emoji} {report.level}
            </div>
            <div className="text-gray-400 mt-1">
              Max {report.maxUsers.toLocaleString()} concurrent users
            </div>
          </>
        )}
      </motion.div>

      {/* Rocket SVG */}
      <div className="relative w-48 h-96">
        <RocketSVG 
          categories={report?.categories || []}
          isAnalyzing={isAnalyzing}
          analyzingCategory={analyzingCategory}
          bottleneck={report?.bottleneck}
        />
      </div>

      {/* Progress to Next Level */}
      {report && report.level !== 'VOYAGER' && (
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{report.level}</span>
            <span>{report.percentToNext}% to {report.nextLevel}</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${levelInfo.bgColor} ${levelInfo.color.replace('text-', 'bg-')}`}
              initial={{ width: 0 }}
              animate={{ width: `${report.percentToNext}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {/* Bottleneck Alert */}
      {report?.bottleneck && (
        <motion.div 
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-red-400 font-semibold flex items-center gap-2">
            <span>🔴</span>
            <span>Bottleneck: {report.bottleneck}</span>
          </div>
          <div className="text-gray-400 text-sm mt-1">
            This component is limiting your altitude
          </div>
        </motion.div>
      )}
    </div>
  )
}

// =============================================================================
// ROCKET SVG COMPONENT
// =============================================================================

function RocketSVG({ 
  categories, 
  isAnalyzing,
  analyzingCategory,
  bottleneck 
}: { 
  categories: CategoryStatus[]
  isAnalyzing: boolean
  analyzingCategory: string | null
  bottleneck?: string
}) {
  const getPartColor = (partId: string) => {
    if (isAnalyzing) {
      if (analyzingCategory === partId) return 'fill-blue-400 animate-pulse'
      const partIndex = ROCKET_PARTS.findIndex(p => p.id === partId)
      const analyzeIndex = ROCKET_PARTS.findIndex(p => p.id === analyzingCategory)
      if (analyzeIndex > partIndex) return 'fill-emerald-500'
      return 'fill-gray-700'
    }
    
    const cat = categories.find(c => c.id === partId)
    if (!cat) return 'fill-gray-700'
    
    if (cat.id === bottleneck) return 'fill-red-500'
    if (cat.status === 'good') return 'fill-emerald-500'
    if (cat.status === 'warning') return 'fill-yellow-500'
    if (cat.status === 'critical') return 'fill-red-500'
    return 'fill-gray-600'
  }

  return (
    <svg viewBox="0 0 100 200" className="w-full h-full">
      {/* Flames (only when not grounded) */}
      {!isAnalyzing && categories.length > 0 && (
        <g className="animate-pulse">
          <ellipse cx="50" cy="195" rx="15" ry="8" className="fill-orange-500/60" />
          <ellipse cx="50" cy="192" rx="10" ry="6" className="fill-yellow-400/80" />
          <ellipse cx="50" cy="189" rx="6" ry="4" className="fill-white/60" />
        </g>
      )}

      {/* Launchpad */}
      <rect x="20" y="185" width="60" height="5" className="fill-gray-600" rx="1" />
      
      {/* Pre-flight / Testing (base) */}
      <rect x="30" y="175" width="40" height="10" className={getPartColor('testing')} rx="2" />
      
      {/* Engines / Backend */}
      <g className={getPartColor('backend')}>
        <rect x="35" y="160" width="30" height="15" rx="2" />
        <circle cx="42" cy="172" r="4" className="fill-gray-900" />
        <circle cx="50" cy="172" r="4" className="fill-gray-900" />
        <circle cx="58" cy="172" r="4" className="fill-gray-900" />
      </g>
      
      {/* Staging / Deployment */}
      <rect x="33" y="145" width="34" height="15" className={getPartColor('deployment')} rx="2" />
      
      {/* Fuel Tanks / Database */}
      <rect x="35" y="110" width="30" height="35" className={getPartColor('database')} rx="3" />
      
      {/* Aerodynamics / Design */}
      <path d="M35 110 L30 115 L30 130 L35 135 L35 110" className={getPartColor('designUx')} />
      <path d="M65 110 L70 115 L70 130 L65 135 L65 110" className={getPartColor('designUx')} />
      
      {/* Flight Recorder / Version Control */}
      <rect x="38" y="100" width="24" height="10" className={getPartColor('versionControl')} rx="1" />
      
      {/* Heat Shield / Security */}
      <rect x="36" y="85" width="28" height="15" className={getPartColor('security')} rx="2" />
      
      {/* Life Support / Error Handling */}
      <rect x="38" y="72" width="24" height="13" className={getPartColor('errorHandling')} rx="2" />
      
      {/* Airlock / Auth */}
      <rect x="40" y="62" width="20" height="10" className={getPartColor('authentication')} rx="2" />
      
      {/* Comms / API Integrations */}
      <rect x="42" y="52" width="16" height="10" className={getPartColor('apiIntegrations')} rx="1" />
      
      {/* Guidance / State Management */}
      <rect x="44" y="42" width="12" height="10" className={getPartColor('stateManagement')} rx="1" />
      
      {/* Capsule / Frontend */}
      <path 
        d="M50 15 L58 42 L42 42 Z" 
        className={getPartColor('frontend')} 
      />
      
      {/* Capsule window */}
      <circle cx="50" cy="32" r="4" className="fill-gray-900" />
      <circle cx="50" cy="32" r="3" className="fill-blue-400/30" />
    </svg>
  )
}

// =============================================================================
// CATEGORY LIST COMPONENT
// =============================================================================

export function CategoryList({ 
  categories,
  onFix 
}: { 
  categories: CategoryStatus[]
  onFix?: (categoryId: string) => void
}) {
  return (
    <div className="space-y-2">
      {ROCKET_PARTS.slice().reverse().map((part) => {
        const cat = categories.find(c => c.id === part.id)
        const score = cat?.score || 0
        const isBottleneck = cat?.status === 'bottleneck'
        
        return (
          <motion.div
            key={part.id}
            className={`
              flex items-center justify-between p-3 rounded-lg
              ${isBottleneck ? 'bg-red-500/10 border border-red-500/30' : 'bg-gray-800/50'}
            `}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{part.icon}</span>
              <div>
                <div className="font-medium text-gray-200">
                  {part.name}
                  {isBottleneck && (
                    <span className="ml-2 text-xs text-red-400 font-normal">
                      BOTTLENECK
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{part.component}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Score bar */}
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    score >= 80 ? 'bg-emerald-500' :
                    score >= 60 ? 'bg-yellow-500' :
                    score >= 40 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-sm text-gray-400 w-12 text-right">
                {score}%
              </span>
              
              {/* Max users */}
              <span className="text-sm text-gray-500 w-20 text-right">
                {cat?.maxUsers ? `${(cat.maxUsers / 1000).toFixed(0)}K` : '-'}
              </span>
              
              {/* Fix button for low scores */}
              {score < 80 && onFix && (
                <button
                  onClick={() => onFix(part.id)}
                  className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                >
                  Fix
                </button>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// =============================================================================
// LEADERBOARD COMPONENT
// =============================================================================

interface LeaderboardEntry {
  rank: number
  name: string
  altitude: number
  altitudeUnit: 'ft' | 'km'
  level: AltitudeLevel
  maxUsers: number
  isCurrentUser?: boolean
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
          <span>🏆</span> Altitude Leaderboard
        </h3>
      </div>
      
      <div className="divide-y divide-gray-800">
        {entries.map((entry) => {
          const levelInfo = ALTITUDE_LEVELS[entry.level]
          
          return (
            <motion.div
              key={entry.rank}
              className={`
                flex items-center justify-between p-4
                ${entry.isCurrentUser ? 'bg-blue-500/10' : ''}
              `}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold
                  ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                    entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gray-700 text-gray-400'}
                `}>
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                </div>
                
                {/* Name */}
                <div>
                  <div className={`font-medium ${entry.isCurrentUser ? 'text-blue-400' : 'text-gray-200'}`}>
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs text-blue-400">(You)</span>
                    )}
                  </div>
                  <div className={`text-sm ${levelInfo.color}`}>
                    {levelInfo.emoji} {entry.level}
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="text-right">
                <div className={`font-bold ${levelInfo.color}`}>
                  {entry.altitude.toLocaleString()} {entry.altitudeUnit}
                </div>
                <div className="text-sm text-gray-500">
                  {entry.maxUsers >= 1000000 
                    ? `${(entry.maxUsers / 1000000).toFixed(1)}M users`
                    : entry.maxUsers >= 1000
                    ? `${(entry.maxUsers / 1000).toFixed(0)}K users`
                    : `${entry.maxUsers} users`
                  }
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// DEMO COMPONENT
// =============================================================================

export function AltitudeDemo() {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analyzingIndex, setAnalyzingIndex] = useState(0)
  const [report, setReport] = useState<AltitudeReport | null>(null)

  // Simulate analysis
  useEffect(() => {
    if (!isAnalyzing) return
    
    const interval = setInterval(() => {
      setAnalyzingIndex(prev => {
        if (prev >= ROCKET_PARTS.length - 1) {
          setIsAnalyzing(false)
          // Set final report
          setReport({
            level: 'CLIMBING',
            altitudeValue: 12500,
            altitudeUnit: 'ft',
            maxUsers: 3200,
            percentToNext: 32,
            nextLevel: 'CRUISING',
            bottleneck: 'database',
            categories: ROCKET_PARTS.map(p => ({
              id: p.id,
              name: p.name,
              component: p.component,
              icon: p.icon,
              score: p.id === 'database' ? 45 : 
                     p.id === 'testing' ? 35 :
                     p.id === 'security' ? 72 :
                     Math.floor(Math.random() * 20) + 75,
              maxUsers: p.id === 'database' ? 3200 : 
                        p.id === 'testing' ? 2000 :
                        50000 + Math.floor(Math.random() * 100000),
              status: p.id === 'database' ? 'bottleneck' :
                      p.id === 'testing' ? 'warning' :
                      p.id === 'security' ? 'warning' :
                      'good'
            }))
          })
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 300)
    
    return () => clearInterval(interval)
  }, [isAnalyzing])

  const demoLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'vercel/next.js', altitude: Infinity, altitudeUnit: 'km', level: 'VOYAGER', maxUsers: 1000000000 },
    { rank: 2, name: 'facebook/react', altitude: 36000, altitudeUnit: 'km', level: 'GEOSTATIONARY', maxUsers: 800000000 },
    { rank: 3, name: 'vitejs/vite', altitude: 400, altitudeUnit: 'km', level: 'ORBIT', maxUsers: 45000000 },
    { rank: 7, name: 'your-startup/app', altitude: 12500, altitudeUnit: 'ft', level: 'CLIMBING', maxUsers: 3200, isCurrentUser: true },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🚀 Altitude System Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rocket Visualization */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <RocketVisualization 
              report={report}
              isAnalyzing={isAnalyzing}
              analyzingCategory={isAnalyzing ? ROCKET_PARTS[analyzingIndex]?.id : null}
            />
          </div>
          
          {/* Category Breakdown */}
          <div className="space-y-6">
            {report && (
              <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Component Status</h3>
                <CategoryList 
                  categories={report.categories}
                  onFix={(id) => alert(`Generating fixes for ${id}...`)}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Leaderboard */}
        <div className="mt-8">
          <Leaderboard entries={demoLeaderboard} />
        </div>
        
        {/* Reset button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsAnalyzing(true)
              setAnalyzingIndex(0)
              setReport(null)
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Run Analysis Again
          </button>
        </div>
      </div>
    </div>
  )
}

