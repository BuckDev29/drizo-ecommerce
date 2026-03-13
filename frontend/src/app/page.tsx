import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] font-['HelveticaNeueUltraLight',sans-serif] tracking-[0.12em]">
      
      {/* Hero Section */}
      <section className="relative min-h-[850px] flex items-center justify-center overflow-hidden w-full">
        {/* Background Image */}
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <Image 
            src="/assets/homepage.jpg"
            alt="Drizo Hero Background"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          <h2 className="text-[9rem] font-bold mb-4 tracking-[-0.03em] text-white font-['EtermalDemo']">
            drizo
          </h2>
          
          <div className="flex gap-8 mt-8 justify-center items-center">
            <Link 
              href="/categories?gender=men" 
              className="inline-block text-[1.1rem] font-light text-white no-underline px-4 py-2 border-none bg-transparent cursor-pointer transition-all duration-300 tracking-[0.1em] uppercase hover:text-[#f0f0f0]"
            >
              Hombre
            </Link>
            <Link 
              href="/categories?gender=women" 
              className="inline-block text-[1.1rem] font-light text-white no-underline px-4 py-2 border-none bg-transparent cursor-pointer transition-all duration-300 tracking-[0.1em] uppercase hover:text-[#f0f0f0]"
            >
              Mujer
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
