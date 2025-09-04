'use client'

import { useState, useEffect } from 'react'

export default function TestHydration() {
  const [mounted, setMounted] = useState(false)
  const [items] = useState(() => [
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' },
    { id: 3, text: 'Item 3' }
  ])
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Hydration Test</h1>
      <p>Status: {mounted ? 'Client' : 'Server'}</p>
      
      {/* Only render dynamic content after mounting */}
      {mounted && (
        <div>
          {items.map(item => (
            <div key={item.id}>
              {item.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}