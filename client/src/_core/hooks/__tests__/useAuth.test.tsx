import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth, getAuthToken, setAuthToken, markAuthActive, clearAuthActive } from '../useAuth';

vi.mock('@/lib/trpc', () => {
  const useMutation = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });
  const useQuery = vi.fn().mockReturnValue({ data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() });
  const useUtils = vi.fn().mockReturnValue({ 
    auth: { me: { invalidate: vi.fn(), setData: vi.fn() } },
    client: { auth: { logout: { mutate: vi.fn() } } }
  });
  return {
    trpc: {
      useUtils,
      auth: {
        login: { useMutation },
        register: { useMutation },
        forgotPassword: { useMutation },
        resetPassword: { useMutation },
        verifyEmail: { useMutation },
        verifyRecoveryOtp: { useMutation },
        me: { useQuery }
      }
    }
  };
});

describe('useAuth utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('getAuthToken returns null if not set', () => {
    expect(getAuthToken()).toBeNull();
  });

  it('setAuthToken sets token in local and session storage', () => {
    setAuthToken('test-token');
    expect(localStorage.getItem('auth_token_v2')).toBe('test-token');
    expect(sessionStorage.getItem('auth_active')).toBe('1');
    expect(getAuthToken()).toBe('test-token');
  });

  it('markAuthActive sets session storage', () => {
    markAuthActive();
    expect(sessionStorage.getItem('auth_active')).toBe('1');
  });

  it('clearAuthActive removes from both storages', () => {
    setAuthToken('test-token');
    clearAuthActive();
    expect(localStorage.getItem('auth_token_v2')).toBeNull();
    expect(sessionStorage.getItem('auth_active')).toBeNull();
  });
});

describe('useAuth hook', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls logout correctly', async () => {
    setAuthToken('test-token');
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.logout();
    });
    
    expect(localStorage.getItem('auth_token_v2')).toBeNull();
    expect(sessionStorage.getItem('auth_active')).toBeNull();
  });
  
  it('calls refresh correctly', async () => {
    const { trpc } = await import('@/lib/trpc');
    const mockRefetch = vi.fn();
    trpc.auth.me.useQuery.mockReturnValue({
      data: { id: 1, name: 'Test User' },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toEqual({ id: 1, name: 'Test User' });
    expect(result.current.isAuthenticated).toBe(true);
    
    act(() => {
      result.current.refresh();
    });
    
    expect(mockRefetch).toHaveBeenCalled();
  });
});
