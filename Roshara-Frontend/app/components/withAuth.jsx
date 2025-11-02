// components/withAuth.jsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@context/AuthContext";

export default function withAuth(Component) {
  return function Protected(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) router.replace("/auth/login");
    }, [loading, user, router]);

    if (loading || !user) return <div className="p-6">Loading...</div>;
    return <Component {...props} />;
  };
}
