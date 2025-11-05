// "use client";

// import Image from "next/image";
// import { motion } from "framer-motion";
// import { ChevronDown } from "lucide-react";

// export default function HeroSection() {
//   return (
//     <section className="relative w-full h-screen flex -mt-24">
//       {/* LEFT SECTION */}
//       <div className="w-1/3 h-full bg-[#f8f5f0] flex flex-col justify-center items-center relative overflow-hidden">
//         {/* Left Model Image */}
//         <motion.div
//           initial={{ x: -80, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ duration: 1 }}
//           className="relative z-10"
//         >
//           <Image
//             src="/assets/Tarni_Front2.jpg"
//             alt="Left Model"
//             width={280}
//             height={280}
//             className="rounded-lg"
//           />
//         </motion.div>

//         {/* Text on top of image */}
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1, delay: 0.4 }}
//           className="absolute bottom-[7rem] left-[16rem] z-20 text-left"
//         >
//           <h1 className="text-[100px] leading-none font-serif text-[#4C1417] drop-shadow-md">
//             Style
//           </h1>
//           <p className="text-lg mt-2 text-gray-700 italic">
//             That Stays With You
//           </p>
//         </motion.div>
//       </div>

//       {/* RIGHT SECTION */}
//       <div className="w-2/3 h-full bg-black relative flex items-center justify-start overflow-hidden">
//         {/* Main Model */}
//         <motion.div
//           initial={{ x: 100, opacity: 0 }}
//           animate={{ x: 0, opacity: 1 }}
//           transition={{ duration: 1 }}
//           className="relative z-10 ml-0"
//         >
//           <Image
//             src="/assets/Tarni_Front1.jpg"
//             alt="Right Model"
//             width={550}
//             height={700}
//             className="object-contain"
//           />
//         </motion.div>

//         {/* Small Model at bottom */}
//         <motion.div
//           initial={{ scale: 0.8, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           transition={{ duration: 0.8, delay: 0.8 }}
//           className="absolute bottom-2 right-[23.5rem] z-30 flex flex-col items-center"
//         >
//           <Image
//             src="/assets/Tarni_Back.JPG"
//             alt="Bottom Model"
//             width={200}
//             height={230}
//             className="rounded-lg"
//           />
//           {/* <div className="mt-4 flex flex-col items-center text-white text-sm font-light tracking-wide">
//             <p>Scroll Down</p>
//             <ChevronDown className="animate-bounce mt-1" size={20} />
//           </div> */}
//         </motion.div>

//         {/* Vertical Text (ROSHARA) */}
//         <motion.div
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1, delay: 1 }}
//           className="absolute right-[26rem] top-[1rem] z-10"
//         >
//           <Image
//             src="/assets/ROSHARA.png"
//             alt="ROSHARA Vertical Text"
//             width={70}
//             height={70}
//             className="object-contain"
//           />
//         </motion.div>

//         {/* Vertical Paragraph Text */}
//         <motion.div
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1, delay: 1 }}
//           className="absolute right-[7.5rem] top-[7.5rem] h-[25rem] flex items-center"
//         >
//           <p className="text-white text-lg tracking-wider leading-relaxed rotate-180 [writing-mode:vertical-rl]">
//             — Bold prints, unapologetic visuals, and a movement to make India
//             wear its roots with pride and confidence.
//           </p>
//         </motion.div>
//       </div>
//     </section>
//   );
// }

"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen flex flex-col lg:flex-row -mt-24">
      {/* LEFT SECTION */}
      <div className="w-full lg:w-1/3 h-full bg-[#f8f5f0] flex flex-col justify-center items-center relative overflow-hidden py-7 lg:py-0">
        {/* Main Model Image */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <Image
            src="/assets/Tarni_Front2.jpg"
            alt="Left Model"
            width={260}
            height={260}
            className="rounded-lg object-cover"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-8 text-center lg:text-left lg:absolute lg:bottom-[7rem] lg:left-[13rem] z-20"
        >
          <h1 className="text-6xl lg:text-[100px] leading-none font-serif text-[#4C1417] drop-shadow-md">
            Style
          </h1>
          <p className="text-base lg:text-lg mt-2 text-gray-700 italic">
            That Stays With You
          </p>
        </motion.div>
      </div>

      {/* RIGHT SECTION (Hidden on mobile) */}
      <div className="hidden lg:flex w-2/3 h-full bg-black relative items-center justify-start overflow-hidden">
        {/* Main Model */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 ml-0"
        >
          <Image
            src="/assets/Tarni_Front1.jpg"
            alt="Right Model"
            width={570}
            height={750}
            className="object-contain"
          />
        </motion.div>

        {/* Small Model */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="absolute bottom-4 right-[22rem] z-30"
        >
          <Image
            src="/assets/Tarni_Back.JPG"
            alt="Bottom Model"
            width={180}
            height={230}
            className="rounded-lg"
          />
        </motion.div>

        {/* Vertical Logo Text */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute right-[26rem] top-[2rem] z-10"
        >
          <Image
            src="/assets/ROSHARA.png"
            alt="ROSHARA Vertical Text"
            width={70}
            height={70}
            className="object-contain"
          />
        </motion.div>

        {/* Vertical Paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute right-[7rem] top-[7rem] h-[25rem] flex items-center"
        >
          <p className="text-white text-lg tracking-wider rotate-180 [writing-mode:vertical-rl]">
            Roshara - Bold prints, unapologetic visuals, and a movement to make
            India wear its roots with pride.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
