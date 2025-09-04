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
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Daily Bible Reading Plan
          </h1>
          <p style={{ color: '#6b7280' }}>
            Read through Psalms and Proverbs with a structured daily plan
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/reading-plan-enhanced"
            style={{
              padding: '10px 16px',
              backgroundColor: '#764ba2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
            title="Explore More Plans"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            More Plans
          </Link>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '10px',
              backgroundColor: showSettings ? '#667eea' : 'transparent',
              color: showSettings ? 'white' : '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
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
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #fbbf24',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎉</span>
              <strong style={{ color: '#92400e' }}>New Reading Plans Available!</strong>
            </div>
            <p style={{ color: '#78350f', fontSize: '0.875rem', margin: 0 }}>
              Explore Bible in a Year, Chronological, New Testament in 90 days, and more reading plans.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link
              href="/reading-plan-enhanced"
              style={{
                padding: '8px 16px',
                backgroundColor: '#f59e0b',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Explore Plans →
            </Link>
            <button
              onClick={dismissPlansBanner}
              style={{
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#92400e'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Statistics Banner */}
      {statistics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{statistics.currentStreak}</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Current Streak</div>
          </div>
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{statistics.totalDaysRead}</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Days Read</div>
          </div>
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{statistics.completionRate}%</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>30-Day Completion</div>
          </div>
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{statistics.longestStreak}</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Longest Streak</div>
          </div>
        </div>
      )}
      
      {/* Today's Reading Card */}
      {todayReading && (
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #d1d5db'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
              Today's Reading
            </h2>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {todayReading.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '2px solid #d1d5db',
            paddingBottom: '2px'
          }}>
            {(['combined', 'psalm', 'proverbs', 'calendar'] as TabView[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeTab === tab ? '#667eea' : 'transparent',
                  color: activeTab === tab ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === tab ? '600' : '400',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'calendar' ? 'Monthly View' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ minHeight: '200px' }}>
            {/* Combined View */}
            {activeTab === 'combined' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: progress?.psalmCompleted ? '2px solid #10b981' : '1px solid #d1d5db'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
                      Psalm {todayReading.psalm}
                    </h3>
                    <button
                      onClick={() => toggleReadingComplete('psalm')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: progress?.psalmCompleted ? '#10b981' : 'white',
                        color: progress?.psalmCompleted ? 'white' : '#10b981',
                        border: `2px solid #10b981`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      {progress?.psalmCompleted ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                  <Link
                    href={`/?book=Psalms&chapter=${todayReading.psalm}`}
                    style={{
                      display: 'inline-block',
                      padding: '10px 16px',
                      backgroundColor: '#667eea',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    Read Psalm {todayReading.psalm} →
                  </Link>
                </div>

                <div style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: progress?.proverbsCompleted ? '2px solid #10b981' : '1px solid #d1d5db'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
                      {formatProverbsList(todayReading.proverbs)}
                    </h3>
                    <button
                      onClick={() => toggleReadingComplete('proverbs')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: progress?.proverbsCompleted ? '#10b981' : 'white',
                        color: progress?.proverbsCompleted ? 'white' : '#10b981',
                        border: `2px solid #10b981`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      {progress?.proverbsCompleted ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {todayReading.proverbs.map(chapter => (
                      <Link
                        key={chapter}
                        href={`/?book=Proverbs&chapter=${chapter}`}
                        style={{
                          display: 'inline-block',
                          padding: '10px 16px',
                          backgroundColor: '#764ba2',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.9rem'
                        }}
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
              <div style={{
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#667eea', marginBottom: '16px' }}>
                  Psalm {todayReading.psalm}
                </h3>
                <button
                  onClick={() => toggleReadingComplete('psalm')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: progress?.psalmCompleted ? '#10b981' : 'white',
                    color: progress?.psalmCompleted ? 'white' : '#10b981',
                    border: `2px solid #10b981`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}
                >
                  {progress?.psalmCompleted ? '✓ Completed' : 'Mark as Complete'}
                </button>
                <br />
                <Link
                  href={`/?book=Psalms&chapter=${todayReading.psalm}`}
                  style={{
                    display: 'inline-block',
                    padding: '14px 28px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '500'
                  }}
                >
                  Read in Bible Reader →
                </Link>
              </div>
            )}

            {/* Proverbs View */}
            {activeTab === 'proverbs' && (
              <div style={{
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#764ba2', marginBottom: '16px' }}>
                  {formatProverbsList(todayReading.proverbs)}
                </h3>
                {todayReading.proverbs.length > 1 && (
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    Today includes multiple chapters to complete the month
                  </p>
                )}
                <button
                  onClick={() => toggleReadingComplete('proverbs')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: progress?.proverbsCompleted ? '#10b981' : 'white',
                    color: progress?.proverbsCompleted ? 'white' : '#10b981',
                    border: `2px solid #10b981`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}
                >
                  {progress?.proverbsCompleted ? '✓ Completed' : 'Mark as Complete'}
                </button>
                <br />
                <div style={{ display: 'inline-flex', gap: '12px' }}>
                  {todayReading.proverbs.map(chapter => (
                    <Link
                      key={chapter}
                      href={`/?book=Proverbs&chapter=${chapter}`}
                      style={{
                        display: 'inline-block',
                        padding: '14px 28px',
                        backgroundColor: '#764ba2',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '1.1rem',
                        fontWeight: '500'
                      }}
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
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #ffc107'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#111827' }}>Reading Plan Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <form onSubmit={handleStartingPsalmSubmit}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Start Psalms Reading at:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={tempStartingPsalm}
                  onChange={(e) => setTempStartingPsalm(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    width: '100px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Update
                </button>
              </div>
            </form>

            <form onSubmit={handleStartingProverbSubmit}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Proverbs Offset (Advanced):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={tempStartingProverb}
                  onChange={(e) => setTempStartingProverb(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    width: '100px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#764ba2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 30-Day Schedule */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#374151' }}>
          30-Day Reading Schedule
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {schedule.map((day, index) => (
            <div
              key={index}
              style={{
                padding: '12px',
                border: day.isToday ? '2px solid #667eea' : day.isCompleted ? '2px solid #10b981' : '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: day.isToday ? '#f3f4ff' : day.isCompleted ? '#f0fdf4' : 'white',
                position: 'relative'
              }}
            >
              {day.isCompleted && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  color: '#10b981',
                  fontSize: '1.2rem'
                }}>
                  ✓
                </span>
              )}
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                {day.date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div style={{ 
                fontWeight: day.isToday ? 'bold' : 'normal',
                color: day.isToday ? '#667eea' : '#111827',
                marginBottom: '4px'
              }}>
                Psalm {day.psalm}
              </div>
              <div style={{ 
                fontSize: '0.875rem',
                color: day.isToday ? '#764ba2' : '#6b7280'
              }}>
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => navigateMonth('prev')}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem'
          }}
        >
          ←
        </button>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => navigateMonth('next')}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem'
          }}
        >
          →
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            style={{
              padding: '8px',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}
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
              style={{
                padding: '8px',
                border: isToday ? '2px solid #667eea' : '1px solid #e5e7eb',
                borderRadius: '4px',
                backgroundColor: 
                  progress?.psalmCompleted && progress?.proverbsCompleted ? '#f0fdf4' :
                  progress?.psalmCompleted || progress?.proverbsCompleted ? '#fef3c7' :
                  isToday ? '#f3f4ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: isToday ? 'bold' : 'normal', marginBottom: '4px' }}>
                {day}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                Ps {psalm}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                Pr {proverbs.join('&')}
              </div>
              {progress && (
                <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                  {progress.psalmCompleted && (
                    <span style={{ fontSize: '0.6rem', color: '#10b981' }}>P✓</span>
                  )}
                  {progress.proverbsCompleted && (
                    <span style={{ fontSize: '0.6rem', color: '#10b981' }}>Pr✓</span>
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