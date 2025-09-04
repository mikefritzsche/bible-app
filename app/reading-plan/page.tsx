'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ReadingPlanManager, type DailyReading, type ReadingProgress } from '@/lib/ReadingPlanManager'

type TabView = 'psalm' | 'proverbs' | 'combined' | 'calendar'

export default function ReadingPlanPage() {
  const [manager] = useState(() => new ReadingPlanManager())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<TabView>('combined')
  const [startingPsalm, setStartingPsalm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('startingPsalm')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  const [startingProverb, setStartingProverb] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('startingProverb')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  const [tempStartingPsalm, setTempStartingPsalm] = useState(startingPsalm.toString())
  const [tempStartingProverb, setTempStartingProverb] = useState(startingProverb.toString())
  const [planStartDate, setPlanStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('planStartDate')
      return saved ? new Date(saved) : new Date()
    }
    return new Date()
  })
  const [todayReading, setTodayReading] = useState<DailyReading | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [schedule, setSchedule] = useState<DailyReading[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showPlanOptions, setShowPlanOptions] = useState(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('dismissedPlansBanner')
      return !dismissed
    }
    return true
  })
  
  // Initialize and load data
  useEffect(() => {
    const initializeData = async () => {
      await manager.init()
      await loadTodayReading()
      await loadSchedule()
      await loadStatistics()
    }
    initializeData()
  }, [selectedDate, startingPsalm, planStartDate])
  
  const dismissPlansBanner = () => {
    setShowPlanOptions(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissedPlansBanner', 'true')
    }
  }
  
  const loadTodayReading = async () => {
    const today = new Date()
    const reading: DailyReading = {
      date: today,
      psalm: manager.calculatePsalm(today, startingPsalm, planStartDate),
      proverbs: manager.calculateProverbs(today),
      isToday: true
    }
    setTodayReading(reading)
    
    // Load progress for today
    const dateStr = today.toISOString().split('T')[0]
    const todayProgress = await manager.getProgress(dateStr)
    setProgress(todayProgress)
  }
  
  const loadSchedule = async () => {
    const startDate = new Date()
    const newSchedule = manager.generateSchedule(startDate, 30, startingPsalm, planStartDate)
    
    // Load progress for each day
    for (const day of newSchedule) {
      const dateStr = day.date.toISOString().split('T')[0]
      const dayProgress = await manager.getProgress(dateStr)
      day.isCompleted = dayProgress?.psalmCompleted && dayProgress?.proverbsCompleted
    }
    
    setSchedule(newSchedule)
  }
  
  const loadStatistics = async () => {
    const stats = await manager.getStatistics()
    setStatistics(stats)
  }
  
  const handleStartingPsalmSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(tempStartingPsalm)
    if (num >= 1 && num <= 150) {
      const newPlanStartDate = new Date()
      setStartingPsalm(num)
      setPlanStartDate(newPlanStartDate)
      if (typeof window !== 'undefined') {
        localStorage.setItem('startingPsalm', num.toString())
        localStorage.setItem('planStartDate', newPlanStartDate.toISOString())
      }
    }
  }
  
  const handleStartingProverbSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(tempStartingProverb)
    if (num >= 1 && num <= 31) {
      setStartingProverb(num)
      if (typeof window !== 'undefined') {
        localStorage.setItem('startingProverb', num.toString())
      }
    }
  }
  
  const toggleReadingComplete = async (type: 'psalm' | 'proverbs') => {
    if (!todayReading) return
    
    const dateStr = todayReading.date.toISOString().split('T')[0]
    const currentProgress = await manager.getProgress(dateStr)
    
    if (type === 'psalm') {
      if (currentProgress?.psalmCompleted) {
        await manager.markAsUnread(dateStr, 'psalm')
      } else {
        await manager.markAsRead(dateStr, 'psalm')
      }
    } else {
      if (currentProgress?.proverbsCompleted) {
        await manager.markAsUnread(dateStr, 'proverbs')
      } else {
        await manager.markAsRead(dateStr, 'proverbs')
      }
    }
    
    await loadTodayReading()
    await loadSchedule()
    await loadStatistics()
  }
  
  const formatProverbsList = (proverbs: number[]): string => {
    if (proverbs.length === 1) return `Proverbs ${proverbs[0]}`
    return `Proverbs ${proverbs.join(' & ')}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Daily Bible Reading Plan
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Read through Psalms and Proverbs with a structured daily plan
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/reading-plan-enhanced"
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg no-underline flex items-center gap-1.5 text-sm font-medium transition-colors"
            title="Explore More Plans"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            More Plans
          </Link>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 border-2 border-blue-600 dark:border-blue-400 rounded-lg transition-colors ${
              showSettings 
                ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                : 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
            title="Settings"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24" />
            </svg>
          </button>
        </div>
      </header>

      {/* New Plans Announcement Banner */}
      {showPlanOptions && (
        <div className="p-4 px-5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-6 border border-yellow-400 dark:border-yellow-600 flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎉</span>
              <strong className="text-yellow-900 dark:text-yellow-200">New Reading Plans Available!</strong>
            </div>
            <p className="text-yellow-800 dark:text-yellow-300 text-sm m-0">
              Explore Bible in a Year, Chronological, New Testament in 90 days, and more reading plans.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Link
              href="/reading-plan-enhanced"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md no-underline text-sm font-medium transition-colors"
            >
              Explore Plans →
            </Link>
            <button
              onClick={dismissPlansBanner}
              className="p-1 bg-transparent text-yellow-900 dark:text-yellow-200 hover:text-yellow-700 dark:hover:text-yellow-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Statistics Banner */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg text-white text-center">
            <div className="text-3xl font-bold">{statistics.currentStreak}</div>
            <div className="text-sm opacity-90">Current Streak</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-400 rounded-lg text-white text-center">
            <div className="text-3xl font-bold">{statistics.totalDaysRead}</div>
            <div className="text-sm opacity-90">Total Days Read</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-pink-500 to-yellow-400 rounded-lg text-white text-center">
            <div className="text-3xl font-bold">{statistics.completionRate}%</div>
            <div className="text-sm opacity-90">30-Day Completion</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-cyan-500 to-indigo-900 rounded-lg text-white text-center">
            <div className="text-3xl font-bold">{statistics.longestStreak}</div>
            <div className="text-sm opacity-90">Longest Streak</div>
          </div>
        </div>
      )}
      
      {/* Today's Reading Card */}
      {todayReading && (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-6 border border-gray-300 dark:border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Today's Reading
            </h2>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {todayReading.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-5 border-b-2 border-gray-300 dark:border-gray-600 pb-0.5">
            {(['combined', 'psalm', 'proverbs', 'calendar'] as TabView[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-md capitalize text-sm transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 dark:bg-blue-500 text-white font-semibold'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'calendar' ? 'Monthly View' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {/* Combined View */}
            {activeTab === 'combined' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-5 bg-white dark:bg-gray-700 rounded-lg border-2 ${
                  progress?.psalmCompleted ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                      Psalm {todayReading.psalm}
                    </h3>
                    <button
                      onClick={() => toggleReadingComplete('psalm')}
                      className={`px-3 py-1.5 border-2 border-green-500 rounded-md text-sm font-medium transition-colors ${
                        progress?.psalmCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {progress?.psalmCompleted ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                  <Link
                    href={`/?book=Psalms&chapter=${todayReading.psalm}`}
                    className="inline-block px-4 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md no-underline text-sm transition-colors"
                  >
                    Read Psalm {todayReading.psalm} →
                  </Link>
                </div>

                <div className={`p-5 bg-white dark:bg-gray-700 rounded-lg border-2 ${
                  progress?.proverbsCompleted ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                      {formatProverbsList(todayReading.proverbs)}
                    </h3>
                    <button
                      onClick={() => toggleReadingComplete('proverbs')}
                      className={`px-3 py-1.5 border-2 border-green-500 rounded-md text-sm font-medium transition-colors ${
                        progress?.proverbsCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      {progress?.proverbsCompleted ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {todayReading.proverbs.map(chapter => (
                      <Link
                        key={chapter}
                        href={`/?book=Proverbs&chapter=${chapter}`}
                        className="inline-block px-4 py-2.5 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-md no-underline text-sm transition-colors"
                      >
                        Read Ch. {chapter} →
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Psalm View */}
            {activeTab === 'psalm' && (
              <div className="p-6 bg-white dark:bg-gray-700 rounded-lg text-center">
                <h3 className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  Psalm {todayReading.psalm}
                </h3>
                <button
                  onClick={() => toggleReadingComplete('psalm')}
                  className={`px-6 py-3 border-2 border-green-500 rounded-lg text-base font-semibold mb-4 transition-colors ${
                    progress?.psalmCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  {progress?.psalmCompleted ? '✓ Completed' : 'Mark as Complete'}
                </button>
                <br />
                <Link
                  href={`/?book=Psalms&chapter=${todayReading.psalm}`}
                  className="inline-block px-7 py-3.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg no-underline text-lg font-medium transition-colors"
                >
                  Read in Bible Reader →
                </Link>
              </div>
            )}

            {/* Proverbs View */}
            {activeTab === 'proverbs' && (
              <div className="p-6 bg-white dark:bg-gray-700 rounded-lg text-center">
                <h3 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                  {formatProverbsList(todayReading.proverbs)}
                </h3>
                {todayReading.proverbs.length > 1 && (
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Today includes multiple chapters to complete the month
                  </p>
                )}
                <button
                  onClick={() => toggleReadingComplete('proverbs')}
                  className={`px-6 py-3 border-2 border-green-500 rounded-lg text-base font-semibold mb-4 transition-colors ${
                    progress?.proverbsCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  {progress?.proverbsCompleted ? '✓ Completed' : 'Mark as Complete'}
                </button>
                <br />
                <div className="inline-flex gap-3">
                  {todayReading.proverbs.map(chapter => (
                    <Link
                      key={chapter}
                      href={`/?book=Proverbs&chapter=${chapter}`}
                      className="inline-block px-7 py-3.5 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg no-underline text-lg font-medium transition-colors"
                    >
                      Read Chapter {chapter} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar View */}
            {activeTab === 'calendar' && (
              <div>
                <MonthlyCalendar
                  manager={manager}
                  startingPsalm={startingPsalm}
                  planStartDate={planStartDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-6 border border-yellow-400 dark:border-yellow-600">
          <h3 className="mb-4 text-gray-900 dark:text-gray-100">Reading Plan Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form onSubmit={handleStartingPsalmSubmit}>
              <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                Start Psalms Reading at:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={tempStartingPsalm}
                  onChange={(e) => setTempStartingPsalm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-base w-24"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md text-base transition-colors"
                >
                  Update
                </button>
              </div>
            </form>

            <form onSubmit={handleStartingProverbSubmit}>
              <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                Proverbs Offset (Advanced):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={tempStartingProverb}
                  onChange={(e) => setTempStartingProverb(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-base w-24"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-md text-base transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 30-Day Schedule */}
      <div className="mt-8">
        <h3 className="text-xl mb-4 text-gray-700 dark:text-gray-300">
          30-Day Reading Schedule
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {schedule.map((day, index) => (
            <div
              key={index}
              className={`p-3 rounded-md relative border ${
                day.isToday 
                  ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : day.isCompleted 
                  ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              }`}
            >
              {day.isCompleted && (
                <span className="absolute top-1 right-1 text-green-500 text-xl">
                  ✓
                </span>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {day.date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className={`mb-1 ${
                day.isToday 
                  ? 'font-bold text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                Psalm {day.psalm}
              </div>
              <div className={`text-sm ${
                day.isToday 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {day.proverbs.length === 1 
                  ? `Proverbs ${day.proverbs[0]}`
                  : `Prov ${day.proverbs.join(' & ')}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Monthly Calendar Component
function MonthlyCalendar({ 
  manager, 
  startingPsalm, 
  planStartDate,
  onDateSelect 
}: {
  manager: ReadingPlanManager;
  startingPsalm: number;
  planStartDate: Date;
  onDateSelect: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthProgress, setMonthProgress] = useState<Map<string, ReadingProgress>>(new Map())

  useEffect(() => {
    loadMonthProgress()
  }, [currentMonth])

  const loadMonthProgress = async () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const progressMap = new Map<string, ReadingProgress>()
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const progress = await manager.getProgress(dateStr)
      if (progress) {
        progressMap.set(dateStr, progress)
      }
    }
    
    setMonthProgress(progressMap)
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const days = getDaysInMonth()
  const today = new Date()
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                        currentMonth.getFullYear() === today.getFullYear()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-2xl transition-colors"
        >
          ←
        </button>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-2xl transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="p-2 text-center font-semibold text-sm text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />
          }
          
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          const dateStr = date.toISOString().split('T')[0]
          const progress = monthProgress.get(dateStr)
          const isToday = isCurrentMonth && day === today.getDate()
          const psalm = manager.calculatePsalm(date, startingPsalm, planStartDate)
          const proverbs = manager.calculateProverbs(date)
          
          return (
            <div
              key={day}
              onClick={() => onDateSelect(date)}
              className={`p-2 rounded cursor-pointer transition-all border ${
                isToday
                  ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : progress?.psalmCompleted && progress?.proverbsCompleted
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : progress?.psalmCompleted || progress?.proverbsCompleted
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <div className={`mb-1 ${isToday ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200'}`}>
                {day}
              </div>
              <div className="text-[0.7rem] text-gray-500 dark:text-gray-400">
                Ps {psalm}
              </div>
              <div className="text-[0.7rem] text-gray-500 dark:text-gray-400">
                Pr {proverbs.join('&')}
              </div>
              {progress && (
                <div className="flex gap-0.5 mt-1">
                  {progress.psalmCompleted && (
                    <span className="text-[0.6rem] text-green-500">P✓</span>
                  )}
                  {progress.proverbsCompleted && (
                    <span className="text-[0.6rem] text-green-500">Pr✓</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}