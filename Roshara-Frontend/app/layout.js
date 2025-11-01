// app/layout.jsx
"use client";

import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import Navbar from "./components/Navbar";
import ShowMiniCart from "./components/ShowMiniCart";
import Footer from "./components/layout/Footer";

export const metadata = {
  title: "Roshara",
  description: "Luxury fashion store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Navbar />
              <ShowMiniCart />
              <main className="pt-16">{children}</main>
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
