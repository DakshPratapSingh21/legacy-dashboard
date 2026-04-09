'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import AsblLogo from './AsblLogo';

interface HeaderProps {
  mode: 'demo' | 'live';
  currentCampaignDay: number | null;
  lastRefresh: string;
  landmarkDays?: number;
  broadwayDays?: number;
}

export default function Header({ mode, currentCampaignDay, landmarkDays, broadwayDays }: HeaderProps) {
  const { theme, toggleTheme, kioskMode, toggleKiosk } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{ maxWidth: kioskMode ? '100%' : '1400px', padding: kioskMode ? '0 2rem' : '0 1.5rem', height: kioskMode ? '56px' : '64px' }}
      >
        {/* Left — Logo + Identity */}
        <div className="flex items-center gap-3">
          <AsblLogo
            color={theme === 'dark' ? '#ffffff' : '#000000'}
            height={kioskMode ? 22 : 26}
          />
          <div
            className="w-px self-stretch"
            style={{ background: 'var(--border-subtle)', margin: '12px 0' }}
          />
          <div>
            <h1
              className="font-bold tracking-tight"
              style={{
                color: 'var(--text-primary)',
                fontSize: kioskMode ? '13px' : '14px',
              }}
            >
              Legacy Pre-RERA Calling Intelligence
            </h1>
            {!kioskMode && (
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {broadwayDays && <span>Broadway <strong style={{ color: 'var(--text-secondary)' }}>{broadwayDays}</strong> days</span>}
                {landmarkDays && <span>Landmark <strong style={{ color: 'var(--text-secondary)' }}>{landmarkDays}</strong> days</span>}
              </div>
            )}
          </div>
        </div>

        {/* Right — Status badge + kiosk + theme toggle */}
        <div className="flex items-center gap-2">
          {mode === 'demo' ? (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase"
              style={{
                background: 'var(--accent-muted)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                opacity: 0.9,
                letterSpacing: '0.05em',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                }}
              />
              Live
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase"
              style={{
                background: 'var(--positive-muted)',
                color: 'var(--positive)',
                border: '1px solid var(--positive)',
                letterSpacing: '0.05em',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  background: 'var(--positive)',
                  boxShadow: '0 0 6px var(--positive)',
                }}
              />
              Live — Day {currentCampaignDay}
            </span>
          )}

          {/* Kiosk mode toggle */}
          <button
            onClick={toggleKiosk}
            className="w-9 h-9 rounded-md flex items-center justify-center transition-colors duration-200 min-h-[44px] min-w-[44px]"
            style={{
              background: kioskMode ? 'var(--accent-muted)' : 'var(--bg-hover)',
              color: kioskMode ? 'var(--accent)' : 'var(--text-secondary)',
              border: kioskMode ? '1px solid var(--accent)' : '1px solid transparent',
            }}
            aria-label={kioskMode ? 'Exit presentation mode' : 'Enter presentation mode'}
            title={kioskMode ? 'Exit presentation mode' : 'Presentation mode (TV)'}
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-md flex items-center justify-center transition-colors duration-200 min-h-[44px] min-w-[44px]"
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text-secondary)',
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
