import { useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';
import { fetchMessages, insertMessage } from '../lib/db/chat';
import type { ChatMessage } from '../lib/types';
import { USER_COLORS } from '../lib/constants';
import { Bot, Send, Sparkles, X } from 'lucide-react';

// A small rule-based assistant. Runs fully locally — no external API or secret.
function generateReply(input: string): string {
  const q = input.toLocaleLowerCase('tr');
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has('merhaba', 'selam', 'naber')) {
    return 'Selam! YKS hazırlığında sormak istediğin bir şey var mı? Program planlama, ders önceliği veya motivasyon için buradayım.';
  }
  if (has('nasıl çalış', 'verimli', 'odaklan', 'konsantre')) {
    return 'Odaklanmak için Pomodoro tekniğini öneririm: 50 dk çalış, 10 dk mola. Telefondan uzaklaş, tek bir derse odaklan. Yukarıdaki Ortam Sesleri panelini açmak da dikkat dağınıklığını azaltır.';
  }
  if (has('matematik', 'türkçe', 'fizik', 'kimya', 'biyoloji', 'edebiyat', 'tarih', 'felsefe')) {
    return 'Bu dersin kazanımlarını küçük bloklara böl. Önce konu tekrarı, sonra 20-30 soru çöz, yanlışların için çözüm videosu/çözüm notu çıkar. Hatırlamak için araya 24 saat ve 1 hafta tekrarları ekle.';
  }
  if (has('program', 'plan', 'haftalık', 'aylık')) {
    return 'Haftalık program yaparken her güne 2-3 ders bloğu koy, her blok 2 saat olsun. Cumartesi deneme çözümüne, Pazar eksik konu tekrarına ayır. Sayfayı yenilersen bu haftaki grafiğin nasıl göründüğüne bakabilirsin.';
  }
  if (has('motivasyon', 'yoruldum', 'bıktım', 'stres', 'korku', 'kaygı')) {
    return 'Yorulduğun zaman 5 dakika uzaklaş, nefes al. Bu sürecin bir maraton olduğunu unutma — tek bir gün seni belirlemez. Bugün küçük de olsa bir şey yaptın, yetecek. Sen yapabilirsin.';
  }
  if (has('ne yap', 'yardım', 'öneri', 'tavsiye')) {
    return 'Şu an kronometreyi başlatıp bir 50 dakikalık blok çalışmanı öneririm. Sonra buraya yazdıklarını günün özetine ekleyebilirsin. Hangi derse odaklanmalıyım dersen sohbetin üstündeki süreye bakıp birlikte seçebiliriz.';
  }
  if (has('teşekkür', 'sağ ol')) {
    return 'Rica ederim! Başarılar, iyi çalışmalar.';
  }
  return 'İlgili konuyu biraz daha açar mısın? Program, ders önceliği, çalışma tekniği veya motivasyon hakkında yardımcı olabilirim.';
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  user_name: 'Emir',
  role: 'assistant',
  content: 'Selam! YKS Asistanınım. Çalışma programın, ders öncelikleri veya motivasyon hakkında konuşabiliriz.',
  created_at: new Date().toISOString(),
};

export default function AssistantChat() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      const msgs = await fetchMessages(user);
      if (cancelled) return;
      setMessages(msgs.length === 0 ? [WELCOME] : msgs);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, open]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  const canSend = useMemo(() => Boolean(user) && input.trim().length > 0 && !thinking, [user, input, thinking]);

  async function handleSend() {
    if (!user || !canSend) return;
    const text = input.trim();
    setInput('');
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_name: user,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);
    // persist user msg
    void insertMessage(user, 'user', text);
    // simulate assistant reply
    const reply = generateReply(text);
    setTimeout(async () => {
      setThinking(false);
      const aMsg = await insertMessage(user, 'assistant', reply);
      setMessages((m) => [...m, aMsg ?? {
        id: crypto.randomUUID(),
        user_name: user,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      }]);
    }, 650);
  }

  if (!user) return null;
  const c = USER_COLORS[user];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 text-ink-950 font-semibold text-sm shadow-xl shadow-teal-500/30 hover:scale-105 transition-transform"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">YKS Asistanı</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[calc(100vw-2.5rem)] sm:w-96 h-[32rem] max-h-[75vh] flex flex-col rounded-2xl bg-ink-900 border border-ink-700 shadow-2xl overflow-hidden animate-fade-in-up">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800 bg-ink-850">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-ink-950" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white leading-none">YKS Asistanı</div>
                <div className="text-[10px] text-teal-400 mt-0.5">Çevrimiçi</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-ink-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4 space-y-3">
            {loading ? (
              <div className="text-center text-xs text-slate-600 py-8">Yükleniyor...</div>
            ) : (
              messages.map((m) => <Bubble key={m.id} msg={m} userColor={c.bar} />)
            )}
            {thinking && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse-dot" />
                yazıyor...
              </div>
            )}
          </div>

          {/* input */}
          <div className="px-3 py-3 border-t border-ink-800 bg-ink-850">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                rows={1}
                placeholder="Bir soru yaz..."
                className="flex-1 resize-none bg-ink-900 border border-ink-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-teal-500/40 max-h-24"
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="w-10 h-10 shrink-0 rounded-xl bg-teal-500 text-ink-950 flex items-center justify-center hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-40 transition-shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ msg, userColor }: { msg: ChatMessage; userColor: string }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md text-ink-950'
            : 'rounded-bl-md bg-ink-800 text-slate-100 border border-ink-700'
        }`}
        style={isUser ? { backgroundColor: userColor } : undefined}
      >
        {msg.content}
      </div>
    </div>
  );
}
