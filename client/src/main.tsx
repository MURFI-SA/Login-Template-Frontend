import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { clearAuthActive } from "@/_core/hooks/useAuth";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  clearAuthActive();
  if (window.location.pathname !== "/login") {
    history.pushState(null, "", "/login");
    dispatchEvent(new PopStateEvent("popstate"));
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// AppRouter is typed as AnyRouter in `types/api.ts` (no concrete backend type
// available in this template). Cast to `any` so .createClient / .Provider
// resolve. Replace AppRouter with a real import for full type safety.
const trpcAny = trpc as any;
const trpcClient = trpcAny.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL || ""}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        const token = localStorage.getItem("auth_token_v2");
        return fetch(url, {
          ...options,
          credentials: "include", // Send HttpOnly cookies
          headers: {
            ...options?.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpcAny.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpcAny.Provider>
);
