import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, FileText, Tag, Search, Eye, Pencil, Trash2, X,
  Sparkles, ChevronRight, Save, Paperclip, Loader2
} from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { useTags } from "@/hooks/useTags";
import { useNoteTemplates, type NoteTemplate } from "@/hooks/useNoteTemplates";
import { useAttachments } from "@/hooks/useAttachments";
import { TagInput } from "@/components/TagInput";
import { FileUpload } from "@/components/FileUpload";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// ─── Шаблоны (встроенные) ────────────────────────────────────────────────────

const TEMPLATE_CATEGORIES = [
  { id: "work", label: "Работа", emoji: "💼" },
  { id: "ideas", label: "Идеи", emoji: "💡" },
  { id: "study", label: "Учёба", emoji: "📚" },
  { id: "personal", label: "Личное", emoji: "🌱" },
];

const NOTE_TEMPLATES = [
  {
    id: "meeting", category: "work",
    name: "Протокол встречи", emoji: "🗣️",
    color: "from-blue-500/20 to-blue-600/10", accent: "blue",
    desc: "Участники, повестка, решения и задачи",
    template: {
      title: "Протокол встречи — {{date}}",
      content: `🗣️ ВСТРЕЧА\nДата: \nМесто / ссылка: \n\n👥 УЧАСТНИКИ\n— \n— \n\n📋 ПОВЕСТКА\n1. \n2. \n3. \n\n💬 ОБСУЖДЕНИЕ\n\n\n✅ РЕШЕНИЯ\n— \n— \n\n📌 ЗАДАЧИ\n— [ ] Задача — Ответственный — Срок\n— [ ] Задача — Ответственный — Срок\n\n📅 Следующая встреча: `
    }
  },
  {
    id: "brief", category: "work",
    name: "Бриф / Задание", emoji: "📋",
    color: "from-violet-500/20 to-violet-600/10", accent: "violet",
    desc: "Чёткое описание задачи для команды",
    template: {
      title: "Бриф: {название задачи}",
      content: `📋 БРИФ\n\n🎯 Цель задачи:\n\n\n📐 Требования:\n— \n— \n— \n\n🚫 Ограничения:\n— \n\n📦 Результат (что должно получиться):\n\n\n⏰ Дедлайн: \n👤 Ответственный: \n\n💬 Дополнительный контекст:\n`
    }
  },
  {
    id: "call", category: "work",
    name: "Звонок / Переговоры", emoji: "📞",
    color: "from-emerald-500/20 to-emerald-600/10", accent: "emerald",
    desc: "Заметки по итогам звонка или переговоров",
    template: {
      title: "Звонок с {имя} — {{date}}",
      content: `📞 ЗВОНОК\nС кем: \nДата и время: \nПродолжительность: \n\n🎯 Цель разговора:\n\n\n📝 Ключевые моменты:\n— \n— \n— \n\n🤝 Договорённости:\n— \n— \n\n➡️ Мои следующие шаги:\n— [ ] \n— [ ] \n\n📅 Следующий контакт: `
    }
  },
  {
    id: "report", category: "work",
    name: "Еженедельный отчёт", emoji: "📊",
    color: "from-orange-500/20 to-orange-600/10", accent: "orange",
    desc: "Итоги недели: выполнено, план, проблемы",
    template: {
      title: "Отчёт — неделя {{date}}",
      content: `📊 ЕЖЕНЕДЕЛЬНЫЙ ОТЧЁТ\nПериод: \n\n✅ ВЫПОЛНЕНО\n— \n— \n— \n\n🔄 В ПРОЦЕССЕ\n— \n— \n\n📅 ПЛАН НА СЛЕДУЮЩУЮ НЕДЕЛЮ\n— [ ] \n— [ ] \n— [ ] \n\n🚧 ПРОБЛЕМЫ И БЛОКЕРЫ\n— \n\n💡 ИДЕИ И ПРЕДЛОЖЕНИЯ\n— `
    }
  },
  {
    id: "brainstorm", category: "ideas",
    name: "Мозговой штурм", emoji: "⚡",
    color: "from-yellow-500/20 to-yellow-600/10", accent: "yellow",
    desc: "Быстрый сброс идей без фильтров",
    template: {
      title: "Мозговой штурм: {тема}",
      content: `⚡ ТЕМА: \n\n🧠 ИДЕИ (без фильтра, всё что приходит):\n— \n— \n— \n— \n— \n— \n— \n— \n\n⭐ ЛУЧШИЕ ИДЕИ (после фильтрации):\n1. \n2. \n3. \n\n➡️ СЛЕДУЮЩИЙ ШАГ:\n`
    }
  },
  {
    id: "idea", category: "ideas",
    name: "Идея проекта", emoji: "💡",
    color: "from-amber-500/20 to-amber-600/10", accent: "amber",
    desc: "Оформить идею от сути до первых шагов",
    template: {
      title: "Идея: {название}",
      content: `💡 СУТЬ ИДЕИ\n\n\n🎯 КАКУЮ ПРОБЛЕМУ РЕШАЕТ?\n\n\n👥 ДЛЯ КОГО?\n\n\n✨ ПОЧЕМУ ЭТО СРАБОТАЕТ?\n— \n— \n\n⚠️ ВОЗМОЖНЫЕ СЛОЖНОСТИ:\n— \n— \n\n🏁 ПЕРВЫЕ ШАГИ:\n1. \n2. \n3. \n\n📊 ОЦЕНКА ПОТЕНЦИАЛА (1-10): `
    }
  },
  {
    id: "swot", category: "ideas",
    name: "SWOT-анализ", emoji: "🔲",
    color: "from-rose-500/20 to-rose-600/10", accent: "rose",
    desc: "Сильные стороны, слабости, возможности, угрозы",
    template: {
      title: "SWOT: {объект анализа}",
      content: `🔲 SWOT-АНАЛИЗ\nОбъект: \n\n💪 СИЛЬНЫЕ СТОРОНЫ (Strengths)\n— \n— \n— \n\n⚠️ СЛАБЫЕ СТОРОНЫ (Weaknesses)\n— \n— \n— \n\n🌱 ВОЗМОЖНОСТИ (Opportunities)\n— \n— \n— \n\n🚨 УГРОЗЫ (Threats)\n— \n— \n— \n\n📌 ВЫВОД:\n`
    }
  },
  {
    id: "lecture", category: "study",
    name: "Конспект лекции", emoji: "📖",
    color: "from-cyan-500/20 to-cyan-600/10", accent: "cyan",
    desc: "Структурированные заметки с лекции или урока",
    template: {
      title: "Конспект: {тема}",
      content: `📖 КОНСПЕКТ\nТема: \nДата: \nИсточник / лектор: \n\n🎯 ОСНОВНАЯ МЫСЛЬ:\n\n\n📝 КЛЮЧЕВЫЕ ТЕЗИСЫ:\n1. \n2. \n3. \n4. \n\n📌 ВАЖНЫЕ ДЕТАЛИ:\n— \n— \n\n❓ ВОПРОСЫ И НЕПОНЯТНЫЕ МОМЕНТЫ:\n— \n— \n\n💡 МОИ МЫСЛИ И ИНСАЙТЫ:\n\n\n📚 ИСТОЧНИКИ ДЛЯ УГЛУБЛЕНИЯ:\n— `
    }
  },
  {
    id: "research", category: "study",
    name: "Исследование", emoji: "🔍",
    color: "from-indigo-500/20 to-indigo-600/10", accent: "indigo",
    desc: "Систематизация данных и выводов по теме",
    template: {
      title: "Исследование: {тема}",
      content: `🔍 ИССЛЕДОВАНИЕ\nТема: \nЦель: \n\n❓ КЛЮЧЕВЫЕ ВОПРОСЫ:\n1. \n2. \n3. \n\n📊 ДАННЫЕ И ФАКТЫ:\n— \n— \n— \n\n📚 ИСТОЧНИКИ:\n1. \n2. \n3. \n\n💡 АНАЛИЗ И ИНТЕРПРЕТАЦИЯ:\n\n\n✅ ВЫВОДЫ:\n— \n— \n\n➡️ ДАЛЬНЕЙШЕЕ ИЗУЧЕНИЕ:\n— `
    }
  },
  {
    id: "book", category: "study",
    name: "Заметки по книге", emoji: "📕",
    color: "from-fuchsia-500/20 to-fuchsia-600/10", accent: "fuchsia",
    desc: "Ключевые мысли, цитаты и выводы из книги",
    template: {
      title: "Книга: {название}",
      content: `📕 КНИГА\nНазвание: \nАвтор: \nДата прочтения: \nОценка: ⭐⭐⭐⭐⭐\n\n🎯 ГЛАВНАЯ ИДЕЯ КНИГИ:\n\n\n💬 КЛЮЧЕВЫЕ ЦИТАТЫ:\n«»\n«»\n«»\n\n📌 ТОП ИНСАЙТОВ:\n1. \n2. \n3. \n4. \n5. \n\n🔄 ЧТО ИЗМЕНЮ В СВОЕЙ ЖИЗНИ:\n— \n— \n\n👍 КОМУ РЕКОМЕНДУЮ И ПОЧЕМУ:\n`
    }
  },
  {
    id: "journal", category: "personal",
    name: "Дневник дня", emoji: "🌅",
    color: "from-pink-500/20 to-pink-600/10", accent: "pink",
    desc: "Рефлексия, благодарность и настроение дня",
    template: {
      title: "Дневник — {{date}}",
      content: `🌅 ДЕНЬ: \n\n😊 НАСТРОЕНИЕ (1-10): \n\n🙏 3 ВЕЩИ ЗА КОТОРЫЕ Я БЛАГОДАРЕН:\n1. \n2. \n3. \n\n⚡ ЧТО ДАЛО МНЕ ЭНЕРГИЮ:\n\n\n😤 ЧТО ЗАБРАЛО ЭНЕРГИЮ:\n\n\n🏆 ГЛАВНОЕ ДОСТИЖЕНИЕ ДНЯ:\n\n\n💭 О ЧЁМ ДУМАЮ:\n\n\n🌙 НАМЕРЕНИЕ НА ЗАВТРА:\n`
    }
  },
  {
    id: "goals", category: "personal",
    name: "Цели по SMART", emoji: "🎯",
    color: "from-teal-500/20 to-teal-600/10", accent: "teal",
    desc: "Грамотно сформулированная цель с планом",
    template: {
      title: "Цель: {название}",
      content: `🎯 ЦЕЛЬ ПО SMART\n\n📌 Конкретная (Specific):\nЧего именно я хочу достичь?\n\n\n📏 Измеримая (Measurable):\nКак я пойму что достиг цели?\n\n\n💪 Достижимая (Achievable):\nПочему эта цель реалистична для меня?\n\n\n🔗 Значимая (Relevant):\nЗачем мне это нужно? Что изменится?\n\n\n⏰ Ограниченная по времени (Time-bound):\nДедлайн: \n\n📋 ПЛАН ДЕЙСТВИЙ:\n— [ ] Шаг 1\n— [ ] Шаг 2\n— [ ] Шаг 3\n\n📊 ПРОГРЕСС:\n`
    }
  },
  {
    id: "travel", category: "personal",
    name: "План путешествия", emoji: "✈️",
    color: "from-sky-500/20 to-sky-600/10", accent: "sky",
    desc: "Маршрут, жильё, активности и бюджет",
    template: {
      title: "Путешествие: {место}",
      content: `✈️ ПУТЕШЕСТВИЕ\nНаправление: \nДаты: \nБюджет: \n\n🏨 ЖИЛЬЁ:\nАдрес: \nБронь: \n\n🗺️ МАРШРУТ ПО ДНЯМ:\nДень 1: \nДень 2: \nДень 3: \n\n🎡 АКТИВНОСТИ И МЕСТА:\n— [ ] \n— [ ] \n— [ ] \n— [ ] \n\n🍽️ РЕСТОРАНЫ И КАФЕ:\n— \n— \n\n💼 ЧТО ВЗЯТЬ:\n— [ ] Документы\n— [ ] \n— [ ] \n\n💡 СОВЕТЫ И ЗАМЕТКИ:\n`
    }
  },
  {
    id: "workout", category: "personal",
    name: "Тренировка", emoji: "💪",
    color: "from-red-500/20 to-red-600/10", accent: "red",
    desc: "Программа тренировки с подходами и весами",
    template: {
      title: "Тренировка — {{date}}",
      content: `💪 ТРЕНИРОВКА\nДата: \nТип: (силовая / кардио / растяжка)\nНастроение до: ⭐⭐⭐⭐⭐\n\n🏋️ УПРАЖНЕНИЯ:\n\nУпражнение 1: \nПодходы × Повторения: \nВес: \n\nУпражнение 2: \nПодходы × Повторения: \nВес: \n\nУпражнение 3: \nПодходы × Повторения: \nВес: \n\nУпражнение 4: \nПодходы × Повторения: \nВес: \n\n⏱️ Длительность: \n🔥 Самочувствие после: ⭐⭐⭐⭐⭐\n\n📝 Заметки:`
    }
  },
  {
    id: "recipe", category: "personal",
    name: "Рецепт", emoji: "🍳",
    color: "from-lime-500/20 to-lime-600/10", accent: "lime",
    desc: "Ингредиенты, шаги приготовления и советы",
    template: {
      title: "Рецепт: {блюдо}",
      content: `🍳 РЕЦЕПТ\nБлюдо: \nПорции: \nВремя приготовления: \nСложность: ⭐⭐⭐⭐⭐\n\n🛒 ИНГРЕДИЕНТЫ:\n— \n— \n— \n— \n— \n\n👨‍🍳 ПРИГОТОВЛЕНИЕ:\n1. \n2. \n3. \n4. \n5. \n\n💡 СОВЕТЫ И ХИТРОСТИ:\n— \n— \n\n⭐ ОЦЕНКА: \n📸 Фото: `
    }
  },
];

