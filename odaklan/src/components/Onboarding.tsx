import { useUser } from '../context/UserContext';
import { USER_COLORS } from '../lib/constants';
import { USER_NAMES, type UserName } from '../lib/types';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { setUser } = useUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-ink-950">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <GraduationCap className="w-6 h-6 text-ink-950" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Odaklan</h1>
            <p className="text-xs text-slate-400 -mt-0.5">YKS Çalışma Takibi</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">Hoş geldin</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Devam etmek için kim olduğunu seç. Bu cihaz için hatırlanacak,
            istediğin zaman değiştirebileceksin.
          </p>
        </div>

        <div className="space-y-3">
          {USER_NAMES.map((name) => {
            const c = USER_COLORS[name as UserName];
            return (
              <button
                key={name}
                onClick={() => setUser(name)}
                className="group w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-ink-850 border border-ink-700 hover:border-transparent transition-all hover:shadow-lg"
                style={{ ['--tw-ring-color' as string]: c.ring }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = c.ring;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '';
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-ink-950"
                    style={{ backgroundColor: c.bar }}
                  >
                    {name[0]}
                  </span>
                  <span className="text-lg font-semibold text-white">{name}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Şifresiz, cihaz bazlı kimlik · Veriler bulutta senkronize edilir
        </p>
      </div>
    </div>
  );
}
