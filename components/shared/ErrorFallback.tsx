import React from 'react';
import { FallbackProps } from 'react-error-boundary';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  // Eine vollständige Neuladung ist oft der sicherste Weg, um sich von einem
  // unerwarteten Anwendungszustand zu erholen.
  const handleReload = () => {
    window.location.reload();
  };
  
  return (
    <div className="flex justify-center items-center h-full p-8 bg-background">
      <div className="bg-card p-8 sm:p-12 rounded-lg shadow-xl w-full max-w-2xl text-center">
        <h1 className="text-2xl font-semibold text-danger mb-4">Ein Fehler ist aufgetreten</h1>
        <p className="text-text-light mb-6">
          Entschuldigung, in diesem Bereich der Anwendung ist ein unerwartetes Problem aufgetreten.
          Ein Neuladen der Seite behebt das Problem in der Regel.
        </p>
        <button
          onClick={handleReload}
          className="py-2 px-6 font-medium rounded-md bg-primary text-white hover:bg-primary-hover"
        >
          Seite neu laden
        </button>
        <details className="mt-8 text-left bg-secondary p-4 rounded-md text-sm text-text-light">
          <summary className="font-medium cursor-pointer">Technische Details</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs overflow-auto">
            {error?.message}
            {error?.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ErrorFallback;