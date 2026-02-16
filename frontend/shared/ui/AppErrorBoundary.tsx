import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '@/services/logger.service'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError('app_error_boundary', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
          style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}
        >
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-3">Algo deu errado</h1>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Ocorreu um erro inesperado. Recarregue a pagina para continuar.
            </p>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-lg font-medium"
              style={{
                background: 'var(--gradient-primary)',
                color: 'white',
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
