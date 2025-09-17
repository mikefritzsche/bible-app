'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  EnhancedReadingPlanManager, 
  READING_PLANS,
  type DailyReading, 
  type ReadingProgress,
  type ReadingPlanType,
  type ReadingPlanInfo,
  type ReadingItem
} from '@/lib/ReadingPlanManagerEnhanced'

type TabView = 'today' | 'schedule' | 'plans' | 'statistics'

export default function EnhancedReadingPlanPage() {
  const [manager] = useState(() => new EnhancedReadingPlanManager())
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlanType>('psalms-proverbs')
  const [activeTab, setActiveTab] = useState<TabView>('today')
  const [todayReading, setTodayReading] = useState<DailyReading | null>(null)
  const [schedule, setSchedule] = useState<DailyReading[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Plan-specific preferences
  const [startingPsalm, setStartingPsalm] = useState(1)
  const [planStartDate, setPlanStartDate] = useState(new Date())
  
  // Initialize and load data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      await manager.init()
      
      // Load saved preferences
      const savedPlan = localStorage.getItem('selectedReadingPlan') as ReadingPlanType
      if (savedPlan && READING_PLANS.some(p => p.id === savedPlan)) {
        setSelectedPlan(savedPlan)
      }
      
      if (savedPlan === 'psalms-proverbs') {
        const savedPsalm = localStorage.getItem('startingPsalm')
        const savedDate = localStorage.getItem('planStartDate')
        if (savedPsalm) setStartingPsalm(parseInt(savedPsalm))
        if (savedDate) setPlanStartDate(new Date(savedDate))
      }
      
      setLoading(false)
    }
    initializeData()
  }, [])
  
  // Load data when plan changes
  useEffect(() => {
    if (!loading) {
      loadPlanData()
    }
  }, [selectedPlan, loading])
  
  const loadPlanData = async () => {
    await loadTodayReading()
    await loadSchedule()
    await loadStatistics()
  }
  
  const loadTodayReading = async () => {
    const today = new Date()
    const schedule = manager.generateSchedule(
      selectedPlan, 
      today, 
      1,
      selectedPlan === 'psalms-proverbs' ? { startingPsalm, planStartDate } : undefined
    )
    
    if (schedule.length > 0) {
      const todaySchedule = schedule[0]
      setTodayReading(todaySchedule)
      
      // Load progress for today
      const dateStr = today.toISOString().split('T')[0]
      const todayProgress = await manager.getProgress(dateStr, selectedPlan)
      setProgress(todayProgress)
    }
  }
  
  const loadSchedule = async () => {
    const startDate = new Date()
    const planInfo = READING_PLANS.find(p => p.id === selectedPlan)
    const days = Math.min(30, planInfo?.duration || 30)
    
    const newSchedule = manager.generateSchedule(
      selectedPlan,
      startDate,
      days,
      selectedPlan === 'psalms-proverbs' ? { startingPsalm, planStartDate } : undefined
    )
    
    // Load progress for each day
    for (const day of newSchedule) {
      const dateStr = day.date.toISOString().split('T')[0]
      const dayProgress = await manager.getProgress(dateStr, selectedPlan)
      
      // Check if all readings for the day are complete
      if (dayProgress && day.readings) {
        const allComplete = day.readings.every(reading => {
          const readingKeys = reading.chapters.map(ch => `${reading.book} ${ch}`)
          return readingKeys.every(key => dayProgress.completedReadings.includes(key))
        })
        day.isCompleted = allComplete
      }
    }
    
    setSchedule(newSchedule)
  }
  
  const loadStatistics = async () => {
    const stats = await manager.getStatistics(selectedPlan)
    setStatistics(stats)
  }
  
  const handlePlanChange = async (planId: ReadingPlanType) => {
    setSelectedPlan(planId)
    localStorage.setItem('selectedReadingPlan', planId)
    
    // Save plan preferences if needed
    if (planId === 'psalms-proverbs') {
      await manager.savePlanPreferences(planId, {
        startingPsalm,
        planStartDate: planStartDate.toISOString()
      })
    }
  }
  
  const toggleReadingComplete = async (reading: ReadingItem) => {
    if (!todayReading) return
    
    const dateStr = todayReading.date.toISOString().split('T')[0]
    const readingKeys = reading.chapters.map(ch => `${reading.book} ${ch}`)
    
    const currentProgress = await manager.getProgress(dateStr, selectedPlan)
    const isComplete = readingKeys.every(key => 
      currentProgress?.completedReadings.includes(key)
    )
    
    if (isComplete) {
      await manager.markAsUnread(dateStr, selectedPlan, readingKeys)
    } else {
      await manager.markAsRead(dateStr, selectedPlan, readingKeys)
    }
    
    await loadPlanData()
  }
  
  const formatReadingText = (reading: ReadingItem): string => {
    if (reading.chapters.length === 1) {
      return `${reading.book} ${reading.chapters[0]}`
    } else if (reading.chapters.length === 2 && 
               reading.chapters[1] === reading.chapters[0] + 1) {
      return `${reading.book} ${reading.chapters[0]}-${reading.chapters[1]}`
    } else {
      // Check if chapters are consecutive
      const isConsecutive = reading.chapters.every((ch, idx) => 
        idx === 0 || ch === reading.chapters[idx - 1] + 1
      )
      if (isConsecutive && reading.chapters.length > 2) {
        return `${reading.book} ${reading.chapters[0]}-${reading.chapters[reading.chapters.length - 1]}`
      }
      return `${reading.book} ${reading.chapters.join(', ')}`
    }
  }
  
  const getReadingTypeColor = (type?: string) => {
    switch (type) {
      case 'psalm': return '#667eea'
      case 'proverb': return '#764ba2'
      case 'ot': return '#059669'
      case 'nt': return '#dc2626'
      case 'gospel': return '#ea580c'
      default: return '#374151'
    }
  }
  
  const getReadingTypeLabel = (type?: string) => {
    switch (type) {
      case 'psalm': return 'Psalm'
      case 'proverb': return 'Wisdom'
      case 'ot': return 'Old Testament'
      case 'nt': return 'New Testament'
      case 'gospel': return 'Gospel'
      default: return 'Reading'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading reading plans...</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Reading Plans
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Choose from multiple reading plans to grow in God's Word
            </p>
          </div>
          <Link
            href="/reading-plan"
            className="px-4 py-2.5 bg-transparent text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg no-underline flex items-center gap-1.5 text-sm font-medium h-fit hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Back to Psalms & Proverbs"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m0 0l7-7m-7 7l7 7" />
            </svg>
            Classic View
          </Link>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-200 dark:border-gray-700 pb-0.5">
        {(['today', 'schedule', 'plans', 'statistics'] as TabView[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-t-lg capitalize transition-all ${
              activeTab === tab
                ? 'bg-blue-600 dark:bg-blue-500 text-white font-semibold'
                : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'today' ? "Today's Reading" : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {/* Today's Reading Tab */}
        {activeTab === 'today' && todayReading && (
          <div>
            {/* Current Plan Info */}
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {READING_PLANS.find(p => p.id === selectedPlan)?.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {READING_PLANS.find(p => p.id === selectedPlan)?.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Daily Time: {READING_PLANS.find(p => p.id === selectedPlan)?.dailyTime}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Duration: {READING_PLANS.find(p => p.id === selectedPlan)?.duration} days
                </div>
              </div>
            </div>

            {/* Today's Date */}
            <div className="text-center mb-6 text-gray-500 dark:text-gray-400">
              {todayReading.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>

            {/* Today's Readings */}
            <div className="grid gap-4">
              {todayReading.readings.map((reading, idx) => {
                const readingKeys = reading.chapters.map(ch => `${reading.book} ${ch}`)
                const isComplete = readingKeys.every(key => 
                  progress?.completedReadings.includes(key)
                )
                
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-lg shadow-sm ${
                      isComplete 
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' 
                        : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span 
                          className="px-2 py-1 text-xs font-semibold rounded"
                          style={{
                            backgroundColor: getReadingTypeColor(reading.type) + '20',
                            color: getReadingTypeColor(reading.type)
                          }}
                        >
                          {getReadingTypeLabel(reading.type)}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {formatReadingText(reading)}
                        </h3>
                      </div>
                      <button
                        onClick={() => toggleReadingComplete(reading)}
                        className={`px-4 py-2 border-2 border-green-500 rounded-md text-sm font-medium transition-colors ${
                          isComplete
                            ? 'bg-green-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {isComplete ? '✓ Completed' : 'Mark Complete'}
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {reading.chapters.map(chapter => (
                        <Link
                          key={chapter}
                          href={`/?book=${reading.book}&chapter=${chapter}`}
                          className="inline-block px-3 py-2 text-white rounded-md no-underline text-sm transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: getReadingTypeColor(reading.type)
                          }}
                        >
                          {reading.chapters.length === 1 
                            ? 'Read Chapter →'
                            : `Chapter ${chapter} →`}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div>
            <h3 className="text-xl mb-4 text-gray-700 dark:text-gray-300">
              Upcoming Readings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedule.map((day, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md relative border-2 ${
                    day.isToday 
                      ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                      : day.isCompleted 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  {day.isCompleted && (
                    <span className="absolute top-2 right-2 text-green-500 text-xl">
                      ✓
                    </span>
                  )}
                  <div className={`text-sm mb-2 ${
                    day.isToday 
                      ? 'font-bold text-gray-700 dark:text-gray-200' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {day.date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    {day.isToday && <span className="text-blue-600 dark:text-blue-400"> (Today)</span>}
                  </div>
                  <div className="text-sm">
                    {day.readings.map((reading, idx) => (
                      <div key={idx} className="mb-1 flex items-center">
                        <span 
                          className="inline-block w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor: getReadingTypeColor(reading.type)
                          }} 
                        />
                        <span className="text-gray-700 dark:text-gray-200">
                          {formatReadingText(reading)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div>
            <h3 className="text-xl mb-4 text-gray-700 dark:text-gray-300">
              Available Reading Plans
            </h3>
            
            {/* Plan Categories */}
            {['devotional', 'comprehensive', 'focused'].map(category => (
              <div key={category} className="mb-8">
                <h4 className="text-base font-semibold text-gray-500 dark:text-gray-400 capitalize mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">
                  {category} Plans
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {READING_PLANS.filter(plan => plan.category === category).map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanChange(plan.id)}
                      className={`p-5 rounded-lg cursor-pointer transition-all ${
                        selectedPlan === plan.id 
                          ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                          : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-lg font-semibold ${
                          selectedPlan === plan.id 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {plan.name}
                        </h4>
                        {selectedPlan === plan.id && (
                          <span className="px-2 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded text-xs font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        {plan.description}
                      </p>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>⏱ {plan.dailyTime}</span>
                        <span>📅 {plan.duration} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && statistics && (
          <div>
            <h3 className="text-xl mb-6 text-gray-700 dark:text-gray-300">
              Your Progress - {READING_PLANS.find(p => p.id === selectedPlan)?.name}
            </h3>
            
            {/* Statistics Grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mb-8">
              <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl text-white text-center">
                <div className="text-5xl font-bold">
                  {statistics.currentStreak}
                </div>
                <div className="text-base opacity-90">
                  Current Streak
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-400 dark:from-purple-700 dark:to-pink-500 rounded-xl text-white text-center">
                <div className="text-5xl font-bold">
                  {statistics.totalDaysRead}
                </div>
                <div className="text-base opacity-90">
                  Total Days Read
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-pink-500 to-yellow-400 dark:from-pink-600 dark:to-yellow-500 rounded-xl text-white text-center">
                <div className="text-5xl font-bold">
                  {statistics.completionRate}%
                </div>
                <div className="text-base opacity-90">
                  30-Day Completion
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-cyan-400 to-purple-900 dark:from-cyan-300 dark:to-purple-800 rounded-xl text-white text-center">
                <div className="text-5xl font-bold">
                  {statistics.longestStreak}
                </div>
                <div className="text-base opacity-90">
                  Longest Streak
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-teal-200 to-pink-200 dark:from-teal-300 dark:to-pink-300 rounded-xl text-gray-700 dark:text-gray-800 text-center">
                <div className="text-5xl font-bold">
                  {statistics.percentComplete}%
                </div>
                <div className="text-base opacity-90">
                  Plan Complete
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <h4 className="mb-3 text-gray-700 dark:text-gray-300">
                Overall Progress
              </h4>
              <div className="w-full h-6 bg-gray-200 dark:bg-gray-600 rounded-xl overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 transition-all duration-300 ease-out"
                  style={{ width: `${statistics.percentComplete}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>0 days</span>
                <span>{statistics.totalDaysRead} / {READING_PLANS.find(p => p.id === selectedPlan)?.duration} days</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}