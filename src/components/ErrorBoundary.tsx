import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      
      try {
        // Check if it's a Firestore error JSON
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Bespoke Service Interruption: ${parsed.error} during ${parsed.operationType} operation.`;
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-off-white text-ink text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-serif italic tracking-tight">Service Interruption</h2>
            <p className="text-sm text-ink/60 max-w-md mx-auto uppercase tracking-widest font-bold">
              {errorMessage}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            Return to Luxa Wach
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
