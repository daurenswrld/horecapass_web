'use client';

import * as React from 'react';
import { Flag, Megaphone, Send, ShieldCheck, Users, X } from 'lucide-react';
import { DemoNotice } from '@/components/demo-notice';
import { PageHeader } from '@/components/shell/app-shell';
import { Button, Card, ChoiceChip } from '@/components/ui/primitives';
import { GCC_COUNTRIES, matchNationality } from '@/lib/demo/candidate';
import { cn } from '@/lib/utils';

/**
 * Communities — бриф кандидата, пункт 13. Кандидаты в GCC hospitality —
 * в основном мигранты вдали от дома; «клич» помогает найти своих по
 * национальности и городу. Флоу из брифа:
 *   1) правила — один раз, при первом обращении;
 *   2) клич: национальность (All или несколько) × страна/город (All GCC или
 *      несколько) + текст; роль не фильтруется; один активный клич на человека;
 *   3) присоединиться — как только 2+ человека, клич становится групповым чатом.
 * Модерация заложена сразу: премодерация клича, жалоба в чате, ссылки
 * и телефоны в сообщениях не проходят, работодателей по имени не обсуждаем.
 *
 * Без сервера это витрина: кличи других людей — образцы, всё хранится
 * в браузере.
 */

interface Call {
  id: string;
  author: string;
  mine: boolean;
  text: string;
  nationalities: string[] | 'All';
  places: string[] | 'All GCC';
  joined: string[];
  messages: { from: string; text: string }[];
}

interface State {
  rulesAccepted: boolean;
  calls: Call[];
}

const KEY = 'hp_demo_communities';

const SAMPLES: Call[] = [
  {
    id: 's1',
    author: 'Joy',
    mine: false,
    text: 'Filipino waiters around Dubai Marina — anyone up for a weekend meetup after shifts? New here, would love to meet people.',
    nationalities: ['Filipino'],
    places: ['United Arab Emirates'],
    joined: ['Joy', 'Mark'],
    messages: [
      { from: 'Joy', text: 'Hi all! Thinking Friday after 11pm, somewhere near the tram.' },
      { from: 'Mark', text: 'Count me in. I finish at 10:30.' },
    ],
  },
  {
    id: 's2',
    author: 'Suman',
    mine: false,
    text: 'Nepali kitchen team in Doha — let’s share tips for the first month: SIM, bank, where to buy groceries.',
    nationalities: ['Nepali'],
    places: ['Qatar'],
    joined: ['Suman'],
    messages: [],
  },
];

function load(): State {
  if (typeof window === 'undefined') return { rulesAccepted: false, calls: SAMPLES };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* повреждённое — начинаем заново */
  }
  return { rulesAccepted: false, calls: SAMPLES };
}

function save(s: State) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* приватный режим */
  }
}

/** Ссылки и телефоны — частый инструмент мошенников в мигрантских чатах. */
const BLOCKED = /(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|ae|sa|qa|me|io|link)\b|\+?\d[\d\s-]{7,}\d)/i;

const RULES = [
  'Be respectful. No insults, no discrimination.',
  'No external links, phone numbers or spam — they are removed automatically.',
  'Don’t name employers in complaints here. Take those to Support or a private message.',
  'One active call per person at a time.',
];

function Rules({ onAccept }: { onAccept: () => void }) {
  return (
    <Card className="mx-auto max-w-2xl space-y-5 p-6 sm:p-8">
      <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-heading">
        <ShieldCheck size={24} aria-hidden className="text-accent-text" />
        Community rules
      </h2>
      <p className="text-text-secondary">Find people like you — same country, same city, same line of work. A few rules keep it safe for everyone:</p>
      <ul className="space-y-3 text-lg leading-snug text-text-primary">
        {RULES.map((r) => (
          <li key={r} className="flex gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-strong" />
            {r}
          </li>
        ))}
      </ul>
      <Button size="lg" onClick={onAccept}>
        I agree
      </Button>
    </Card>
  );
}

function Target({ call }: { call: Call }) {
  const who = call.nationalities === 'All' ? 'All nationalities' : call.nationalities.join(', ');
  const where = call.places === 'All GCC' ? 'All GCC' : call.places.join(', ');
  return (
    <p className="text-xs text-text-secondary">
      {who} · {where}
    </p>
  );
}

