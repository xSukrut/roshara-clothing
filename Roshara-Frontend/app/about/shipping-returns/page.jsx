// app/about/shipping-returns/page.jsx
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: "Shipping & Returns | Roshara",
  description: "Read Roshara’s shipping, returns, and exchange policy.",
};

export default function ShippingReturnsPage() {
  return (
    <main
      className={`min-h-screen bg-gradient-to-b from-[#fdfaf6] via-[#fdfcfb] to-[#faf7f2] py-16 px-6 ${inter.className}`}
    >
      <section className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md border border-gray-200 shadow-lg rounded-3xl px-8 md:px-14 py-10">
        <h1
          className={`${playfair.className} text-3xl md:text-4xl font-semibold text-[#3a1211] mb-3 text-center`}
        >
          Shipping & Returns / Exchange Policy
        </h1>

        <p className="text-center italic text-gray-600 mb-10">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        {/* Section 1 */}
        <div className="space-y-3 mb-10">
          <h2
            className={`${playfair.className} text-2xl text-[#4C1417] border-l-4 border-[#4C1417] pl-3`}
          >
            1. Shipping
          </h2>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed">
            <li>
              <strong>Processing:</strong> Each piece is handcrafted with care.
              Orders take <b>8–10 days</b> to ship.{" "}
              <em>Sale periods may have slight delays.</em>
            </li>
            <li>
              <strong>Tracking:</strong> Shared on dispatch via Email & WhatsApp.
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-3 mb-10">
          <h2
            className={`${playfair.className} text-2xl text-[#4C1417] border-l-4 border-[#4C1417] pl-3`}
          >
            2. Order Changes & Cancellations
          </h2>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed">
            <li>No cancellations or changes after placing an order.</li>
            <li>No modifications after shipment.</li>
            <li>
              Orders may be cancelled for stock or technical reasons, with a
              refund or store credit.
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-3 mb-10">
          <h2
            className={`${playfair.className} text-2xl text-[#4C1417] border-l-4 border-[#4C1417] pl-3`}
          >
            3. Returns & Exchanges
          </h2>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed">
            <li>
              <strong>Window:</strong> Exchange within <b>3 days</b> of delivery.
              Email{" "}
              <a
                href="mailto:roshara.official@gmail.com"
                className="text-[#4C1417] font-medium hover:underline"
              >
                roshara.official@gmail.com
              </a>
              .
            </li>
            <li>
              <strong>Not eligible:</strong> Custom sizes, international orders.
            </li>
            <li>
              <strong>Sale/COD orders:</strong> No bank refunds; exchange only
              (subject to availability).
            </li>
            <li>
              <strong>One-time exchange only.</strong>
            </li>
            <li>
              Items must be unused, unwashed, and returned with original
              packaging and tags intact.
            </li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="space-y-3 mb-10">
          <h2
            className={`${playfair.className} text-2xl text-[#4C1417] border-l-4 border-[#4C1417] pl-3`}
          >
            4. Refunds & Store Credit
          </h2>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed">
            <li>
              <b>Prepaid Orders:</b> Refunded to original method or store
              credit.
            </li>
            <li>
              <b>Sale / COD:</b> Exchange only; no bank refunds.
            </li>
            <li>
              COD fee (₹90) and shipping charges are non-refundable.
            </li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="space-y-3 mb-10">
          <h2
            className={`${playfair.className} text-2xl text-[#4C1417] border-l-4 border-[#4C1417] pl-3`}
          >
            5. Reverse Shipping Charges
          </h2>
          <p className="text-gray-700 leading-relaxed">
            <strong>No charge</strong> if a wrong or defective item is delivered
            by us. For size preferences or dislikes, a reverse pickup fee of{" "}
            <strong>₹100–₹150 per product</strong> applies.
          </p>
        </div>

        {/* Section 6 */}
        <div className="space-y-3 mb-10">
          <h2
            className={`${playfair.className} text-2xl text-[#4C1417] border-l-4 border-[#4C1417] pl-3`}
          >
            6. How to Initiate a Return / Exchange
          </h2>
          <ol className="list-decimal list-inside text-gray-700 leading-relaxed">
            <li>
              Email us with your order ID, reason, and images (if applicable).
            </li>
            <li>
              Once QC is complete, we process your exchange or store credit
              within 3–5 business days.
            </li>
          </ol>
        </div>

        {/* Section 7 */}
        <div className="space-y-3 mb-10">
          <h2
            className={`${playfair.className} text-2xl text-[#4C1417] border-l-4 border-[#4C1417] pl-3`}
          >
            7. Important Reminders
          </h2>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed">
            <li>No returns/exchanges for custom sizes or international orders.</li>
            <li>Sale periods may have longer dispatch timelines.</li>
            <li>No cancellations after shipment.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-gray-700">
            For any help, write to{" "}
            <a
              href="mailto:roshara.official@gmail.com"
              className="text-[#4C1417] font-medium hover:underline"
            >
              roshara.official@gmail.com
            </a>
            . We’re happy to assist.
          </p>
        </div>
      </section>
    </main>
  );
}
