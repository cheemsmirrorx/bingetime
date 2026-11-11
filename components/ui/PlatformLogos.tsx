import React from "react";

export function PlatformLogo({ name }: { name: string }) {
  switch (name) {
    case "Netflix":
      return (
        <span className="font-black tracking-tighter text-lg md:text-2xl text-[#E50914] select-none">
          NETFLIX
        </span>
      );
    case "Amazon Prime Video":
      return (
        <div className="flex flex-col items-center leading-none select-none">
          <div className="flex items-baseline gap-0.5 text-xs md:text-sm font-bold">
            <span className="text-[#00A8E1]">prime</span>
            <span className="text-zinc-300 font-medium">video</span>
          </div>
          <svg viewBox="0 0 80 14" className="w-12 md:w-16 h-3 mt-0.5" fill="none">
            <path d="M8 3C24 12 52 12 70 4" stroke="#00A8E1" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M64 2L72 4L67 10" stroke="#00A8E1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case "JioHotstar":
      return (
        <div className="flex items-center gap-1.5 select-none">
          <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 text-white shrink-0" fill="currentColor">
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
          </svg>
          <span className="text-[11px] md:text-xs font-extrabold tracking-tight text-zinc-200">
            JioHotstar
          </span>
        </div>
      );
    case "Disney+":
      return (
        <span className="font-black italic tracking-tight text-base md:text-xl text-[#113CCF] drop-shadow-[0_0_8px_rgba(17,60,207,0.45)] select-none">
          Disney<span className="text-sky-400 not-italic">+</span>
        </span>
      );
    case "Apple TV+":
      return (
        <span className="font-bold tracking-tight text-base md:text-xl text-zinc-200 select-none">
          tv<span className="text-white">+</span>
        </span>
      );
    case "SonyLIV":
      return (
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-indigo-900 via-purple-700 to-amber-500 flex flex-col items-center justify-center shadow-inner select-none">
          <span className="text-[9px] md:text-[10px] font-black tracking-widest text-white">SONY</span>
          <span className="text-sm md:text-base font-black text-amber-300 leading-none">liv</span>
        </div>
      );
    case "Zee5":
      return (
        <div className="flex items-center justify-center select-none">
          <span className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            Z5
          </span>
        </div>
      );
    case "JioCinema":
      return (
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-pink-600 to-rose-700 flex items-center justify-center select-none shadow">
          <span className="text-[10px] md:text-xs font-black tracking-tight text-white">JioCinema</span>
        </div>
      );
    case "Crunchyroll":
      return (
        <div className="flex flex-col items-center gap-1 select-none">
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full border-4 border-[#F47521] border-r-transparent rotate-45" />
          <span className="text-[10px] md:text-xs font-extrabold text-[#F47521]">Crunchyroll</span>
        </div>
      );
    case "HBO Max":
      return (
        <span className="font-black tracking-tight text-sm md:text-base text-purple-300 select-none">
          HBO <span className="text-white font-semibold">max</span>
        </span>
      );
    case "Hulu":
      return (
        <span className="font-black tracking-tighter text-lg md:text-2xl text-[#1CE783] select-none">
          hulu
        </span>
      );
    case "Paramount+":
      return (
        <span className="font-extrabold tracking-tight text-xs md:text-sm text-sky-400 select-none">
          Paramount+
        </span>
      );
    case "MX Player":
      return (
        <span className="font-black tracking-tight text-xs md:text-sm text-blue-400 select-none">
          MX <span className="text-white font-semibold">PLAYER</span>
        </span>
      );
    default:
      return (
        <span className="text-xs md:text-sm font-bold text-zinc-300 text-center select-none">
          {name}
        </span>
      );
  }
}