function CreateCall({ onCreate, blocked }: { onCreate: (c: Omit<Call, 'id' | 'author' | 'mine' | 'joined' | 'messages'>) => void; blocked: boolean }) {
  const [text, setText] = React.useState('');
  const [natAll, setNatAll] = React.useState(true);
  const [nats, setNats] = React.useState<string[]>([]);
  const [q, setQ] = React.useState('');
  const [placeAll, setPlaceAll] = React.useState(true);
  const [places, setPlaces] = React.useState<string[]>([]);
  const bad = BLOCKED.test(text);

  return (
    <Card className="space-y-4 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-heading">
        <Megaphone size={18} aria-hidden className="text-accent-text" />
        Start a call
      </h3>

      <div>
        <p className="text-sm font-medium text-text-secondary">Who is it for?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <ChoiceChip selected={natAll} onClick={() => { setNatAll(true); setNats([]); }}>All nationalities</ChoiceChip>
          {nats.map((n) => (
            <ChoiceChip key={n} selected onClick={() => setNats(nats.filter((x) => x !== n))}>
              {n}
              <X size={13} aria-hidden className="ml-1.5" />
            </ChoiceChip>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Add a nationality…"
          aria-label="Add a nationality"
          className="mt-2 h-10 w-full rounded border border-line-strong bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus-ring"
        />
        {q && (
          <div className="mt-2 flex flex-wrap gap-2">
            {matchNationality(q, 5).map((n) => (
              <ChoiceChip
                key={n}
                onClick={() => {
                  // «All» и ручной выбор взаимоисключающие.
                  setNatAll(false);
                  setNats((p) => (p.includes(n) ? p : [...p, n]));
                  setQ('');
                }}
              >
                {n}
              </ChoiceChip>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-text-secondary">Where?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <ChoiceChip selected={placeAll} onClick={() => { setPlaceAll(true); setPlaces([]); }}>All GCC</ChoiceChip>
          {GCC_COUNTRIES.map((c) => {
            const on = places.includes(c);
            return (
              <ChoiceChip
                key={c}
                selected={on}
                onClick={() => {
                  setPlaceAll(false);
                  setPlaces((p) => (on ? p.filter((x) => x !== c) : [...p, c]));
                }}
              >
                {c}
              </ChoiceChip>
            );
          })}
        </div>
      </div>

      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Sri Lankan baristas in Riyadh — let’s meet up on our day off"
        aria-label="Your call"
        className="w-full resize-y rounded border border-line-strong bg-surface px-3 py-2.5 text-text-primary placeholder:text-text-tertiary focus-ring"
      />
      {bad && <p className="text-sm text-danger">Links and phone numbers aren’t allowed in calls.</p>}
      {blocked && <p className="text-sm text-text-secondary">You already have an active call. Close it to start a new one.</p>}
      <p className="text-xs text-text-secondary">Calls are reviewed before anyone is notified. Only people who match your filters get a notification.</p>

      <Button
        disabled={blocked || bad || text.trim().length < 10 || (!natAll && !nats.length) || (!placeAll && !places.length)}
        onClick={() => {
          onCreate({ text: text.trim(), nationalities: natAll ? 'All' : nats, places: placeAll ? 'All GCC' : places });
          setText('');
        }}
      >
        Send for review
      </Button>
    </Card>
  );
}

function GroupChat({ call, onSend, onClose }: { call: Call; onSend: (t: string) => void; onClose: () => void }) {
  const [text, setText] = React.useState('');
  const [reported, setReported] = React.useState(false);
  const bad = BLOCKED.test(text);
  return (
    <Card className="flex flex-col">
      <header className="flex items-center gap-3 border-b border-line px-5 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-muted text-accent-text">
          <Users size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-heading">{call.text}</p>
          <p className="text-xs text-text-secondary">{call.joined.length} members</p>
        </div>
        <button type="button" onClick={() => setReported(true)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-text-secondary hover:text-danger focus-ring">
          <Flag size={14} aria-hidden />
          {reported ? 'Reported' : 'Report'}
        </button>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-text-secondary hover:text-text-primary focus-ring">
          <X size={18} />
        </button>
      </header>
      <div className="max-h-80 min-h-40 space-y-3 overflow-y-auto px-5 py-4 scroll-slim">
        {call.messages.length === 0 && <p className="text-sm text-text-secondary">Say hi — you’re the first one here.</p>}
        {call.messages.map((m, i) => (
          <div key={i} className={cn('flex', m.from === 'You' && 'justify-end')}>
            <div className={cn('max-w-[80%] rounded-lg px-3.5 py-2 text-sm', m.from === 'You' ? 'bg-accent-strong text-on-accent dark:bg-accent' : 'bg-surface-muted text-text-primary')}>
              {m.from !== 'You' && <p className="text-xs font-semibold text-accent-text">{m.from}</p>}
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-line px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim() || bad) return;
          onSend(text.trim());
          setText('');
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          aria-label="Message"
          className="h-10 flex-1 rounded-full border border-line-strong bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary focus-ring"
        />
        <Button type="submit" disabled={!text.trim() || bad} aria-label="Send">
          <Send size={16} aria-hidden />
        </Button>
      </form>
      {bad && <p className="px-5 pb-3 text-sm text-danger">Links and phone numbers are removed — keep contacts in private messages.</p>}
    </Card>
  );
}

export function Communities({ segment }: { segment: React.ReactNode }) {
  const [s, setS] = React.useState<State | null>(null);
  const [open, setOpen] = React.useState<string | null>(null);
  React.useEffect(() => setS(load()), []);
  const set = (fn: (p: State) => State) =>
    setS((p) => {
      if (!p) return p;
      const next = fn(p);
      save(next);
      return next;
    });

  const active = s?.calls.find((c) => c.id === open) ?? null;
  const hasOwn = !!s?.calls.some((c) => c.mine);

  return (
    <>
      <PageHeader title="Chats" subtitle="Communities" actions={segment} />
      <div className="space-y-5 px-5 py-6 md:px-8">
        {!s ? null : !s.rulesAccepted ? (
          <Rules onAccept={() => set((p) => ({ ...p, rulesAccepted: true }))} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <div className="space-y-3">
              {active && active.joined.length >= 2 && (
                <GroupChat
                  call={active}
                  onClose={() => setOpen(null)}
                  onSend={(t) =>
                    set((p) => ({ ...p, calls: p.calls.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, { from: 'You', text: t }] } : c)) }))
                  }
                />
              )}
              {s.calls.map((c) => {
                const joined = c.joined.includes('You');
                return (
                  <Card key={c.id} className="p-4">
                    <p className="text-text-primary">{c.text}</p>
                    <Target call={c} />
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        {c.joined.length} {c.joined.length === 1 ? 'person' : 'people'} joined
                        {c.mine && ' · your call, in review'}
                      </span>
                      <span className="ml-auto flex gap-2">
                        {c.mine && (
                          <Button variant="ghost" size="sm" onClick={() => set((p) => ({ ...p, calls: p.calls.filter((x) => x.id !== c.id) }))}>
                            Close call
                          </Button>
                        )}
                        {joined || c.mine ? (
                          c.joined.length >= 2 && (
                            <Button variant="secondary" size="sm" onClick={() => setOpen(c.id)}>
                              Open group chat
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              set((p) => ({ ...p, calls: p.calls.map((x) => (x.id === c.id ? { ...x, joined: [...x.joined, 'You'] } : x)) }));
                              setOpen(c.id);
                            }}
                          >
                            Join
                          </Button>
                        )}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="space-y-3">
              <CreateCall
                blocked={hasOwn}
                onCreate={(c) =>
                  set((p) => ({
                    ...p,
                    calls: [{ ...c, id: `m${Date.now()}`, author: 'You', mine: true, joined: ['You'], messages: [] }, ...p.calls],
                  }))
                }
              />
              <DemoNotice
                what="Calls from other people here are samples, and everything you do stays in this browser: notifications, moderation and group chats need the server."
                endpoint="/api/community/calls/ (create, join, moderate), group chats over the existing chat socket"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
