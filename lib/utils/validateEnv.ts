/**
 * Validates that required environment variables are set for Google Drive sync
 */
export function validateGoogleDriveEnv(): {
  isValid: boolean
  missing: string[]
  warnings: string[]
} {
  const required = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'NEXT_PUBLIC_GOOGLE_API_KEY'
  ]
  
  const missing: string[] = []
  const warnings: string[] = []
  
  for (const key of required) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push(key)
    }
  }
  
  // Check for common issues
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  
  if (clientId && !clientId.includes('.apps.googleusercontent.com')) {
    warnings.push('Client ID does not appear to be in the correct format')
  }
  
  if (apiKey && !apiKey.startsWith('AIza')) {
    warnings.push('API Key does not appear to be in the correct format')
  }
  
  // Check if using example values
  if (clientId?.includes('your-client-id')) {
    warnings.push('Client ID appears to be a placeholder value')
  }
  
  if (apiKey === 'your-api-key') {
    warnings.push('API Key appears to be a placeholder value')
  }
  
  return {
    isValid: missing.length === 0 && warnings.length === 0,
    missing,
    warnings
  }
}

/**
 * Logs environment validation results
 */
export function logEnvValidation(): void {
  if (typeof window !== 'undefined') {
    const validation = validateGoogleDriveEnv()
    
    if (!validation.isValid) {
      console.group('⚠️ Google Drive Sync Configuration Issues')
      
      if (validation.missing.length > 0) {
        console.error('Missing environment variables:', validation.missing)
        console.log('Add these to your .env.local file or hosting environment')
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Configuration warnings:', validation.warnings)
      }
      
      console.log('See GOOGLE_DRIVE_DEPLOYMENT.md for setup instructions')
      console.groupEnd()
    }
  }
}