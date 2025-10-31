import { useState } from 'react'
import { iCloudAPI } from '../services/api'
import './AuthPanel.css'

interface AuthPanelProps {
  onAuthenticated: () => void
}

function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [appleId, setAppleId] = useState('')
  const [password, setPassword] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await iCloudAPI.login(appleId, password)
      
      if (result.status === '2fa_required') {
        setNeeds2FA(true)
      } else if (result.status === 'success') {
        onAuthenticated()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await iCloudAPI.verify2FA(twoFACode)
      
      if (result.status === 'success') {
        onAuthenticated()
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '2FA verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel">
      <div className="auth-card">
        <h2>🔐 Connect to iCloud</h2>
        
        {!needs2FA ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="appleId">Apple ID</label>
              <input
                id="appleId"
                type="email"
                value={appleId}
                onChange={(e) => setAppleId(e.target.value)}
                placeholder="your_email@icloud.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">App-Specific Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                required
                disabled={loading}
              />
              <small className="help-text">
                Generate an app-specific password at{' '}
                <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer">
                  appleid.apple.com
                </a>
              </small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect to iCloud'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA}>
            <div className="form-group">
              <label htmlFor="twoFACode">Two-Factor Authentication Code</label>
              <input
                id="twoFACode"
                type="text"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                disabled={loading}
                autoFocus
              />
              <small className="help-text">
                Enter the 6-digit code sent to your trusted device
              </small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AuthPanel

