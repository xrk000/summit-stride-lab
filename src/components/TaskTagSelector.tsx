import { useState } from "react";
import { X, Plus } from "lucide-react";
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
  const [newTagName, setNewTagName] = useState("");
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
    if (newTagName.trim()) {
      createTag(newTagName.trim());
      setNewTagName("");
    }
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
  const availableTags = tags.filter(tag => !selectedTagIds.includes(tag.id));

  return (
    <div className="space-y-2">
      <Label>Теги</Label>
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
                {availableTags.length > 0 ? (
                  availableTags.map((tag) => (
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
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Нет доступных тегов
                  </p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
