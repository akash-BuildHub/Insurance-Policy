// Vite SPA entry — sets up the TanStack Router and React Query client.
import "./styles.css";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import { AuthProvider, useAuthContext } from "./lib/auth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: { queryClient, auth: undefined! }, // populated by RouterWithAuth below
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function RouterWithAuth() {
  const auth = useAuthContext();
  return <RouterProvider router={router} context={{ queryClient, auth }} />;
}

const root = document.getElementById("root")!;
ReactDOM.createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterWithAuth />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
