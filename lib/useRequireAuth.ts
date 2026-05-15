import { useEffect } from "react";
import { router, type Href } from "expo-router";
import { useAuth } from "@/context/AuthContext";

/** Redirects logged-out users to the welcome screen. Use in protected layouts/screens. */
export function useRequireAuth(redirectTo: Href = "/") {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [loading, user, redirectTo]);
  return { user, loading, isReady: !loading && !!user };
}
