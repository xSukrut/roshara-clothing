"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@context/AuthContext";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-1"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
      >
        Hi, {user.name?.split(" ")[0] || "User"}
        <span className="inline-block transform translate-y-1px">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow text-sm z-50">
          <Link
            href="/account"
            className="block px-4 py-2 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            My Account
          </Link>
          <Link
            href="/account/orders"
            className="block px-4 py-2 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            My Orders
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              logout?.();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
