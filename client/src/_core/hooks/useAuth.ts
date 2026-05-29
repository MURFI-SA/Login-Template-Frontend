import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

// Cookie is HttpOnly — managed by the backend.
// We just track if user has logged in during this browser session.
const SESSION_KEY = "auth_active";

export function getAuthToken() {
    return localStorage.getItem("auth_token_v2");
}

export function setAuthToken(token: string) {
    localStorage.setItem("auth_token_v2", token);
    sessionStorage.setItem(SESSION_KEY, "1");
}

export function markAuthActive() {
    sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearAuthActive() {
    localStorage.removeItem("auth_token_v2");
    sessionStorage.removeItem(SESSION_KEY);
}

export function useAuth() {
    const utils = (trpc as any).useUtils();

    // Always fire the me query — the auth cookie is HttpOnly so JS cannot
    // detect it via document.cookie or sessionStorage after a page refresh.
    // If no cookie → server returns UNAUTHORIZED → main.tsx redirects to /login.
    const meQuery = (trpc as any).auth.me.useQuery(undefined, {
        retry: 3,
        refetchOnWindowFocus: true,
        refetchInterval: 30 * 60 * 1000,
    });

    const logout = useCallback(async () => {
        try {
            await (utils as any).client.auth.logout.mutate();
        } catch {
            // ignore
        }
        clearAuthActive();
        (utils as any).auth.me.setData(undefined, null);
        await (utils as any).auth.me.invalidate();
    }, [utils]);

    const state = useMemo(() => {
        return {
            user: meQuery.data ?? null,
            loading: meQuery.isLoading || (meQuery.isFetching && !meQuery.data),
            error: meQuery.error ?? null,
            isAuthenticated: Boolean(meQuery.data),
        };
    }, [meQuery.data, meQuery.error, meQuery.isLoading, meQuery.isFetching]);

    return {
        ...state,
        refresh: () => meQuery.refetch(),
        logout,
    };
}
