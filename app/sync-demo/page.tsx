'use client'

import { useState } from 'react'
import SyncSettings from '@/components/SyncSettings'

export default function SyncDemoPage() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="">
      <div className="">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Cloud Sync Demo</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Setup Instructions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Option 1: Google Drive</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the Google Drive API</li>
                <li>Create OAuth 2.0 credentials for a Web application</li>
                <li>Add http://localhost:3000 to authorized JavaScript origins</li>
                <li>Copy your Client ID and API Key to .env.local</li>
                <li>Click "Connect to Google Drive" below</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">Option 2: iCloud Drive / Dropbox / OneDrive</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Make sure your cloud service app is installed and syncing</li>
                <li>Click "Connect to Local Cloud Folder" below</li>
                <li>Navigate to your cloud service folder:
                  <ul className="list-disc list-inside ml-4 mt-2 text-gray-700 dark:text-gray-300">
                    <li><strong className="font-semibold">iCloud Drive:</strong> ~/Library/Mobile Documents/com~apple~CloudDocs/</li>
                    <li><strong className="font-semibold">Dropbox:</strong> ~/Dropbox/</li>
                    <li><strong className="font-semibold">OneDrive:</strong> ~/OneDrive/</li>
                    <li><strong className="font-semibold">Google Drive:</strong> ~/Google Drive/</li>
                  </ul>
                </li>
                <li>Create or select a folder for Bible app data</li>
                <li>Grant permission when prompted</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Test the Sync</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Sync Settings
          </button>
          
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong className="font-semibold">Note:</strong> This is a proof of concept. In production, you would:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <li>Add automatic background sync</li>
              <li>Implement proper conflict resolution UI</li>
              <li>Add end-to-end encryption option</li>
              <li>Support more cloud providers</li>
              <li>Add sync status indicators throughout the app</li>
            </ul>
          </div>
        </div>

        {showSettings && <SyncSettings onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  )
}