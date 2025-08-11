import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console with detailed information
    console.error('=== ERROR BOUNDARY CAUGHT ERROR ===')
    console.error('Error:', error)
    console.error('Error Message:', error.message)
    console.error('Error Stack:', error.stack)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Error Info:', errorInfo)
    console.error('=== END ERROR DETAILS ===')
    
    // Store error details for debugging
    this.setState({ 
      hasError: true, 
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '500px'
          }}>
            <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
              Oops! Something went wrong
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              The application encountered an error. This might be due to a connection issue or data loading problem.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              style={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
