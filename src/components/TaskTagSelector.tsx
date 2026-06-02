import { useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTags } from "@/hooks/useTags";
import { Label } from "@/components/ui/label";

interface TaskTagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export const TaskTagSelector = ({ selectedTagIds, onTagsChange }: TaskTagSelectorProps) => {
  const { tags, createTag } = useTags();
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTag = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  const handleCreateTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    // Если тег с таким именем уже есть — просто выбираем его
    const existing = tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleAddTag(existing.id);
    } else {
      createTag(trimmed);
    }
    setInputValue("");
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  // Теги для показа в дропдауне: не выбранные + фильтр по поиску
  const filteredAvailable = tags.filter(tag =>
    !selectedTagIds.includes(tag.id) &&
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Показываем кнопку "Создать" если введён текст, которого нет среди тегов
  const showCreate = inputValue.trim().length > 0 &&
    !tags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className="space-y-2">
      <Label>Теги</Label>
      <div className="flex flex-wrap gap-2 items-center">
        {selectedTags.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              {/* Поиск / создание */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Поиск или новый тег..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="pl-8 h-8 text-sm"
                  autoFocus
                />
              </div>

              {/* Кнопка создать новый */}
              {showCreate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 border-dashed text-muted-foreground hover:text-foreground"
                  onClick={handleCreateTag}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Создать «{inputValue.trim()}»
                </Button>
              )}

              {/* Список доступных тегов */}
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredAvailable.length > 0 ? (
                  filteredAvailable.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-sm"
                      onClick={() => {
                        handleAddTag(tag.id);
                        setInputValue("");
                        setIsOpen(false);
                      }}
                    >
                      {tag.name}
                    </Button>
                  ))
                ) : !showCreate ? (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    {inputValue ? "Тег не найден" : "Нет доступных тегов"}
                  </p>
                ) : null}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
