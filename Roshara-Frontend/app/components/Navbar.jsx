"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Heart, ShoppingBag, User, ChevronDown } from "lucide-react";

import { useAuth } from "@context/AuthContext";
import { useCart } from "@context/CartContext";
import { useWishlist } from "@context/WishlistContext";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { user, logout } = useAuth();
  const cartItems = useCart()?.items || [];
  const { items: wishlistItems } = useWishlist();

  const cartCount = cartItems.reduce((sum, it) => sum + (it.qty || 0), 0);
  const wishlistCount = wishlistItems.length;

  useEffect(() => setMenuOpen(false), [pathname]);

  // ===== Desktop "About" dropdown state (click-to-toggle) =====
  const [aboutOpen, setAboutOpen] = useState(false);

  // ===== Desktop "Shop" dropdown (hover) =====
  const shopRef = useRef(null);

  // Close dropdowns on outside click (keeps behavior stable)
  useEffect(() => {
    const onDoc = (e) => {
      if (shopRef.current && !shopRef.current.contains(e.target)) {
        // keep hover-based behavior (no explicit open state)
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const isTransparent = isHome && !scrolled;
  const textClass = isTransparent ? "text-white" : "text-black";
  const hoverClass = isTransparent ? "hover:text-gray-300" : "hover:text-gray-700";
  const frameClass = isTransparent
    ? "bg-transparent border-transparent"
    : "bg-white/85 backdrop-blur border-gray-200 shadow-sm";

  // Active underline helper
  const isActive = (path) => pathname === path || pathname?.startsWith(path + "/");
  const isAboutActive =
    pathname === "/about" || pathname.startsWith("/policies/shipping-returns");

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${frameClass}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-1">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" aria-label="Roshara home">
            <Image
              src="/Roshara_logo.png"
              alt="Roshara"
              width={200}
              height={60}
              className="cursor-default"
              priority
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <ul className={`hidden md:flex items-center gap-8 ${textClass}`}>
          <li>
            <Link
              href="/new-arrivals"
              className={`${hoverClass} ${
                isActive("/new-arrivals") ? "underline underline-offset-8" : ""
              }`}
            >
              New Arrivals
            </Link>
          </li>

          {/* SHOP dropdown */}
          <li className="relative group" ref={shopRef}>
            <div className={`flex items-center gap-1 cursor-pointer ${hoverClass} py-2`}>
              <span className={`${isActive("/shop") || isActive("/collections") ? "underline underline-offset-8 decoration-2" : ""}`}>
                Shop
              </span>
              <ChevronDown size={16} className="transition-transform duration-200 group-hover:rotate-180" />
            </div>

            {/* Dropdown on hover */}
            <div
              className="
                absolute left-0
                top-[100%]
                w-44
                rounded-md border bg-white text-black shadow-lg
                opacity-0 scale-95 pointer-events-none
                group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
                transition-all duration-200 ease-out
                z-50
              "
            >
              <Link href="/shop" className="block px-3 py-2 rounded hover:bg-gray-50">
                Shop All
              </Link>
              <Link href="/collections" className="block px-3 py-2 rounded hover:bg-gray-50">
                Shop By Collections
              </Link>
            </div>
          </li>

          <li>
            <Link
              href="/contact"
              className={`${hoverClass} ${isActive("/contact") ? "underline underline-offset-8" : ""}`}
            >
              Contact Us
            </Link>
          </li>

          {/* About */}
          <li className="relative group">
            <div className={`flex items-center gap-1 cursor-pointer ${hoverClass} py-2`}>
              <span className={`${isAboutActive ? "underline underline-offset-8 decoration-2" : ""}`}>
                About
              </span>
              <ChevronDown size={16} className="transition-transform duration-200 group-hover:rotate-180" />
            </div>
            <div
              className="
                absolute left-0
                top-[100%]
                w-64
                rounded-md border bg-white text-black shadow-lg
                opacity-0 scale-95 pointer-events-none
                group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
                transition-all duration-200 ease-out
                z-50
              "
            >
              <Link href="/about" className="block px-3 py-2 rounded hover:bg-gray-50">
                About ROSHARA
              </Link>
              <Link href="/about/shipping-returns" className="block px-3 py-2 rounded hover:bg-gray-50">
                Shipping & Return Policy
              </Link>
            </div>
          </li>
        </ul>

        {/* Icons + Auth (Desktop) */}
        <div className={`hidden md:flex items-center space-x-4 ${textClass}`}>
          <Link href="/wishlist" className={`relative flex items-center ${hoverClass}`} aria-label="Wishlist">
            <Heart />
            <span className="ml-2 text-sm">{wishlistCount}</span>
          </Link>
          <Link href="/cart" className={`relative flex items-center ${hoverClass}`} aria-label="Cart">
            <ShoppingBag />
            <span className="ml-2 text-sm">{cartCount}</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <UserMenu user={user} isTransparent={isTransparent} onLogout={logout} />
              {(user.role === "admin" || user.isAdmin) && (
                <Link
                  href="/admin"
                  className={`px-3 py-1 border rounded ${isTransparent ? "border-white text-white" : "border-black text-black"}`}
                  aria-label="Admin dashboard"
                >
                  Admin
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className={`flex items-center gap-2 ${hoverClass}`}>
                <User />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link href="/auth/register" className={`text-sm ${hoverClass}`}>
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <svg className={`w-6 h-6 ${textClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden bg-white text-black px-6 py-4 shadow">
          <ul className="space-y-2">
            <li>
              <Link href="/new-arrivals" className="block font-medium">New Arrivals</Link>
            </li>
            <li>
              <Link href="/shop" className="block font-medium">Shop All</Link>
            </li>
            <li>
              <Link href="/collections" className="block font-medium">Shop By Collections</Link>
            </li>

            <li className="pt-2 border-t">
              <div className="font-semibold mb-1">About</div>
              <div className="ml-2 space-y-1">
                <Link href="/about" className="block">About ROSHARA</Link>
                <Link href="/policies/shipping-returns" className="block">Shipping & Return Policy</Link>
              </div>
            </li>

            {(user?.role === "admin" || user?.isAdmin) && (
              <li className="pt-2">
                <Link href="/admin" className="block font-semibold">Admin Dashboard →</Link>
              </li>
            )}

            {user ? (
              <>
                <li className="pt-2"><Link href="/account" className="block">My Account</Link></li>
                <li><Link href="/account/orders" className="block">My Orders</Link></li>
                <li><button onClick={logout} className="block w-full text-left">Logout</button></li>
              </>
            ) : (
              // <-- UPDATED: show both Login + Register in the mobile sidebar
              <>
                <li className="pt-2">
                  <Link href="/auth/login" className="block font-medium">Login</Link>
                </li>
                <li>
                  <Link href="/auth/register" className="block font-medium">Register</Link>
                </li>
              </>
            )}

            <li className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <Link href="/wishlist" className="flex items-center gap-2"><Heart /><span>Wishlist ({wishlistCount})</span></Link>
                <Link href="/cart" className="flex items-center gap-2"><ShoppingBag /><span>Cart ({cartCount})</span></Link>
              </div>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

/** Small inline dropdown just for the desktop “Hi, {name} ▾” */
// Replace the old UserMenu function with this one
function UserMenu({ user, isTransparent, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // helper to close and optionally navigate (caller Link will handle navigation)
  const closeAnd = (fn) => {
    setOpen(false);
    if (typeof fn === "function") fn();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className={`flex items-center gap-1 ${isTransparent ? "text-white" : "text-black"}`}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        aria-label="User menu"
        type="button"
      >
        Hi, {user.name?.split(" ")[0] || "User"} <span className="translate-y-1px">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User options"
          className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg text-sm z-50 ring-1 ring-black/5"
        >
          <Link
            href="/account"
            onClick={() => closeAnd()}
            className="block px-4 py-2 hover:bg-gray-50 text-gray-800 whitespace-normal break-words"
            role="menuitem"
          >
            My Account
          </Link>

          <Link
            href="/account/orders"
            onClick={() => closeAnd()}
            className="block px-4 py-2 hover:bg-gray-50 text-gray-800 whitespace-normal break-words"
            role="menuitem"
          >
            My Orders
          </Link>

          {(user.role === "admin" || user.isAdmin) && (
            <Link
              href="/admin"
              onClick={() => closeAnd()}
              className="block px-4 py-2 hover:bg-gray-50 text-gray-800 whitespace-normal break-words"
              role="menuitem"
            >
              Admin
            </Link>
          )}

          <button
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
            role="menuitem"
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

