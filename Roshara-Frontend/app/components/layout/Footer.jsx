"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#f8f7f5] border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-10 text-gray-700">
        {/* Logo + About */}
        <div>
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/Roshara_logo.png"
              alt="Roshara"
              width={180}
              height={50}
              className="object-contain"
            />
          </Link>
          <p className="text-sm leading-relaxed">
            Tailored, not stitched — Roshara offers curated traditional wear
            crafted with elegance and comfort in mind.
          </p>
        </div>

        {/* Shop */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/new-arrivals" className="hover:underline">
                New Arrivals
              </Link>
            </li>
            <li>
              <Link href="/shop" className="hover:underline">
                Shop All
              </Link>
            </li>
            <li>
              <Link href="/collections" className="hover:underline">
                Shop by Collections
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:underline">
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/about/shipping-returns" className="hover:underline">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/about/shipping-returns" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Phone size={16} /> +91 9324103174
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} /> roshara.official@gmail.com
            </li>
            <li className="flex items-center gap-2">
              <Instagram size={16} />
              <Link
                href="https://www.instagram.com/roshara.official"
                target="_blank"
                className="hover:underline"
              >
                @roshara.official
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Roshara. All rights reserved.
      </div>
    </footer>
  );
}
