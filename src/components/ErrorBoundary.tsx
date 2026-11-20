import React from 'react';
import { BrandLockup } from './BrandMark';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Se ha producido un error inesperado en la interfaz.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error de ANTIRRATHETO:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly =
        'Ha ocurrido un problema inesperado al cargar la sesión. Puedes recargar la página para continuar.';
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          friendly = `Error de permisos o sincronización: ${parsed.error}`;
        }
      } catch {
        if (this.state.message) {
          friendly = this.state.message;
        }
      }

      return (
        <div className="min-h-screen bg-[#FAF9F5] text-[#292820] flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E8E3D8] rounded-sm p-8 shadow-editorial text-center space-y-5">
            <div className="flex justify-center">
              <BrandLockup />
            </div>
            <h2 className="font-editorial text-2xl font-semibold text-[#292820]">
              Algo ha interrumpido esta vista
            </h2>
            <p className="text-sm text-[#777367] leading-relaxed">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm transition-colors cursor-pointer"
            >
              Recargar ANTIRRATHETO
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
