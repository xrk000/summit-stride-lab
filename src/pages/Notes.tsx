import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, FileText, Calendar as CalendarIcon, Pencil, Trash2 } from "lucide-react";

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
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
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
    
    if (editingNote) {
      setNotes(notes.map(note =>
        note.id === editingNote.id
          ? {
              ...note,
              title: formData.get("title") as string,
              preview: content.substring(0, 50) + "...",
              tags,
              words: wordCount,
              content,
            }
          : note
      ));
      setEditingNote(null);
    } else {
      const newNote: Note = {
        id: Math.max(0, ...notes.map(n => n.id)) + 1,
        title: formData.get("title") as string,
        preview: content.substring(0, 50) + "...",
        tags,
        date: "Только что",
        words: wordCount,
        content,
      };
      setNotes([newNote, ...notes]);
    }
    setIsDialogOpen(false);
    setSelectedTemplate(null);
    e.currentTarget.reset();
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const handleDeleteNote = (noteId: number) => {
    setNotes(notes.filter(note => note.id !== noteId));
    setDeletingNoteId(null);
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

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    return note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Заметки</h1>
          <p className="text-muted-foreground mt-1">Фиксируйте идеи и важную информацию</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedTemplate(null);
            setEditingNote(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новая заметка
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Редактировать заметку" : "Новая заметка"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" defaultValue={editingNote?.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Содержание</Label>
                <Textarea 
                  id="content" 
                  name="content" 
                  rows={10} 
                  defaultValue={editingNote?.content || selectedTemplate || ""}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input 
                  id="tags" 
                  name="tags" 
                  defaultValue={editingNote?.tags.join(", ")}
                  placeholder="работа, личное, идеи" 
                />
              </div>
              <Button type="submit" className="w-full">
                {editingNote ? "Сохранить" : "Создать заметку"}
              </Button>
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
        <Input 
          placeholder="Поиск по заметкам и тегам..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.map((note) => (
          <Card 
            key={note.id} 
            className="shadow-md hover:shadow-lg transition-all"
          >
            <CardContent className="p-5">
              <div className="space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className="font-semibold text-lg flex-1 cursor-pointer" onClick={() => setSelectedNote(note)}>
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditNote(note)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingNoteId(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm cursor-pointer" onClick={() => setSelectedNote(note)}>
                    {note.preview}
                  </p>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingNoteId} onOpenChange={() => setDeletingNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заметку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту заметку? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingNoteId && handleDeleteNote(deletingNoteId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
