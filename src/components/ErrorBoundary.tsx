'use client'

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
  const [hasError, setHasError] = useState(false);
  const t = useTranslations('common');

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error caught by boundary:', error.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="bg-clay/[0.07] border border-clay/30 rounded-xl p-6 text-center">
        <h3 className="text-clay font-bold mb-2">Error de carga</h3>
        <p className="text-clay mb-4">
          Hubo un problema al cargar los productos. Por favor, intenta recargar la página.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-paper px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return <>{children}</>;
};