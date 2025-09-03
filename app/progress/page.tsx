export default function ProgressPage() {
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
        marginBottom: '24px' 
      }}>
        Reading Progress
      </h1>
      <p style={{ color: '#6b7280' }}>
        Track your Bible reading progress here.
      </p>
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #3b82f6'
      }}>
        <p style={{ color: '#1e40af' }}>
          This feature will show your reading history, streaks, and completion statistics.
        </p>
      </div>
    </div>
  )
}