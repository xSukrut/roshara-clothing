export const metadata = {
  title: "Contact Us • Roshara",
  description:
    "Reach Roshara via WhatsApp, email, or Instagram DMs. We usually respond within 24 hours.",
};

import ContactForm from "@components/ContactForm"; // 

export default function ContactPage() {
  const whatsappNumber = "9324103174"; // business number will be updated soon
  const whatsappHref = `https://wa.me/91${whatsappNumber}`;
  const email = "roshara.official@gmail.com";
  const instagram = "https://instagram.com/roshara.official";

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Contact Us</h1>

      {/* Preferred channels */}
      <section className="grid gap-6 md:grid-cols-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="block border rounded-xl p-5 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">WhatsApp</h2>
          <p className="text-gray-700 mt-1">Best for quick questions and order help.</p>
          <p className="mt-2 font-medium">+91 {whatsappNumber}</p>
          <p className="text-sm text-gray-500 mt-1">(Business number will be updated soon)</p>
        </a>

        <a
          href={`mailto:${email}`}
          className="block border rounded-xl p-5 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Email</h2>
          <p className="text-gray-700 mt-1">For detailed queries, returns, or collaborations.</p>
          <p className="mt-2 font-medium">{email}</p>
        </a>

        <a
          href={instagram}
          target="_blank"
          rel="noreferrer"
          className="block border rounded-xl p-5 hover:shadow-md transition"
        >
          <h2 className="text-xl font-semibold">Instagram DMs</h2>
          <p className="text-gray-700 mt-1">We’re active on Instagram.</p>
          <p className="mt-2 font-medium">@roshara.official</p>
        </a>
      </section>

      <p className="mt-6 text-gray-600">
        We usually reply within <span className="font-medium">24 hours</span>. For order issues, please include your order ID.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Send us a message</h2>
        {/* Client component below */}
        <ContactForm email={email} />
      </section>
    </main>
  );
}


