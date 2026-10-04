'use client';

import * as React from 'react';
import { FilePlus2, FileText, Pencil, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { useStaff } from '@/components/admin/admin-shell';
import { AdminHeader, Badge, Empty, ErrorNote, Modal, timeAgo, useLoad } from '@/components/admin/ui';
import { ListSkeleton, riseStyle } from '@/components/ui/motion';
import { Button, Card, Field } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { assistantAdminApi, errorText, type KnowledgeDoc, type SearchTest } from '@/lib/api/admin';
import { extractCvText } from '@/lib/cv-text';

/**
 * Ассистент сайта: чему он обучен и что ему не удалось ответить.
 *
 * Модель не дообучается. Бот «умнеет» от двух вещей: от документов, которые
 * сюда загружает команда, и от списка вопросов, на которые он не нашёл ответа.
 * Порядок работы: посмотреть, что люди спрашивают и не получают → дописать
 * ответ документом → проверить поиском → закрыть вопрос.
 */

const MAX_CHARS = 200_000;

export default function KnowledgePage() {
  const staff = useStaff();
  const toast = useToast();
  const docs = useLoad(() => assistantAdminApi.documents(), []);
  const questions = useLoad(() => assistantAdminApi.unanswered('open'), []);
  const settings = useLoad(() => assistantAdminApi.settings(), []);

  const [editing, setEditing] = React.useState<{ doc: KnowledgeDoc | null; title?: string; content?: string } | null>(null);
  const [deleting, setDeleting] = React.useState<KnowledgeDoc | null>(null);
  const [busyReindex, setBusyReindex] = React.useState<number | null>(null);

  const reindex = async (d: KnowledgeDoc) => {
    setBusyReindex(d.id);
    try {
      const res = await assistantAdminApi.reindex(d.id);
      toast.success(`${res.embedded} of ${res.chunks} pieces are ready for search by meaning`);
      docs.reload();
    } catch (e) {
      toast.error(errorText(e, 'Could not index the document'));
    } finally {
      setBusyReindex(null);
    }
  };

  const canWrite = staff.can.moderate;

  return (
    <>
      <AdminHeader
        title="Assistant"
        subtitle="What the site assistant knows, and what it could not answer"
        actions={
          canWrite ? (
            <Button onClick={() => setEditing({ doc: null })}>
              <FilePlus2 size={16} aria-hidden /> Add document
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-8 px-5 py-6 md:px-8">
        <SettingsCard load={settings} canEdit={staff.can.manage_staff} />

        <section aria-labelledby="unanswered">
          <h2 id="unanswered" className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Questions without an answer {questions.data ? `· ${questions.data.open}` : ''}
          </h2>
          <p className="mb-3 text-sm text-text-secondary">
            What people asked and the assistant did not find in the documents. Write the answer into a document, then close the question.
          </p>
          {questions.error && <ErrorNote message={questions.error} onRetry={questions.reload} />}
          {questions.loading && !questions.data && <ListSkeleton count={2} />}
          {questions.data && questions.data.results.length === 0 && (
            <Empty title="Nothing waiting" hint="Every question so far was answered from the documents." />
          )}
          <ul className="space-y-2">
            {questions.data?.results.map((q, i) => (
              <li
                key={q.id}
                className="rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3"
                style={riseStyle(i)}
              >
                <div className="min-w-0 flex-1 basis-60">
                  <p className="break-words font-medium text-text-primary">{q.text}</p>
                  <p className="text-xs text-text-secondary">
                    {q.asked_by ?? 'visitor'} · {timeAgo(q.created_at)}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing({ doc: null, title: 'Answer', content: `${q.text.replace(/\?*$/, '')}?\n` })}
                    >
                      <Pencil size={14} aria-hidden /> Write the answer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await assistantAdminApi.resolveQuestion(q.id, true);
                          toast.success('Question closed');
                          questions.reload();
                        } catch (e) {
                          toast.error(errorText(e, 'Could not close the question'));
                        }
                      }}
                    >
                      Close
                    </Button>
                    <button
                      type="button"
                      aria-label="Delete the question"
                      onClick={async () => {
                        try {
                          await assistantAdminApi.deleteQuestion(q.id);
                          questions.reload();
                        } catch (e) {
                          toast.error(errorText(e, 'Could not delete the question'));
                        }
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger focus-ring"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <TestSearch />

        <section aria-labelledby="docs">
          <h2 id="docs" className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Documents {docs.data ? `· ${docs.data.results.length}` : ''}
          </h2>
          <p className="mb-3 text-sm text-text-secondary">
            Write them as a FAQ: a line that ends with a question mark, then the answer under it. Each question stays together with its answer.
          </p>
          {docs.error && <ErrorNote message={docs.error} onRetry={docs.reload} />}
          {docs.loading && !docs.data && <ListSkeleton count={3} />}
          {docs.data && docs.data.results.length === 0 && (
            <Empty title="No documents yet" hint="Add the first one, or ask a developer to run seed_knowledge for a starter set." />
          )}
          <ul className="space-y-2">
            {docs.data?.results.map((d, i) => (
              <li
                key={d.id}
                className="rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3"
                style={riseStyle(i)}
              >
                <FileText size={18} aria-hidden className="shrink-0 text-accent-text" />
                <div className="min-w-0 flex-1 basis-52">
                  <p className="truncate font-medium text-text-primary">{d.title}</p>
                  <p className="text-xs text-text-secondary">
                    {d.chunks} pieces · {d.chars.toLocaleString('en-US')} characters · edited {timeAgo(d.updated_at)}
                  </p>
                </div>
                {d.chunks > 0 &&
                  (d.embedded === d.chunks ? (
                    <Badge tone="good">searchable by meaning</Badge>
                  ) : (
                    <Badge tone="warn">
                      {d.embedded}/{d.chunks} indexed
                    </Badge>
                  ))}
                {canWrite && (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyReindex === d.id}
                      onClick={() => reindex(d)}
                      aria-label={`Re-index ${d.title}`}
                    >
                      <RefreshCw size={14} aria-hidden className={busyReindex === d.id ? 'animate-spin' : undefined} /> Re-index
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          setEditing({ doc: await assistantAdminApi.document(d.id) });
                        } catch (e) {
                          toast.error(errorText(e, 'Could not open the document'));
                        }
                      }}
                      aria-label={`Edit ${d.title}`}
                    >
                      <Pencil size={14} aria-hidden /> Edit
                    </Button>
                    <button
                      type="button"
                      aria-label={`Delete ${d.title}`}
                      onClick={() => setDeleting(d)}
                      className="grid h-9 w-9 place-items-center rounded-full text-text-secondary transition-colors hover:bg-danger-surface hover:text-danger focus-ring"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <DocumentDialog
        state={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          docs.reload();
        }}
      />

      <Modal open={!!deleting} title="Delete this document?" onClose={() => setDeleting(null)}>
        <p className="text-sm text-text-secondary">
          “{deleting?.title}” and its {deleting?.chunks} pieces will be removed. The assistant stops answering from it right away.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!deleting) return;
              try {
                await assistantAdminApi.deleteDocument(deleting.id);
                toast.success('Document deleted');
              } catch (e) {
                toast.error(errorText(e, 'Could not delete the document'));
              }
              setDeleting(null);
              docs.reload();
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* --- включить / выключить, правила команды ------------------------------------ */

function SettingsCard({ load, canEdit }: { load: ReturnType<typeof useLoad<import('@/lib/api/admin').AssistantSettings>>; canEdit: boolean }) {
  const toast = useToast();
  const [active, setActive] = React.useState(true);
  const [rules, setRules] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (load.data) {
      setActive(load.data.active);
      setRules(load.data.extra_instructions);
    }
  }, [load.data]);

  const dirty = !!load.data && (active !== load.data.active || rules !== load.data.extra_instructions);

  const save = async () => {
    setBusy(true);
    try {
      await assistantAdminApi.saveSettings(active, rules);
      toast.success(active ? 'Saved. The assistant is on.' : 'Saved. The assistant is off for visitors.');
      load.reload();
    } catch (e) {
      toast.error(errorText(e, 'Could not save'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Assistant on the site</h2>
          <p className="text-sm text-text-secondary">When it is off, the chat button disappears for everyone.</p>
        </div>
        <label className={`inline-flex items-center gap-3 text-sm font-medium ${canEdit ? 'cursor-pointer' : 'opacity-70'}`}>
          <input
            type="checkbox"
            role="switch"
            checked={active}
            disabled={!canEdit || !load.data}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-5 accent-[rgb(var(--accent))]"
          />
          {active ? 'On' : 'Off'}
        </label>
      </div>
      <div className="mt-4">
        <label htmlFor="rules" className="block text-sm font-medium text-text-secondary">
          House rules (added to every conversation)
        </label>
        <textarea
          id="rules"
          rows={3}
          maxLength={3000}
          value={rules}
          disabled={!canEdit || !load.data}
          onChange={(e) => setRules(e.target.value)}
          placeholder="For example: always mention that publishing is free during the launch."
          className="mt-1.5 w-full resize-y rounded border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus-ring disabled:opacity-70"
        />
      </div>
      {canEdit ? (
        <div className="mt-3 flex justify-end">
          <Button onClick={save} disabled={!dirty || busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-text-secondary">Only staff with full access can change these.</p>
      )}
    </Card>
  );
}

/* --- проверка поиска ---------------------------------------------------------------- */

function TestSearch() {
  const [q, setQ] = React.useState('');
  const [result, setResult] = React.useState<SearchTest | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await assistantAdminApi.search(q.trim()));
    } catch (err) {
      setError(errorText(err, 'The search failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="test">
      <h2 id="test" className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        Test a question
      </h2>
      <p className="mb-3 text-sm text-text-secondary">
        See what the assistant would find. If the right text is not here, the answer will be wrong too, so check this before trusting the bot.
      </p>
      <form onSubmit={run} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={500}
            placeholder="What does it cost to publish a job?"
            aria-label="Question to test"
            className="h-11 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-text-primary placeholder:text-text-tertiary focus-ring"
          />
        </div>
        <Button type="submit" disabled={busy || !q.trim()}>
          {busy ? 'Searching…' : 'Search'}
        </Button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      {result && (
        <div className="mt-3 space-y-2">
          {result.knowledge.length === 0 ? (
            <Card className="p-4 text-sm text-text-secondary">Nothing found in the documents for this question. The assistant would say it does not know and add it to the list above.</Card>
          ) : (
            result.knowledge.map((h) => (
              <Card key={h.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-text-primary">{h.title}</p>
                  <span className="flex items-center gap-2">
                    <Badge tone={h.method === 'vector' ? 'good' : 'neutral'}>{h.method === 'vector' ? 'by meaning' : 'by words'}</Badge>
                    <span className="text-xs tabular-nums text-text-secondary">score {h.score}</span>
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{h.text}</p>
              </Card>
            ))
          )}
          {result.vacancies.length > 0 && (
            <Card className="p-4">
              <p className="text-sm font-medium text-text-primary">Vacancies it would offer</p>
              <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                {result.vacancies.map((v) => (
                  <li key={v.id}>
                    {v.title} · {v.company}
                    {v.city ? ` · ${v.city}` : ''}
                    {v.salary ? ` · ${v.salary}` : ''}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}

/* --- добавить / изменить документ ----------------------------------------------------- */

function DocumentDialog({
  state,
  onClose,
  onSaved,
}: {
  state: { doc: KnowledgeDoc | null; title?: string; content?: string } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [reading, setReading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const open = state !== null;
  const editing = state?.doc ?? null;

  React.useEffect(() => {
    if (!state) return;
    setTitle(state.doc?.title ?? state.title ?? '');
    setContent(state.doc?.content ?? state.content ?? '');
    setError(null);
  }, [state]);

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setError(null);
    const text = await extractCvText(file, MAX_CHARS);
    setReading(false);
    if (!text) {
      setError('Could not read text from this file. Use .docx, .pdf or .txt, or paste the text.');
      return;
    }
    setContent(text);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''));
  };

  const valid = title.trim().length > 0 && content.trim().length >= 20 && content.length <= MAX_CHARS;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (editing) await assistantAdminApi.updateDocument(editing.id, title.trim(), content.trim());
      else await assistantAdminApi.addDocument(title.trim(), content.trim());
      toast.success(editing ? 'Document saved' : 'Document added. Indexing starts in the background.');
      onSaved();
    } catch (err) {
      setError(errorText(err, 'Could not save the document.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={editing ? 'Edit document' : 'Add a document'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="doc-text" className="block text-sm font-medium text-text-secondary">
              Text
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={reading}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-accent-text transition-colors hover:bg-surface-muted focus-ring"
            >
              <Upload size={13} aria-hidden /> {reading ? 'Reading…' : 'Load from a file'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.pdf,.txt,.md,text/plain,application/pdf"
              className="hidden"
              onChange={(e) => {
                void readFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          <textarea
            id="doc-text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={11}
            required
            placeholder={'Is it free for candidates?\nYes. Profile and applications are free.\n\nHow do I post a job?\nPress New job…'}
            className="mt-1.5 w-full resize-y rounded border border-line-strong bg-surface px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-text-primary placeholder:text-text-tertiary focus-ring"
          />
          <p className="mt-1 text-xs text-text-secondary">
            {content.length.toLocaleString('en-US')} / {MAX_CHARS.toLocaleString('en-US')} characters. A line ending with “?” starts a new question.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid || busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
