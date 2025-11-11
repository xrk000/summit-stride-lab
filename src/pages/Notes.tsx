import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Calendar as CalendarIcon } from "lucide-react";

export default function Notes() {
  const templates = [
    { id: 1, name: "Конспект лекций", icon: "📝", color: "primary" },
    { id: 2, name: "Список продуктов", icon: "🛒", color: "success" },
    { id: 3, name: "Идеи проекта", icon: "💡", color: "warning" },
    { id: 4, name: "Встреча", icon: "🤝", color: "accent" },
  ];

  const notes = [
    {
      id: 1,
      title: "Конспект: Веб-разработка",
      preview: "React компоненты, хуки, state management...",
      tags: ["учеба", "программирование"],
      date: "Сегодня, 10:30",
      words: 456,
    },
    {
      id: 2,
      title: "Продукты на неделю",
      preview: "Молоко, хлеб, яйца, овощи...",
      tags: ["личное", "покупки"],
      date: "Вчера, 18:20",
      words: 42,
    },
    {
      id: 3,
      title: "Идеи для дипломного проекта",
      preview: "Система управления продуктивностью с интеграциями...",
      tags: ["работа", "идеи", "проект"],
      date: "3 дня назад",
      words: 234,
    },
  ];

  const stats = {
    totalNotes: 15,
    totalWords: 3421,
    popularTags: ["работа", "учеба", "личное"],
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Заметки</h1>
          <p className="text-muted-foreground mt-1">Фиксируйте идеи и важную информацию</p>
        </div>
        <Button className="bg-primary">
          <Plus className="h-4 w-4 mr-2" />
          Новая заметка
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего заметок</p>
                <p className="text-2xl font-bold">{stats.totalNotes}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего слов</p>
                <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
              </div>
              <div className="text-4xl opacity-50">📝</div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Популярные теги</p>
              <div className="flex flex-wrap gap-1">
                {stats.popularTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Шаблоны заметок</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:bg-muted"
              >
                <span className="text-2xl">{template.icon}</span>
                <span className="text-sm">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Поиск по заметкам и тегам..." className="pl-9" />
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="shadow-md hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-5">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{note.title}</h3>
                  <p className="text-muted-foreground text-sm">{note.preview}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {note.date}
                    </span>
                    <span>{note.words} слов</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
