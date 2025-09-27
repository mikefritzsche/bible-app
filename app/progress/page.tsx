'use client'

import { useState, useEffect } from 'react'
import {
  Flame,
  Crown,
  Medal,
  Trophy,
  BookOpenCheck,
  Sparkles,
  type LucideIcon
} from 'lucide-react'
import { EnhancedReadingPlanManager, READING_PLANS, type ReadingPlanType } from '@/lib/ReadingPlanManagerEnhanced'
import { ReadingPlanManager } from '@/lib/ReadingPlanManager'

interface CombinedStatistics {
  currentStreak: number
  longestStreak: number
  totalDaysRead: number
  completionRate: number
  percentComplete: number
  planSpecificStats: Map<string, any>
}

interface ReadingHistoryItem {
  date: string
  readings: string[]
  planId: string
}

export default function ProgressPage() {
  const [enhancedManager] = useState(() => new EnhancedReadingPlanManager())
  const [basicManager] = useState(() => new ReadingPlanManager())
  const [statistics, setStatistics] = useState<CombinedStatistics | null>(null)
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([])
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlanType | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'overview' | 'calendar' | 'achievements'>('overview')

  useEffect(() => {
    loadAllStatistics()
  }, [selectedPlan])

  const loadAllStatistics = async () => {
    setLoading(true)
    await enhancedManager.init()
    await basicManager.init()

    if (selectedPlan === 'all') {
      // Aggregate statistics from all plans
      const stats: CombinedStatistics = {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysRead: 0,
        completionRate: 0,
        percentComplete: 0,
        planSpecificStats: new Map()
      }

      // Get basic plan stats
      const basicStats = await basicManager.getStatistics()
      stats.planSpecificStats.set('psalms-proverbs-basic', basicStats)

      // Get enhanced plan stats
      for (const plan of READING_PLANS) {
        const planStats = await enhancedManager.getStatistics(plan.id)
        stats.planSpecificStats.set(plan.id, planStats)
        
        // Aggregate totals
        stats.currentStreak = Math.max(stats.currentStreak, planStats.currentStreak)
        stats.longestStreak = Math.max(stats.longestStreak, planStats.longestStreak)
        stats.totalDaysRead += planStats.totalDaysRead
      }

      // Calculate overall completion rate
      const totalStats = Array.from(stats.planSpecificStats.values())
      stats.completionRate = Math.round(
        totalStats.reduce((acc, s) => acc + s.completionRate, 0) / totalStats.length
      )

      setStatistics(stats)
    } else {
      // Get statistics for specific plan
      const planStats = await enhancedManager.getStatistics(selectedPlan)
      setStatistics({
        ...planStats,
        planSpecificStats: new Map([[selectedPlan, planStats]])
      })
    }

    // Load reading history
    await loadReadingHistory()
    setLoading(false)
  }

  const loadReadingHistory = async () => {
    // This would load actual reading history from IndexedDB
    // For now, we'll create sample data
    const history: ReadingHistoryItem[] = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      // Simulate some reading history
      if (Math.random() > 0.3) {
        history.push({
          date: dateStr,
          readings: ['Psalm ' + (i + 1), 'Proverbs ' + ((i % 31) + 1)],
          planId: 'psalms-proverbs'
        })
      }
    }
    
    setReadingHistory(history.reverse())
  }

  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-gray-500 dark:text-gray-400'
    if (streak < 7) return 'text-blue-600 dark:text-blue-400'
    if (streak < 30) return 'text-purple-600 dark:text-purple-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getAchievements = () => {
    if (!statistics) return []
    
    const achievements: Array<{
      title: string
      description: string
      icon: LucideIcon
      colorClass: string
      unlocked: boolean
    }> = []
    
    if (statistics.currentStreak >= 7) {
      achievements.push({ 
        title: 'Week Warrior', 
        description: '7 day streak!',
        icon: Flame as LucideIcon,
        colorClass: 'text-amber-500 dark:text-amber-400',
        unlocked: true 
      })
    }
    
    if (statistics.currentStreak >= 30) {
      achievements.push({ 
        title: 'Monthly Master', 
        description: '30 day streak!',
        icon: Crown as LucideIcon,
        colorClass: 'text-yellow-500 dark:text-yellow-400',
        unlocked: true 
      })
    }
    
    if (statistics.totalDaysRead >= 100) {
      achievements.push({ 
        title: 'Century Reader', 
        description: '100 days of reading',
        icon: Medal as LucideIcon,
        colorClass: 'text-blue-500 dark:text-blue-400',
        unlocked: true 
      })
    }
    
    if (statistics.longestStreak >= 50) {
      achievements.push({ 
        title: 'Consistency Champion', 
        description: '50 day streak achieved',
        icon: Trophy as LucideIcon,
        colorClass: 'text-purple-500 dark:text-purple-400',
        unlocked: true 
      })
    }
    
    // Add locked achievements
    achievements.push(
      { 
        title: 'Bible Scholar', 
        description: 'Complete entire Bible',
        icon: BookOpenCheck as LucideIcon,
        colorClass: 'text-emerald-500 dark:text-emerald-400',
        unlocked: false 
      },
      { 
        title: 'Year of Devotion', 
        description: '365 day streak',
        icon: Sparkles as LucideIcon,
        colorClass: 'text-indigo-500 dark:text-indigo-400',
        unlocked: false 
      }
    )

    return achievements
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-600 dark:text-gray-400">Loading progress data...</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Your Reading Progress
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Track your Bible reading journey and celebrate milestones
        </p>
      </header>

      {/* Plan Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedPlan('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPlan === 'all'
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All Plans
        </button>
        {READING_PLANS.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPlan === plan.id
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {plan.name}
          </button>
        ))}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-200 dark:border-gray-700">
        {(['overview', 'calendar', 'achievements'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-5 py-2.5 capitalize transition-all ${
              viewMode === mode
                ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && statistics && (
        <div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl text-white text-center">
              <div className={`text-4xl font-bold mb-2`}>
                {statistics.currentStreak}
              </div>
              <div className="text-sm opacity-90">Current Streak</div>
              {statistics.currentStreak > 0 && (
                <div className="text-2xl mt-2">🔥</div>
              )}
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-400 dark:from-purple-700 dark:to-pink-500 rounded-xl text-white text-center">
              <div className="text-4xl font-bold mb-2">
                {statistics.totalDaysRead}
              </div>
              <div className="text-sm opacity-90">Total Days Read</div>
            </div>

            <div className="p-6 bg-gradient-to-br from-pink-500 to-yellow-400 dark:from-pink-600 dark:to-yellow-500 rounded-xl text-white text-center">
              <div className="text-4xl font-bold mb-2">
                {statistics.completionRate}%
              </div>
              <div className="text-sm opacity-90">30-Day Completion</div>
            </div>

            <div className="p-6 bg-gradient-to-br from-cyan-400 to-purple-900 dark:from-cyan-300 dark:to-purple-800 rounded-xl text-white text-center">
              <div className="text-4xl font-bold mb-2">
                {statistics.longestStreak}
              </div>
              <div className="text-sm opacity-90">Best Streak</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {readingHistory.slice(-10).reverse().map((item, idx) => (
                <div 
                  key={idx}
                  className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-md"
                >
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {item.readings.join(', ')}
                    </div>
                  </div>
                  <span className="text-green-500 text-xl">✓</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan-specific stats */}
          {selectedPlan !== 'all' && statistics.planSpecificStats.size > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Plan Details
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                {Array.from(statistics.planSpecificStats.entries()).map(([planId, stats]) => (
                  <div key={planId}>
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 dark:text-gray-300">Progress</span>
                        <span className="text-gray-900 dark:text-gray-100 font-semibold">
                          {stats.percentComplete}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 transition-all duration-300"
                          style={{ width: `${stats.percentComplete}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Reading Calendar
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div 
                key={day} 
                className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 p-2"
              >
                {day}
              </div>
            ))}
            {/* Calendar days would go here */}
            {Array.from({ length: 35 }, (_, i) => {
              const hasReading = Math.random() > 0.3
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-md flex items-center justify-center text-sm ${
                    hasReading
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600'
                      : 'bg-white dark:bg-gray-600 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-500'
                  }`}
                >
                  {i + 1 <= 30 ? i + 1 : ''}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Achievements View */}
      {viewMode === 'achievements' && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Your Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAchievements().map((achievement, idx) => {
              const Icon = achievement.icon
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-lg border-2 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-400 dark:border-yellow-600'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60'
                  }`}
                >
                  <div className="mb-3">
                    <Icon
                      className={`h-10 w-10 transition-colors ${
                        achievement.unlocked
                          ? achievement.colorClass
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                      strokeWidth={1.6}
                    />
                  </div>
                <h4 className={`font-semibold mb-1 ${
                  achievement.unlocked
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {achievement.title}
                </h4>
                <p className={`text-sm ${
                  achievement.unlocked
                    ? 'text-gray-600 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {achievement.description}
                </p>
                {achievement.unlocked && (
                  <div className="mt-3 text-xs text-green-600 dark:text-green-400 font-semibold">
                    ✓ Unlocked
                  </div>
                )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