const ACCENT_COLORS: Record<string, string> = {
  blue: "border-l-blue-500 bg-blue-500/5",
  violet: "border-l-violet-500 bg-violet-500/5",
  emerald: "border-l-emerald-500 bg-emerald-500/5",
  orange: "border-l-orange-500 bg-orange-500/5",
  yellow: "border-l-yellow-500 bg-yellow-500/5",
  amber: "border-l-amber-500 bg-amber-500/5",
  rose: "border-l-rose-500 bg-rose-500/5",
  cyan: "border-l-cyan-500 bg-cyan-500/5",
  indigo: "border-l-indigo-500 bg-indigo-500/5",
  fuchsia: "border-l-fuchsia-500 bg-fuchsia-500/5",
  pink: "border-l-pink-500 bg-pink-500/5",
  teal: "border-l-teal-500 bg-teal-500/5",
  sky: "border-l-sky-500 bg-sky-500/5",
  red: "border-l-red-500 bg-red-500/5",
  lime: "border-l-lime-500 bg-lime-500/5",
};

function getNoteAccent(note: any): string {
  const emojiToAccent: Record<string, string> = {
    "🗣️": "blue", "📋": "violet", "📞": "emerald", "📊": "orange",
    "⚡": "yellow", "💡": "amber", "🔲": "rose",
    "📖": "cyan", "🔍": "indigo", "📕": "fuchsia",
    "🌅": "pink", "🎯": "teal", "✈️": "sky", "💪": "red", "🍳": "lime",
  };
  if (!note.content) return "";
  const firstEmoji = note.content.trim().slice(0, 2);
  return emojiToAccent[firstEmoji] || "";
}

