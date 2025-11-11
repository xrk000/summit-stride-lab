import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, FileText, Calendar as CalendarIcon } from "lucide-react";

type Note = {
  id: number;
  title: string;
  preview: string;
  tags: string[];
  date: string;
  words: number;
  content?: string;
};

export default function Notes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const templates = [
    { id: 1, name: "Конспект лекций", icon: "📝", color: "primary", template: "Тема:\n\nОсновные пункты:\n1. \n2. \n3. \n\nВыводы:" },
    { id: 2, name: "Список продуктов", icon: "🛒", color: "success", template: "Продукты:\n☐ \n☐ \n☐ " },
    { id: 3, name: "Идеи проекта", icon: "💡", color: "warning", template: "Название проекта:\n\nОписание:\n\nЦели:\n-\n-\n\nЗадачи:\n-\n-" },
    { id: 4, name: "Встреча", icon: "🤝", color: "accent", template: "Дата встречи:\n\nУчастники:\n-\n-\n\nПовестка:\n1.\n2.\n\nРешения:" },
  ];

  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Конспект: Веб-разработка",
      preview: "React компоненты, хуки, state management...",
      tags: ["учеба", "программирование"],
      date: "Сегодня, 10:30",
      words: 456,
      content: "React компоненты, хуки, state management, useEffect, useState...",
    },
    {
      id: 2,
      title: "Продукты на неделю",
      preview: "Молоко, хлеб, яйца, овощи...",
      tags: ["личное", "покупки"],
      date: "Вчера, 18:20",
      words: 42,
      content: "Молоко, хлеб, яйца, овощи, фрукты, мясо",
    },
    {
      id: 3,
      title: "Идеи для дипломного проекта",
      preview: "Система управления продуктивностью с интеграциями...",
      tags: ["работа", "идеи", "проект"],
      date: "3 дня назад",
      words: 234,
      content: "Система управления продуктивностью с интеграциями календарей, заметок и задач",
    },
  ]);

  const handleAddNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    const wordCount = content.trim().split(/\s+/).length;
    const tags = (formData.get("tags") as string).split(",").map(t => t.trim()).filter(Boolean);
    
    const newNote: Note = {
      id: notes.length + 1,
      title: formData.get("title") as string,
      preview: content.substring(0, 50) + "...",
      tags,
      date: "Только что",
      words: wordCount,
      content,
    };
    setNotes([newNote, ...notes]);
    setIsDialogOpen(false);
    setSelectedTemplate(null);
    e.currentTarget.reset();
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedTemplate(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новая заметка
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новая заметка</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Содержание</Label>
                <Textarea 
                  id="content" 
                  name="content" 
                  rows={10} 
                  defaultValue={selectedTemplate || ""}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input id="tags" name="tags" placeholder="работа, личное, идеи" />
              </div>
              <Button type="submit" className="w-full">Создать заметку</Button>
            </form>
          </DialogContent>
        </Dialog>
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
                onClick={() => handleTemplateSelect(template.template)}
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
          <Card 
            key={note.id} 
            className="shadow-md hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setSelectedNote(note)}
          >
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

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selectedNote?.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedNote?.date} • {selectedNote?.words} слов
            </div>
            <div className="whitespace-pre-wrap text-sm">
              {selectedNote?.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
