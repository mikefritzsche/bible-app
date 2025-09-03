'use client'

export default function SettingsPage() {
  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        marginBottom: '24px',
        color: '#111827'
      }}>
        Settings
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Configure your reading preferences
      </p>
      
      <div>
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151'
          }}>
            Reading Preferences
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              color: '#374151'
            }}>
              <input type="checkbox" style={{ width: '16px', height: '16px' }} />
              <span>Show verse numbers</span>
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              color: '#374151'
            }}>
              <input type="checkbox" style={{ width: '16px', height: '16px' }} defaultChecked />
              <span>Show Strong&apos;s numbers</span>
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              color: '#374151'
            }}>
              <input type="checkbox" style={{ width: '16px', height: '16px' }} defaultChecked />
              <span>Enable reading plan reminders</span>
            </label>
          </div>
        </div>
        
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151'
          }}>
            Bible Version
          </h2>
          <select style={{ 
            width: '100%', 
            padding: '8px 12px', 
            border: '1px solid #d1d5db', 
            borderRadius: '6px',
            fontSize: '16px',
            backgroundColor: 'white',
            color: '#111827'
          }}>
            <option value="kjv_strongs">KJV with Strong&apos;s</option>
            <option value="kjv">King James Version</option>
            <option value="asv">American Standard Version</option>
            <option value="web">World English Bible</option>
          </select>
        </div>
        
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151'
          }}>
            Display
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '500'
              }}>
                Font Size
              </label>
              <input 
                type="range" 
                min="12" 
                max="24" 
                defaultValue="16" 
                style={{ width: '100%' }} 
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '500'
              }}>
                Theme
              </label>
              <select style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#111827'
              }}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="sepia">Sepia</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}