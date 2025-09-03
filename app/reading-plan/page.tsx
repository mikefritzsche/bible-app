'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ReadingPlanPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [startingPsalm, setStartingPsalm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('startingPsalm')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  const [tempStartingPsalm, setTempStartingPsalm] = useState(startingPsalm.toString())
  const [planStartDate, setPlanStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('planStartDate')
      return saved || new Date().toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  })
  
  const currentDate = new Date()
  const selected = new Date(selectedDate)
  const startDate = new Date(planStartDate)
  
  const daysSincePlanStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const currentPsalm = ((daysSincePlanStart + startingPsalm - 1) % 150) + 1
  
  const handleStartingPsalmSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(tempStartingPsalm)
    if (num >= 1 && num <= 150) {
      const newPlanStartDate = new Date().toISOString().split('T')[0]
      setStartingPsalm(num)
      setPlanStartDate(newPlanStartDate)
      if (typeof window !== 'undefined') {
        localStorage.setItem('startingPsalm', num.toString())
        localStorage.setItem('planStartDate', newPlanStartDate)
      }
    }
  }
  
  // Generate schedule
  const schedule = []
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + i)
    const psalm = ((currentPsalm - 1 + i) % 150) + 1
    schedule.push({
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      psalm,
      isToday: i === 0
    })
  }

  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          Bible Reading Plan
        </h1>
        <p style={{ color: '#6b7280' }}>
          Daily Psalm reading schedule - Next.js App
        </p>
      </header>
      
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        color: 'white',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Today's Reading</h2>
        <p style={{ fontSize: '3rem', fontWeight: 'bold', margin: '16px 0' }}>
          Psalm {currentPsalm}
        </p>
        <p style={{ opacity: 0.9 }}>{currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        marginBottom: '24px',
        border: '1px solid #ffc107'
      }}>
        <form onSubmit={handleStartingPsalmSubmit} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ color: '#000', fontWeight: '500' }}>
            Start Reading With Psalm:
          </label>
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
        </form>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#374151' }}>
          30-Day Schedule
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          {schedule.map((day, index) => (
            <div
              key={index}
              style={{
                padding: '12px',
                border: day.isToday ? '2px solid #667eea' : '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: day.isToday ? '#f3f4ff' : 'white'
              }}
            >
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                {day.date}
              </div>
              <div style={{ 
                fontWeight: day.isToday ? 'bold' : 'normal',
                color: day.isToday ? '#667eea' : '#111827'
              }}>
                Psalm {day.psalm}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}