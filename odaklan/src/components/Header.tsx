import { useUser } from '../context/UserContext';
import { USER_COLORS } from '../lib/constants';
import { GraduationCap, UserCog } from 'lucide-react';

export default function Header() {
  const { user, switchUser } = useUser();
  if (!user) return null;
  const c = USER_COLORS[user];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-ink-950/80 border-b border-ink-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/20">
            <GraduationCap className="w-5 h-5 text-ink-950" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-white leading-none">Odaklan</h1>
            <p className="text-[11px] text-slate-500 -mt-0.5">YKS Çalışma Takibi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full bg-ink-850 border border-ink-700">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-ink-950 text-sm"
              style={{ backgroundColor: c.bar }}
            >
              {user[0]}
            </span>
            <span className="text-sm font-medium text-white pr-1">{user}</span>
          </div>
          <button
            onClick={switchUser}
            title="Kullanıcı değiştir"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-ink-850 border border-ink-700 hover:border-teal-500/60 text-slate-300 hover:text-white transition-colors"
          >
            <UserCog className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