export default function Notes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [newNoteTags, setNewNoteTags] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("work");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const { notes, isLoading, createNote, createNoteAsync, updateNote, deleteNote } = useNotes();
  const { getEntityTags, addTagToEntity } = useTags();
  const { templates: userTemplates, createTemplate, deleteTemplate } = useNoteTemplates();
  const { uploadAttachment } = useAttachments();
  const [noteTags, setNoteTags] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const loadAllTags = async () => {
      const tagsMap: Record<string, any[]> = {};
      for (const note of notes) {
        const tags = await getEntityTags("note", note.id);
        tagsMap[note.id] = tags;
      }
      setNoteTags(tagsMap);
    };
    if (notes.length > 0) loadAllTags();
  }, [notes]);

  const replaceVars = (str: string) => {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return str.replace(/\{\{date\}\}/g, date).replace(/\{\{time\}\}/g, time);
  };

  const openWithTemplate = (template: any) => {
    setSelectedTemplate({
      ...template,
      template: {
        title: replaceVars(template.template.title),
        content: replaceVars(template.template.content),
      }
    });
    setIsTemplatePickerOpen(false);
    setIsDialogOpen(true);
  };

  const openWithUserTemplate = (tpl: NoteTemplate) => {
    setSelectedTemplate({
      name: tpl.name,
      emoji: "📄",
      template: {
        title: replaceVars(tpl.title),
        content: tpl.content ? replaceVars(tpl.content) : "",
      }
    });
    setIsTemplatePickerOpen(false);
    setIsDialogOpen(true);
  };

  const saveCurrentNoteAsTemplate = () => {
    if (!selectedNote) return;
    setNewTemplateName(selectedNote.title || "");
    setIsSaveTemplateDialogOpen(true);
  };

  const confirmSaveTemplate = () => {
    if (!selectedNote || !newTemplateName.trim()) return;
    createTemplate.mutate({ name: newTemplateName.trim(), title: selectedNote.title, content: selectedNote.content || "" });
    setIsSaveTemplateDialogOpen(false);
    setNewTemplateName("");
  };

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const noteData = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    };

    if (editingNote) {
      const tagIds = (noteTags[editingNote.id] || []).map((t: any) => t.id);
      updateNote({ id: editingNote.id, ...noteData, tagIds });
      setEditingNote(null);
    } else {
      try {
        const newNote = await createNoteAsync(noteData);
        if (newNote && newNoteTags.length > 0) {
          for (const tag of newNoteTags) {
            addTagToEntity({ entityType: 'note', entityId: (newNote as any).id, tagId: tag.id });
          }
        }
        if (newNote && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            uploadAttachment({ file, entityType: 'note', entityId: (newNote as any).id });
          }
        }
      } catch {
        return;
      }
      setNewNoteTags([]);
      setPendingFiles([]);
    }
    setIsDialogOpen(false);
    setSelectedTemplate(null);
    e.currentTarget.reset();
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const tags = noteTags[note.id] || [];
    const matchesTags = tags.some((tag: any) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch || matchesTags;
  });

  const stats = {
    total: notes.length,
    thisWeek: notes.filter(n => {
      const noteDate = new Date(n.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return noteDate >= weekAgo;
    }).length,
    withTags: Object.values(noteTags).filter(t => t.length > 0).length,
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Загрузка заметок...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-primary/80 to-slate-900 p-8 min-h-[160px]">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Заголовок */}
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Ваши идеи и записи
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">Заметки</h1>
            <p className="text-white/40 text-xs mt-2">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: ru })}
            </p>
          </div>

          {/* Статистика */}
          <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
            {[
              { label: "Всего", value: stats.total, icon: FileText, color: "text-blue-400" },
              { label: "За неделю", value: stats.thisWeek, icon: Sparkles, color: "text-green-400" },
              { label: "С тегами", value: stats.withTags, icon: Tag, color: "text-amber-400" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <s.icon className={cn("h-5 w-5 flex-shrink-0", s.color)} />
                <div>
                  <p className="text-white/40 text-xs leading-none">{s.label}</p>
                  <p className="text-white font-bold text-2xl leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setIsTemplatePickerOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium bg-amber-500/20 hover:bg-amber-500/40 border-amber-500/30 text-amber-300"
            >
              <Sparkles className="h-4 w-4" />
              Шаблоны
            </button>
            <button
              onClick={() => { setSelectedTemplate(null); setIsDialogOpen(true); }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300"
            >
              <Plus className="h-4 w-4" />
              Новая заметка
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ПОИСК
      ═══════════════════════════════════════════ */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по заметкам и тегам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-10 bg-muted/40 border-border/60"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          СЕТКА ЗАМЕТОК
      ═══════════════════════════════════════════ */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="font-semibold">
              {searchQuery ? "Заметки не найдены" : "Заметок пока нет"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Попробуйте изменить запрос" : "Создайте первую заметку или воспользуйтесь шаблоном"}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => setIsTemplatePickerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-600 dark:text-amber-400"
            >
              <Sparkles className="h-4 w-4" />
              Выбрать шаблон
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNotes.map((note) => {
            const accent = getNoteAccent(note);
            const accentClass = accent
              ? `border-l-4 ${ACCENT_COLORS[accent]}`
              : "border-border/50 bg-card";
            const firstLine = note.content?.split('\n')[0] || "";
            const emoji = firstLine.match(/^\p{Emoji}/u)?.[0] || "📝";
            const tags = noteTags[note.id] || [];

            return (
              <div
                key={note.id}
                className={cn(
                  "group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm hover:border-border",
                  accentClass
                )}
                onClick={() => { setSelectedNote(note); setIsViewDialogOpen(true); }}
              >
                {/* Заголовок карточки */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0 mt-0.5">{emoji}</span>
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 break-all">{note.title}</h3>
                  </div>
                  {/* Действия при наведении */}
                  <div
                    className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => { setSelectedNote(note); setIsViewDialogOpen(true); }}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => { setEditingNote(note); setIsDialogOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => setDeletingNoteId(note.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Превью содержания */}
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1 mb-3">
                  {note.content
                    ? note.content.replace(/^.+\n/, "").replace(/[#\-\[\]]/g, "").trim() || "Нет содержания"
                    : "Нет содержания"}
                </p>

                {/* Футер: теги + дата */}
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {tags.slice(0, 2).map((tag: any) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs px-1.5 py-0 h-4">
                        {tag.name}
                      </Badge>
                    ))}
                    {tags.length > 2 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                        +{tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60 flex-shrink-0">
                    {new Date(note.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Диалог создания / редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) { setEditingNote(null); setSelectedTemplate(null); setNewNoteTags([]); setPendingFiles([]); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && <span>{selectedTemplate.emoji}</span>}
              {editingNote ? "Редактировать заметку" : selectedTemplate ? selectedTemplate.name : "Новая заметка"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <Label htmlFor="title">Название</Label>
              <Input
                id="title" name="title"
                defaultValue={editingNote?.title || selectedTemplate?.template.title || ""}
                placeholder="Введите название заметки"
                required
              />
            </div>
            <div>
              <Label htmlFor="content">Содержание</Label>
              <Textarea
                id="content" name="content"
                defaultValue={editingNote?.content || selectedTemplate?.template.content || ""}
                placeholder="Напишите содержание заметки..."
                className="min-h-[280px] font-mono text-sm"
              />
            </div>
            <div>
              <Label>Теги</Label>
              <TagInput
                selectedTags={editingNote ? (noteTags[editingNote.id] || []) : newNoteTags}
                onTagsChange={(tags) => {
                  if (editingNote) {
                    setNoteTags(prev => ({ ...prev, [editingNote.id]: tags }));
                  } else {
                    setNewNoteTags(tags);
                  }
                }}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-2">
                <Paperclip className="h-3.5 w-3.5" />
                Вложения
              </Label>
              <FileUpload
                entityType="note"
                entityId={editingNote?.id || null}
                pendingFiles={editingNote ? undefined : pendingFiles}
                onPendingFilesChange={editingNote ? undefined : setPendingFiles}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingNote(null); setSelectedTemplate(null); setNewNoteTags([]); setPendingFiles([]); }}>Отмена</Button>
              <Button type="submit">{editingNote ? "Сохранить" : "Создать"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Выбор шаблона */}
      <Dialog open={isTemplatePickerOpen} onOpenChange={setIsTemplatePickerOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Выбор шаблона
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 flex-wrap">
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto flex-1 pr-1 space-y-4">
            {userTemplates.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">Мои шаблоны</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userTemplates.map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => openWithUserTemplate(tpl)}
                      className="relative p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-medium text-sm flex items-center gap-2">
                          <span>📄</span>
                          <span>{tpl.name}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTemplate.mutate(tpl.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{tpl.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">Встроенные шаблоны</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NOTE_TEMPLATES.filter(t => t.category === activeCategory).map(template => (
                  <button
                    key={template.id}
                    onClick={() => openWithTemplate(template)}
                    className={cn(
                      "text-left p-4 rounded-xl border bg-gradient-to-br hover:scale-[1.02] transition-all group",
                      template.color
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{template.emoji}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </div>
                    <p className="font-semibold text-sm mb-1">{template.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{template.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => { setSelectedTemplate(null); setIsTemplatePickerOpen(false); setIsDialogOpen(true); }}
            >
              <FileText className="h-4 w-4" />
              Создать пустую заметку
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Название нового шаблона */}
      <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Сохранить как шаблон</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="templateName">Название шаблона</Label>
              <Input
                id="templateName"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmSaveTemplate(); } }}
                autoFocus
                className="mt-1"
              />
            </div>
            <Button className="w-full" disabled={!newTemplateName.trim()} onClick={confirmSaveTemplate}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Просмотр заметки */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8 break-all">{selectedNote?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 min-w-0">
            <div className="whitespace-pre-wrap break-all text-sm leading-relaxed font-mono bg-muted/30 rounded-xl p-4">
              {selectedNote?.content || "Нет содержания"}
            </div>
            {(noteTags[selectedNote?.id] || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                {noteTags[selectedNote.id].map((tag: any) => (
                  <Badge key={tag.id} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="pt-2 border-t">
              <Label className="flex items-center gap-1.5 mb-2">
                <Paperclip className="h-3.5 w-3.5" />
                Вложения
              </Label>
              {selectedNote && (
                <FileUpload entityType="note" entityId={selectedNote.id} readOnly />
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm" variant="outline"
                onClick={() => { setIsViewDialogOpen(false); setEditingNote(selectedNote); setIsDialogOpen(true); }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Редактировать
              </Button>
              <Button size="sm" variant="outline" onClick={saveCurrentNoteAsTemplate}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Сохранить как шаблон
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <AlertDialog open={!!deletingNoteId} onOpenChange={() => setDeletingNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заметку?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить. Заметка будет удалена навсегда.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingNoteId) { deleteNote(deletingNoteId); setDeletingNoteId(null); } }}
              className="bg-destructive"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
