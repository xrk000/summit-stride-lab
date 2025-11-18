import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Tag, Search, Eye, Pencil, Trash2, Paperclip } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { useTags } from "@/hooks/useTags";
import { TagInput } from "@/components/TagInput";
import { FileUpload } from "@/components/FileUpload";

const noteTemplates = [
  { id: "meeting", name: "Протокол встречи", icon: "📝" },
  { id: "idea", name: "Идея", icon: "💡" },
  { id: "todo", name: "Чек-лист", icon: "✅" },
  { id: "research", name: "Исследование", icon: "🔍" },
];

export default function Notes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes();
  const { getEntityTags } = useTags();

  const [noteTags, setNoteTags] = useState<Record<string, any[]>>({});

  // Load tags for a note
  useEffect(() => {
    const loadAllTags = async () => {
      const tagsMap: Record<string, any[]> = {};
      for (const note of notes) {
        const tags = await getEntityTags("note", note.id);
        tagsMap[note.id] = tags;
      }
      setNoteTags(tagsMap);
    };
    if (notes.length > 0) {
      loadAllTags();
    }
  }, [notes, getEntityTags]);

  const handleAddNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const noteData = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    };

    if (editingNote) {
      updateNote({ id: editingNote.id, ...noteData });
      setEditingNote(null);
    } else {
      createNote(noteData);
    }
    
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const handleDeleteNote = (noteId: string) => {
    setDeletingNoteId(noteId);
  };

  const confirmDelete = () => {
    if (deletingNoteId) {
      deleteNote(deletingNoteId);
      setDeletingNoteId(null);
    }
  };

  const handleViewNote = (note: any) => {
    setSelectedNote(note);
    setIsViewDialogOpen(true);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const stats = {
    total: notes.length,
    thisWeek: notes.filter(n => {
      const noteDate = new Date(n.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return noteDate >= weekAgo;
    }).length,
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Загрузка заметок...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Заметки</h1>
          <p className="text-muted-foreground mt-1">Управляйте своими идеями и информацией</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingNote(null);
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
              <div>
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingNote?.title}
                  placeholder="Введите название заметки"
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Содержание</Label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={editingNote?.content}
                  placeholder="Напишите содержание заметки..."
                  className="min-h-[200px]"
                />
              </div>
              {editingNote && (
                <>
                  <div>
                    <Label>Теги</Label>
                    <TagInput
                      entityType="note"
                      entityId={editingNote.id}
                      selectedTags={noteTags[editingNote.id] || []}
                      onTagsChange={async () => {
                        const tags = await getEntityTags("note", editingNote.id);
                        setNoteTags(prev => ({ ...prev, [editingNote.id]: tags }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Вложения</Label>
                    <FileUpload entityType="note" entityId={editingNote.id} />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingNote ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего заметок</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">За эту неделю</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <Plus className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">С тегами</p>
                <p className="text-2xl font-bold">
                  {Object.values(noteTags).filter(t => t.length > 0).length}
                </p>
              </div>
              <Tag className="h-8 w-8 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Шаблоны</h3>
        <div className="flex gap-2 flex-wrap">
          {noteTemplates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDialogOpen(true);
              }}
            >
              <span className="mr-2">{template.icon}</span>
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по заметкам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="shadow-elegant hover:shadow-glow transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span className="line-clamp-1">{note.title}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewNote(note)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditNote(note)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {note.content || "Нет содержания"}
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {(noteTags[note.id] || []).map((tag: any) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(note.updated_at).toLocaleDateString('ru-RU')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{selectedNote?.content}</p>
            </div>
            {(noteTags[selectedNote?.id] || []).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Теги</h4>
                <div className="flex flex-wrap gap-1">
                  {noteTags[selectedNote.id].map((tag: any) => (
                    <Badge key={tag.id} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingNoteId} onOpenChange={() => setDeletingNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заметку?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Заметка будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}