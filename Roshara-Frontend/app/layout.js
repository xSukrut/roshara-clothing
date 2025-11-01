// app/layout.jsx
import "./globals.css";
import Navbar from "./components/Navbar";
import ShowMiniCart from "./components/ShowMiniCart";
import Footer from "./components/layout/Footer";
import Providers from "./providers"; // client-only wrapper for contexts

export const metadata = {
  title: "Roshara",
  description: "Luxury fashion store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <Navbar />
          <ShowMiniCart />
          <main className="pt-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
