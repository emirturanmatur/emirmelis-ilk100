import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import {
  addPlanTopic,
  deletePlanTopic,
  fetchPlanTopics,
  togglePlanTopicDone,
} from '../lib/db/plan';
import { SUBJECTS, subjectColor, USER_COLORS } from '../lib/constants';
import type { StudyPlanTopic, UserName } from '../lib/types';
import { USER_NAMES } from '../lib/types';
import {
  ClipboardList,
  Plus,
  X,
  Check,
  Loader2,
  Filter,
} from 'lucide-react';

type Stage = 'TYT' | 'AYT';

export default function StudyPlanCard() {
  const { user } = useUser();
  const [topics, setTopics] = useState<StudyPlanTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>('TYT');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | UserName>('all');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const t = await fetchPlanTopics(stage);
    setTopics(t);
    setLoading(false);
  }, [stage]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return topics.filter((t) => {
      if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
      if (ownerFilter !== 'all' && t.owner !== ownerFilter) return false;
      return true;
    });
  }, [topics, subjectFilter, ownerFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, StudyPlanTopic[]>();
    for (const t of filtered) {
      const arr = map.get(t.subject) ?? [];
      arr.push(t);
      map.set(t.subject, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter((t) => t.done).length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [filtered]);

  async function handleToggle(t: StudyPlanTopic) {
    const ok = await togglePlanTopicDone(t.id, !t.done);
    if (ok) void load();
  }

  async function handleDelete(id: string) {
    const ok = await deletePlanTopic(id);
    if (ok) void load();
  }

  if (!user) return null;
  const c = USER_COLORS[user];

  return (
    <div className="rounded-3xl bg-ink-900 border border-ink-800 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Çalışma Planı
          </h3>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-850 border border-ink-700">
          {(['TYT', 'AYT'] as Stage[]).map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                stage === s
                  ? 'bg-teal-500 text-ink-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>İlerleme</span>
          <span className="font-mono">
            {stats.done}/{stats.total} · {stats.pct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-ink-850 border border-ink-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-500"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Filter className="w-3 h-3" />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-ink-850 border border-ink-700 text-slate-300 outline-none focus:border-teal-500/40"
        >
          <option value="all">Tüm dersler</option>
          {SUBJECTS.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-ink-850 border border-ink-700">
          <FilterChip active={ownerFilter === 'all'} onClick={() => setOwnerFilter('all')}>
            Hepsi
          </FilterChip>
          {USER_NAMES.map((u) => (
            <FilterChip
              key={u}
              active={ownerFilter === u}
              onClick={() => setOwnerFilter(u)}
              color={USER_COLORS[u].bar}
            >
              {u}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Topic list grouped by subject */}
      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center text-xs text-slate-600 py-8">
          {stage} için planlanmış konu yok. Aşağıdan ekle.
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-auto pr-1">
          {grouped.map(([subject, list]) => (
            <div key={subject}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: subjectColor(subject) }}
                />
                <h4 className="text-xs font-semibold text-slate-200">
                  {subject}
                </h4>
                <span className="text-[10px] text-slate-500">
                  {list.filter((t) => t.done).length}/{list.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {list.map((t) => (
                  <TopicRow
                    key={t.id}
                    topic={t}
                    onToggle={() => handleToggle(t)}
                    onDelete={() => handleDelete(t.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <div className="mt-4 pt-4 border-t border-ink-800">
        {adding ? (
          <AddTopicForm
            stage={stage}
            defaultOwner={user}
            onAdd={async (s, sub, top, owner, note) => {
              const ok = await addPlanTopic(s, sub, top, owner, note);
              if (ok) {
                setAdding(false);
                void load();
              }
              return ok;
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 transition-colors text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            Konu Ekle
          </button>
        )}
      </div>

      <span className="sr-only" style={{ color: c.bar }}>
        {user}
      </span>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 ${
        active ? 'bg-ink-700 text-white' : 'text-slate-400 hover:text-white'
      }`}
    >
      {color && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  );
}

function TopicRow({
  topic,
  onToggle,
  onDelete,
}: {
  topic: StudyPlanTopic;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const oc = USER_COLORS[topic.owner];
  return (
    <div className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-ink-850 border border-ink-800 group hover:border-ink-700 transition-colors">
      <button
        onClick={onToggle}
        className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
          topic.done
            ? 'bg-teal-500 border-teal-500'
            : 'border-ink-600 hover:border-teal-500/60'
        }`}
      >
        {topic.done && <Check className="w-3 h-3 text-ink-950" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={`text-xs font-medium ${
            topic.done ? 'text-slate-500 line-through' : 'text-slate-200'
          }`}
        >
          {topic.topic}
        </div>
        {topic.note && (
          <div className="text-[10px] text-slate-500 mt-0.5">{topic.note}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: oc.bar }}
          />
          <span className="text-[10px] text-slate-500">{topic.owner}</span>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all shrink-0"
        aria-label="Sil"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AddTopicForm({
  stage,
  defaultOwner,
  onAdd,
  onCancel,
}: {
  stage: Stage;
  defaultOwner: UserName;
  onAdd: (
    s: Stage,
    subject: string,
    topic: string,
    owner: UserName,
    note?: string,
  ) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState(SUBJECTS[0].name);
  const [topic, setTopic] = useState('');
  const [owner, setOwner] = useState<UserName>(defaultOwner);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!topic.trim()) return;
    setSaving(true);
    setError(null);
    const ok = await onAdd(stage, subject, topic.trim(), owner, note.trim() || undefined);
    setSaving(false);
    if (!ok) {
      setError('Bu konu bu kişi için zaten ekli.');
    }
  }

  return (
    <div className="rounded-xl bg-ink-850 border border-ink-700 p-3 space-y-2 animate-fade-in-up">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-lg bg-ink-800 border border-ink-700 text-slate-300 outline-none focus:border-teal-500/40"
        >
          {SUBJECTS.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value as UserName)}
          className="text-xs px-2.5 py-2 rounded-lg bg-ink-800 border border-ink-700 text-slate-300 outline-none focus:border-teal-500/40"
        >
          {USER_NAMES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Konu (örn. Türev, Limit...)"
        className="w-full text-xs px-2.5 py-2 rounded-lg bg-ink-800 border border-ink-700 text-slate-100 placeholder:text-slate-600 outline-none focus:border-teal-500/40"
        autoFocus
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Not (opsiyonel)"
        className="w-full text-xs px-2.5 py-2 rounded-lg bg-ink-800 border border-ink-700 text-slate-100 placeholder:text-slate-600 outline-none focus:border-teal-500/40"
      />
      {error && <div className="text-[11px] text-rose-400">{error}</div>}
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={!topic.trim() || saving}
          className="flex-1 py-2 rounded-lg bg-teal-500 text-ink-950 text-xs font-semibold hover:bg-teal-400 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Ekleniyor...' : 'Ekle'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg bg-ink-800 text-slate-300 text-xs hover:text-white transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  );
}
