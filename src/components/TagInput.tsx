import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTags } from "@/hooks/useTags";

interface TagInputProps {
  selectedTags: any[];
  onTagsChange: (tags: any[]) => void;
}

// Только локальный список — реальное сохранение в БД происходит при сабмите родительской формы (кнопка "Сохранить").
export const TagInput = ({ selectedTags, onTagsChange }: TagInputProps) => {
  const { tags, createTag } = useTags();
  const [newTagName, setNewTagName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag || selectedTags.some(t => t.id === tagId)) return;
    onTagsChange([...selectedTags, tag]);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();
    if (trimmedName) {
      // Проверяем, существует ли уже такой тег
      const existingTag = tags.find(t => t.name.toLowerCase() === trimmedName.toLowerCase());
      if (existingTag) {
        // Если тег существует, просто добавляем его
        handleAddTag(existingTag.id);
        setNewTagName("");
        return;
      }
      // Если тега нет, создаем новый
      createTag(trimmedName);
      setNewTagName("");
    }
  };

  // Фильтруем теги по введенному тексту и исключаем уже выбранные
  const availableTags = tags.filter(tag => {
    const matchesSearch = !newTagName.trim() ||
      tag.name.toLowerCase().includes(newTagName.trim().toLowerCase());
    const notSelected = !selectedTags.some(st => st.id === tag.id);
    return matchesSearch && notSelected;
  });

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {selectedTags.map((tag) => (
        <Badge key={tag.id} variant="secondary" className="gap-1">
          {tag.name}
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => handleRemoveTag(tag.id)}
          />
        </Badge>
      ))}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Новый тег"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <Button size="sm" onClick={handleCreateTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {availableTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    handleAddTag(tag.id);
                    setIsOpen(false);
                  }}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
