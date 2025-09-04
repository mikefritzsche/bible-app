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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading reading plans...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              Bible Reading Plans
            </h1>
            <p style={{ color: '#6b7280' }}>
              Choose from multiple reading plans to grow in God's Word
            </p>
          </div>
          <Link
            href="/reading-plan"
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              fontWeight: '500',
              height: 'fit-content'
            }}
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
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '2px'
      }}>
        {(['today', 'schedule', 'plans', 'statistics'] as TabView[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab ? '#667eea' : 'transparent',
              color: activeTab === tab ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
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
            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                  {READING_PLANS.find(p => p.id === selectedPlan)?.name}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {READING_PLANS.find(p => p.id === selectedPlan)?.description}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Daily Time: {READING_PLANS.find(p => p.id === selectedPlan)?.dailyTime}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Duration: {READING_PLANS.find(p => p.id === selectedPlan)?.duration} days
                </div>
              </div>
            </div>

            {/* Today's Date */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px',
              color: '#6b7280'
            }}>
              {todayReading.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>

            {/* Today's Readings */}
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {todayReading.readings.map((reading, idx) => {
                const readingKeys = reading.chapters.map(ch => `${reading.book} ${ch}`)
                const isComplete = readingKeys.every(key => 
                  progress?.completedReadings.includes(key)
                )
                
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '20px',
                      backgroundColor: isComplete ? '#f0fdf4' : 'white',
                      borderRadius: '8px',
                      border: isComplete ? '2px solid #10b981' : '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: getReadingTypeColor(reading.type) + '20',
                          color: getReadingTypeColor(reading.type),
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {getReadingTypeLabel(reading.type)}
                        </span>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600',
                          color: '#111827'
                        }}>
                          {formatReadingText(reading)}
                        </h3>
                      </div>
                      <button
                        onClick={() => toggleReadingComplete(reading)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isComplete ? '#10b981' : 'white',
                          color: isComplete ? 'white' : '#10b981',
                          border: '2px solid #10b981',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        {isComplete ? '✓ Completed' : 'Mark Complete'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {reading.chapters.map(chapter => (
                        <Link
                          key={chapter}
                          href={`/?book=${reading.book}&chapter=${chapter}`}
                          style={{
                            display: 'inline-block',
                            padding: '8px 12px',
                            backgroundColor: getReadingTypeColor(reading.type),
                            color: 'white',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '0.875rem'
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
            <h3 style={{ 
              fontSize: '1.25rem', 
              marginBottom: '16px', 
              color: '#374151'
            }}>
              Upcoming Readings
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '12px'
            }}>
              {schedule.map((day, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    border: day.isToday 
                      ? '2px solid #667eea' 
                      : day.isCompleted 
                        ? '2px solid #10b981' 
                        : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: day.isToday 
                      ? '#f3f4ff' 
                      : day.isCompleted 
                        ? '#f0fdf4' 
                        : 'white',
                    position: 'relative'
                  }}
                >
                  {day.isCompleted && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      color: '#10b981',
                      fontSize: '1.2rem'
                    }}>
                      ✓
                    </span>
                  )}
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    marginBottom: '8px',
                    fontWeight: day.isToday ? 'bold' : 'normal'
                  }}>
                    {day.date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    {day.isToday && <span style={{ color: '#667eea' }}> (Today)</span>}
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    {day.readings.map((reading, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: getReadingTypeColor(reading.type),
                          marginRight: '8px'
                        }} />
                        <span style={{ color: '#374151' }}>
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
            <h3 style={{ 
              fontSize: '1.25rem', 
              marginBottom: '16px', 
              color: '#374151'
            }}>
              Available Reading Plans
            </h3>
            
            {/* Plan Categories */}
            {['devotional', 'comprehensive', 'focused'].map(category => (
              <div key={category} style={{ marginBottom: '32px' }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'capitalize',
                  marginBottom: '12px',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '8px'
                }}>
                  {category} Plans
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                  {READING_PLANS.filter(plan => plan.category === category).map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanChange(plan.id)}
                      style={{
                        padding: '20px',
                        border: selectedPlan === plan.id 
                          ? '2px solid #667eea' 
                          : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: selectedPlan === plan.id 
                          ? '#f3f4ff' 
                          : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selectedPlan === plan.id 
                          ? '0 4px 6px rgba(102, 126, 234, 0.1)' 
                          : '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '8px'
                      }}>
                        <h4 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '600',
                          color: selectedPlan === plan.id ? '#667eea' : '#111827'
                        }}>
                          {plan.name}
                        </h4>
                        {selectedPlan === plan.id && (
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#667eea',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{ 
                        color: '#6b7280', 
                        fontSize: '0.875rem',
                        marginBottom: '12px'
                      }}>
                        {plan.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
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
            <h3 style={{ 
              fontSize: '1.25rem', 
              marginBottom: '24px', 
              color: '#374151'
            }}>
              Your Progress - {READING_PLANS.find(p => p.id === selectedPlan)?.name}
            </h3>
            
            {/* Statistics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                  {statistics.currentStreak}
                </div>
                <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                  Current Streak
                </div>
              </div>
              
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                  {statistics.totalDaysRead}
                </div>
                <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                  Total Days Read
                </div>
              </div>
              
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                  {statistics.completionRate}%
                </div>
                <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                  30-Day Completion
                </div>
              </div>
              
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                  {statistics.longestStreak}
                </div>
                <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                  Longest Streak
                </div>
              </div>
              
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                borderRadius: '12px',
                color: '#374151',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                  {statistics.percentComplete}%
                </div>
                <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                  Plan Complete
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '32px' }}>
              <h4 style={{ marginBottom: '12px', color: '#374151' }}>
                Overall Progress
              </h4>
              <div style={{
                width: '100%',
                height: '24px',
                backgroundColor: '#e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${statistics.percentComplete}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
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