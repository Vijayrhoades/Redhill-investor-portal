import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
}

export default function Logo({ className = "", light = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Stylized Building Icon */}
      <div className="flex items-end gap-[1.5px] h-9">
        <div className="w-[2px] h-[40%] bg-gradient-to-t from-[#8E6B3E] to-[#D4AF37] rounded-full" />
        <div className="w-[2px] h-[60%] bg-gradient-to-t from-[#8E6B3E] to-[#D4AF37] rounded-full" />
        <div className="w-[2px] h-[80%] bg-gradient-to-t from-[#8E6B3E] to-[#D4AF37] rounded-full" />
        <div className="w-[2px] h-[100%] bg-gradient-to-t from-[#8E6B3E] to-[#D4AF37] rounded-full" />
        <div className="w-[1px] h-[100%] bg-white/10 mx-[1px]" />
        <div className="w-[2px] h-[100%] bg-gradient-to-t from-[#8E6B3E] to-[#D4AF37] rounded-full" />
        <div className="w-[2px] h-[85%] bg-gradient-to-t from-[#8E6B3E] to-[#D4AF37] rounded-full" />
        <div className="w-[2px] h-[70%] bg-gradient-to-t from-[#8E6B3E] to-[#D4AF37] rounded-full" />
        <div className="w-[2px] h-[55%] bg-gradient-to-t from-[#8E6B3E] to-[#D4AF37] rounded-full" />
      </div>
      
      {/* Text Part */}
      <div className="flex flex-col leading-[0.9]">
        <span className={`${light ? 'text-white' : 'text-redhill-dark'} font-black tracking-tight text-lg`}>RED HILL</span>
        <span className={`${light ? 'text-white' : 'text-redhill-dark'} font-black tracking-[0.15em] text-lg`}>INFRA</span>
        <span className={`${light ? 'text-white/50' : 'text-gray-400'} text-[7px] font-bold mt-0.5 tracking-widest`}>PVT LTD</span>
      </div>
    </div>
  );
}
