import { Command } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex flex-col items-center mb-12">
      <div className="w-12 h-12 bg-white flex items-center justify-center rounded-xl mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
        <Command className="text-black w-6 h-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tighter text-white font-['Plus_Jakarta_Sans']">
        WORDMASTER <span className="text-slate-500 font-light">PRO</span>
      </h1>
    </div>
  );
};

export default Logo;