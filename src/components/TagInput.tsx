import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTags } from "@/hooks/useTags";

interface TagInputProps {
  entityType: 'task' | 'note' | 'habit' | 'project' | 'calendar_event';
  entityId: string;
  selectedTags: any[];
  onTagsChange?: () => void;
}

export const TagInput = ({ entityType, entityId, selectedTags, onTagsChange }: TagInputProps) => {
  const { tags, createTag, addTagToEntity, removeTagFromEntity } = useTags();
  const [newTagName, setNewTagName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTag = (tagId: string) => {
    addTagToEntity({ entityType, entityId, tagId });
    onTagsChange?.();
  };

  const handleRemoveTag = (tagId: string) => {
    removeTagFromEntity({ entityType, entityId, tagId });
    onTagsChange?.();
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTag(newTagName.trim());
      setNewTagName("");
    }
  };

  const availableTags = tags.filter(
    tag => !selectedTags.some(st => st.id === tag.id)
  );

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
