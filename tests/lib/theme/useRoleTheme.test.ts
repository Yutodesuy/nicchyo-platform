import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRoleTheme } from '../../../lib/theme/useRoleTheme';
import { useAuth } from '../../../lib/auth/AuthContext';
import { ROLE_THEMES, DEFAULT_THEME } from '../../../lib/theme/roleTheme';

// Mock useAuth hook
vi.mock('../../../lib/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useRoleTheme hook', () => {
  it('returns super_admin theme when user role is super_admin', () => {
    (useAuth as any).mockReturnValue({ user: { role: 'super_admin' } });
    const { result } = renderHook(() => useRoleTheme());
    expect(result.current).toEqual(ROLE_THEMES.super_admin);
  });

  it('returns vendor theme when user role is vendor', () => {
    (useAuth as any).mockReturnValue({ user: { role: 'vendor' } });
    const { result } = renderHook(() => useRoleTheme());
    expect(result.current).toEqual(ROLE_THEMES.vendor);
  });

  it('returns general_user theme when user role is general_user', () => {
    (useAuth as any).mockReturnValue({ user: { role: 'general_user' } });
    const { result } = renderHook(() => useRoleTheme());
    expect(result.current).toEqual(ROLE_THEMES.general_user);
  });

  it('returns DEFAULT_THEME when user is null', () => {
    (useAuth as any).mockReturnValue({ user: null });
    const { result } = renderHook(() => useRoleTheme());
    expect(result.current).toEqual(DEFAULT_THEME);
  });

  it('returns DEFAULT_THEME when user is undefined', () => {
    (useAuth as any).mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useRoleTheme());
    expect(result.current).toEqual(DEFAULT_THEME);
  });
});
