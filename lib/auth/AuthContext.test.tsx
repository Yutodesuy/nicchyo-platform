import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import React from 'react';
import * as supabaseClientModule from '@/utils/supabase/client';

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('AuthContext', () => {
  let mockSupabaseClient: any;
  let mockAuthSession: any;
  let onAuthStateChangeUnsubscribe: any;
  let authStateChangeCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();

    onAuthStateChangeUnsubscribe = vi.fn();
    mockAuthSession = {
      data: { session: null }
    };

    mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockImplementation(() => Promise.resolve(mockAuthSession)),
        onAuthStateChange: vi.fn().mockImplementation((callback) => {
          authStateChangeCallback = callback;
          return { data: { subscription: { unsubscribe: onAuthStateChangeUnsubscribe } } };
        }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn().mockResolvedValue({}),
        updateUser: vi.fn(),
      }
    };

    (supabaseClientModule.createClient as any).mockReturnValue(mockSupabaseClient);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('initialization', () => {
    it('initializes as logged out when no session exists', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('initializes as logged in when session exists', async () => {
      mockAuthSession = {
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'test@example.com',
              app_metadata: {},
              user_metadata: { full_name: 'Test User' }
            }
          }
        }
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  describe('loginWithCredentials', () => {
    it('logs in successfully and maps user data', async () => {
      const mockUser = {
        id: 'user-2',
        email: 'vendor@example.com',
        app_metadata: { role: 'vendor' },
        user_metadata: { vendorId: 10, full_name: 'Shop Owner' }
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.loginWithCredentials(' vendor@example.com ', 'password');
      });

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'vendor@example.com',
        password: 'password',
        options: undefined,
      });

      expect(loginResult).toMatchObject({
        id: 'user-2',
        email: 'vendor@example.com',
        role: 'vendor',
        vendorId: 10,
        name: 'Shop Owner',
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user).toEqual(loginResult);
    });

    it('returns null on login failure', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid credentials'),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.loginWithCredentials('test@example.com', 'wrong');
      });

      expect(loginResult).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('updates user profile successfully', async () => {
      mockAuthSession = {
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'old@example.com',
              app_metadata: {},
              user_metadata: { name: 'Old Name' }
            }
          }
        }
      };

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'new@example.com',
            app_metadata: {},
            user_metadata: { name: 'New Name', phone: '1234' }
          }
        },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateProfile({
          name: 'New Name',
          email: 'new@example.com',
          phone: '1234',
          avatarUrl: undefined
        });
      });

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        data: { name: 'New Name', phone: '1234', avatarUrl: '' },
        email: 'new@example.com',
      });

      expect(result.current.user).toMatchObject({
        name: 'New Name',
        email: 'new@example.com',
        phone: '1234'
      });
    });

    it('does nothing if no user is logged in', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateProfile({ name: 'Test' });
      });

      expect(mockSupabaseClient.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('logs out user and resets state', async () => {
      mockAuthSession = {
        data: {
          session: {
            user: { id: 'user-1', email: 'test@example.com', app_metadata: {}, user_metadata: {} }
          }
        }
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoggedIn).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('permissions', () => {
    it('calculates super admin permissions', async () => {
      mockAuthSession = {
        data: {
          session: {
            user: { id: 'admin', email: 'admin@example.com', app_metadata: { role: 'super_admin' }, user_metadata: {} }
          }
        }
      };

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => { expect(result.current.isLoading).toBe(false); });

      const p = result.current.permissions;
      expect(p.isSuperAdmin).toBe(true);
      expect(p.canManageAllShops).toBe(true);
      expect(p.canModerateContent).toBe(true);
      expect(p.canEditShop(10)).toBe(true); // Super admin can edit any shop
    });

    it('calculates vendor permissions', async () => {
      mockAuthSession = {
        data: {
          session: {
            user: { id: 'vendor', email: 'vendor@example.com', app_metadata: { role: 'vendor' }, user_metadata: { vendorId: 10 } }
          }
        }
      };

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => { expect(result.current.isLoading).toBe(false); });

      const p = result.current.permissions;
      expect(p.isVendor).toBe(true);
      expect(p.isSuperAdmin).toBe(false);
      expect(p.canEditShop(10)).toBe(true); // Can edit own shop
      expect(p.canEditShop(20)).toBe(false); // Cannot edit other shops
    });
  });

  describe('auth state change listener', () => {
    it('updates state when session changes externally', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => { expect(result.current.isLoading).toBe(false); });

      expect(result.current.isLoggedIn).toBe(false);

      act(() => {
        authStateChangeCallback('SIGNED_IN', {
          user: { id: 'new-user', email: 'new@example.com', app_metadata: {}, user_metadata: {} }
        });
      });

      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user?.id).toBe('new-user');

      act(() => {
        authStateChangeCallback('SIGNED_OUT', null);
      });

      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('useAuth without provider', () => {
    it('throws error if used outside provider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
      consoleErrorSpy.mockRestore();
    });
  });
});
