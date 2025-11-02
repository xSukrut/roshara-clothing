"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/auth/login");
      else if (user.role !== "admin") router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) return <p className="text-center mt-20">Loading...</p>;

  return <>{children}</>;
}
