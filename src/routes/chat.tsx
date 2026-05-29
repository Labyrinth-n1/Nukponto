import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Flame, Swords, ShieldCheck, BookOpen, Users, RefreshCw, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { askAssistant } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Nukponto · Assistant géopolitique IA" }, { name: "description", content: "Chat IA pour résumer crises, expliquer conflits, vérifier infos virales et obtenir le contexte historique — corpus réel GDELT Bénin." }] }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string; sources?: Array<{ n: number; title: string; source: string | null; url: string | null; date: string | null; location: string | null }> };
type Intent = "auto" | "summarize_crisis" | "explain_conflict" | "verify_info" | "historical_context" | "citizen_qa";

const QUICK_ACTIONS: Array<{ id: Intent; icon: typeof Flame; label: string; prompt: string }> = [
  { id: "summarize_crisis", icon: Flame, label: "Résumer une crise", prompt: "Résume la crise géopolitique la plus active actuellement au Bénin et dans la région." },
  { id: "explain_conflict", icon: Swords, label: "Expliquer un conflit", prompt: "Explique le conflit régional qui affecte le plus le Bénin en ce moment : acteurs, causes, dynamique." },
  { id: "verify_info", icon: ShieldCheck, label: "Vérifier une info", prompt: "Vérifie cette information virale : [colle ici la rumeur ou le titre à vérifier]" },
  { id: "historical_context", icon: BookOpen, label: "Contexte historique", prompt: "Donne le contexte historique des tensions actuelles dans le nord du Bénin." },
  { id: "citizen_qa", icon: Users, label: "Question citoyenne", prompt: "Pourquoi y a-t-il une présence militaire renforcée dans le nord du pays ?" },
];

function ChatPage() {
  const { t, lang } = useI18n();
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [intent, setIntent] = useState<Intent>("auto");
  const scrollRef = useRef<HTMLDivElement>(null);

  const mut = useMutation({
    mutationFn: (q: string) => ask({
      data: {
        question: q,
        lang,
        intent,
        history: msgs.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      },
    }),
    onSuccess: (r) => setMsgs((m) => [...m, { role: "assistant", content: r.answer, sources: r.sources }]),
    onError: (e: Error) => setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${e.message}` }]),
  });

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, mut.isPending]);

  const send = (override?: string) => {
    const q = (override ?? input).trim();
    if (!q || mut.isPending) return;
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    mut.mutate(q);
  };

  const runQuick = (a: typeof QUICK_ACTIONS[number]) => {
    setIntent(a.id);
    send(a.prompt);
  };

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="mx-auto flex max-w-[1500px] gap-2">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar title={t("chat.title")} subtitle={t("chat.subtitle")} />

          <div className="panel-violet mb-4 flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Assistant géopolitique · RAG temps réel</h2>
                <p className="text-xs text-white/80">Résume crises · explique conflits · vérifie infos virales · contexte historique — données réelles GDELT.</p>
              </div>
            </div>
            {msgs.length > 0 && (
              <button onClick={() => setMsgs([])} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20 hover:bg-white/25">
                <RefreshCw className="h-3 w-3" /> Nouvelle conversation
              </button>
            )}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              const active = intent === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => runQuick(a)}
                  disabled={mut.isPending}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                    active ? "border-transparent bg-gradient-violet text-white shadow-violet" : "border-border bg-white text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {a.label}
                </button>
              );
            })}
          </div>

          <div ref={scrollRef} className="panel flex min-h-[460px] max-h-[60vh] flex-col gap-4 overflow-y-auto p-5">
            {msgs.length === 0 && (
              <div className="m-auto max-w-md text-center">
                <p className="text-sm text-muted-foreground">{t("chat.empty")}</p>
                <p className="mt-2 text-xs text-muted-foreground">Choisis une action rapide ci-dessus ou pose ta question directement.</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-soft ${
                  m.role === "user"
                    ? "bg-gradient-violet text-white"
                    : "border border-border bg-white text-foreground"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <details className="mt-3 border-t border-border/50 pt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Sources ({m.sources.length})</summary>
                      <ul className="mt-2 space-y-1.5">
                        {m.sources.map((s) => (
                          <li key={s.n} className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">[{s.n}]</span>{" "}
                            {s.url ? (
                              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                {s.title} <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : <span>{s.title}</span>}
                            <span className="ml-1">— {s.source}{s.date ? ` · ${s.date.slice(0, 10)}` : ""}{s.location ? ` · ${s.location}` : ""}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {mut.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm text-muted-foreground shadow-soft">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    {t("chat.thinking")}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="panel mt-4 flex items-center gap-2 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={t("chat.placeholder")}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => send()}
              disabled={mut.isPending || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-coral px-4 py-2 text-sm font-semibold text-white shadow-coral disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> {t("chat.send")}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
