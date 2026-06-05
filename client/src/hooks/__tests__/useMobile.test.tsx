import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useIsMobile } from '../useMobile';

describe('useIsMobile', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;
  let mockMatchMedia: any;
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    addEventListenerSpy = vi.fn();
    removeEventListenerSpy = vi.fn();
    mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.innerWidth = originalInnerWidth;
  });

  it('returns true when window.innerWidth is less than 768', () => {
    window.innerWidth = 500;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false when window.innerWidth is 768 or greater', () => {
    window.innerWidth = 800;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('updates state when window is resized via media query change event', () => {
    window.innerWidth = 800;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate window resize and media query event
    act(() => {
      window.innerWidth = 500;
      // Get the change handler registered in useEffect
      const onChangeHandler = addEventListenerSpy.mock.calls[0][1];
      onChangeHandler();
    });

    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy.mock.calls[0][0]).toBe('change');
  });
});
