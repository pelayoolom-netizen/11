import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { ArrowLeft, Check, Globe2, Lock, ShieldCheck } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { COUNTRIES_ES, LANGUAGES_ES } from '../lib/perspectives';
import { BrandLockup } from './BrandMark';

interface AuthScreenProps {
  mode: 'signin' | 'register';
  onSwitchMode: (mode: 'signin' | 'register') => void;
  onBackToLanding: () => void;
}

export function AuthScreen({ mode, onSwitchMode, onBackToLanding }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setError('Has cerrado la ventana antes de completar la autenticación.');
      } else if (code === 'auth/unauthorized-domain') {
        setError('Este dominio no está autorizado en la configuración de Firebase Authentication.');
      } else {
        setError('No se pudo completar el acceso con Google. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#292820] flex flex-col">
      <header className="h-18 px-6 sm:px-10 border-b border-[#E8E3D8] flex items-center justify-between bg-[#FAF9F5]">
        <BrandLockup onClick={onBackToLanding} />
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#777367] hover:text-[#292820] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#E8E3D8] rounded-sm p-8 sm:p-10 shadow-editorial space-y-7">
          <div className="space-y-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
              {mode === 'signin' ? 'Acceso a tu cuenta' : 'Nuevo registro'}
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
              {mode === 'signin' ? 'Iniciar sesión en ANTIRRATHETO' : 'Crear cuenta en ANTIRRATHETO'}
            </h1>
            <p className="text-sm text-[#777367]">
              {mode === 'signin'
                ? 'Retoma tu perfil ideológico, salas activas e historial de debates.'
                : 'Configura tu usuario único, descubre tu brújula política y empieza a debatir.'}
            </p>
          </div>

          {error && (
            <div className="bg-[#FAF9F5] border border-[#C97B63] text-[#793B2B] text-xs p-3.5 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-3.5 px-5 bg-[#292820] hover:bg-[#3F3D32] disabled:opacity-60 text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#FFFFFF"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            {loading
              ? 'Conectando...'
              : mode === 'signin'
                ? 'Continuar con Google'
                : 'Registrarse con Google'}
          </button>

          <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-4 space-y-2 text-xs text-[#777367]">
            <div className="flex items-center gap-2 text-[#292820] font-medium">
              <Lock className="w-3.5 h-3.5 text-[#A18450]" />
              Privacidad y control de datos
            </div>
            <p className="leading-relaxed">
              Tus respuestas al test ideológico y tu perfil son privados por defecto. No almacenamos grabaciones de vídeo de tus debates.
            </p>
          </div>

          <div className="text-center text-xs text-[#777367] pt-2 border-t border-[#E8E3D8]">
            {mode === 'signin' ? (
              <span>
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('register')}
                  className="text-[#A18450] hover:text-[#79613B] font-medium underline underline-offset-4 cursor-pointer"
                >
                  Crear cuenta nueva
                </button>
              </span>
            ) : (
              <span>
                ¿Ya participas en ANTIRRATHETO?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('signin')}
                  className="text-[#A18450] hover:text-[#79613B] font-medium underline underline-offset-4 cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface OnboardingProfileProps {
  initialName: string;
  email: string;
  existingAccount?: {
    username?: string;
    displayName?: string;
    country?: string;
    city?: string;
    languages?: string[];
    isPublicProfile?: boolean;
    showAxesPublicly?: boolean;
  } | null;
  onComplete: (data: {
    username: string;
    displayName: string;
    country: string;
    city: string;
    languages: string[];
    isPublicProfile: boolean;
    showAxesPublicly: boolean;
    startTestNow: boolean;
  }) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function OnboardingProfile({
  initialName,
  email,
  existingAccount,
  onComplete,
  onSignOut,
}: OnboardingProfileProps) {
  const defaultUsername = (
    existingAccount?.username ||
    initialName ||
    email.split('@')[0] ||
    'ciudadano'
  )
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 20);

  const [username, setUsername] = useState(
    defaultUsername.length >= 3 ? defaultUsername : `usuario_${Date.now().toString().slice(-4)}`
  );
  const [displayName, setDisplayName] = useState(
    existingAccount?.displayName || initialName || ''
  );
  const [country, setCountry] = useState(existingAccount?.country || 'España');
  const [city, setCity] = useState(existingAccount?.city || '');
  const [languages, setLanguages] = useState<string[]>(
    existingAccount?.languages && existingAccount.languages.length > 0
      ? existingAccount.languages
      : ['Español']
  );
  const [isPublicProfile, setIsPublicProfile] = useState(
    Boolean(existingAccount?.isPublicProfile)
  );
  const [showAxesPublicly, setShowAxesPublicly] = useState(
    Boolean(existingAccount?.showAxesPublicly)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.length > 1 ? prev.filter((l) => l !== lang) : prev;
      }
      return prev.length < 5 ? [...prev, lang] : prev;
    });
  };

  const handleSubmit = async (startTestNow: boolean) => {
    setError(null);
    const cleanUser = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,28}$/.test(cleanUser)) {
      setError(
        'El nombre de usuario debe tener entre 3 y 28 caracteres (solo letras minúsculas, números y guion bajo).'
      );
      return;
    }
    if (!displayName.trim()) {
      setError('Introduce tu nombre público o alias de debate.');
      return;
    }
    setSaving(true);
    try {
      await onComplete({
        username: cleanUser,
        displayName: displayName.trim(),
        country,
        city: city.trim(),
        languages,
        isPublicProfile,
        showAxesPublicly,
        startTestNow,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar tu perfil inicial.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#292820] flex flex-col">
      <header className="h-18 px-6 sm:px-10 border-b border-[#E8E3D8] flex items-center justify-between bg-white">
        <BrandLockup />
        <button
          type="button"
          onClick={onSignOut}
          className="text-xs uppercase tracking-[0.16em] text-[#777367] hover:text-[#292820] cursor-pointer"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-10 sm:py-14">
        <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-10 shadow-editorial space-y-8">
          <div className="space-y-2 border-b border-[#E8E3D8] pb-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
              Bienvenida a ANTIRRATHETO
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
              Configura tu ficha de participante
            </h1>
            <p className="text-sm text-[#777367]">
              Cuenta verificada con <span className="text-[#292820] font-medium">{email}</span>. El siguiente paso será descubrir tu mapa ideológico en el cuestionario inicial.
            </p>
          </div>

          {error && (
            <div className="bg-[#FAF9F5] border border-[#C97B63] text-[#793B2B] text-xs p-3.5 rounded-sm">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                Nombre de usuario (@alias) *
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="ejemplo_madrid"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              />
              <span className="text-[11px] text-[#777367]">
                Permite encontrarte si activas el perfil público y añadir amistades.
              </span>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                Nombre visible en sala *
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Carlos Martín"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                País *
              </span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              >
                {COUNTRIES_ES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium">
                Ciudad o comunidad (opcional)
              </span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Valencia"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm focus:outline-none focus:border-[#A18450]"
              />
            </label>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[#777367] font-medium flex items-center gap-2">
              <Globe2 className="w-3.5 h-3.5 text-[#A18450]" />
              Idiomas en los que puedes debatir
            </span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES_ES.map((lang) => {
                const active = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 text-xs rounded-sm border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#292820] text-white border-[#292820]'
                        : 'bg-[#FAF9F5] text-[#292820] border-[#E8E3D8] hover:border-[#A18450]'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 text-[#E6D8B9]" />}
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Preferencias iniciales de privacidad
            </div>
            <label className="flex items-start gap-3 text-sm text-[#292820] cursor-pointer">
              <input
                type="checkbox"
                checked={isPublicProfile}
                onChange={(e) => setIsPublicProfile(e.target.checked)}
                className="mt-1 accent-[#A18450]"
              />
              <span>
                Permitir que otros usuarios me encuentren buscando mi <span className="font-medium">@usuario</span> para enviarme solicitudes de amistad.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-[#292820] cursor-pointer">
              <input
                type="checkbox"
                checked={showAxesPublicly}
                onChange={(e) => setShowAxesPublicly(e.target.checked)}
                className="mt-1 accent-[#A18450]"
              />
              <span>
                Mostrar un resumen general de mi orientación ideológica en mi ficha pública (desactivado por defecto).
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="flex-1 py-3.5 px-6 bg-[#A18450] hover:bg-[#79613B] disabled:opacity-60 text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm transition-colors cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar y hacer el test ideológico'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="py-3.5 px-5 bg-white border border-[#E8E3D8] hover:border-[#A18450] text-[#292820] text-xs uppercase tracking-[0.16em] font-medium rounded-sm transition-colors cursor-pointer"
            >
              Ir primero al panel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
