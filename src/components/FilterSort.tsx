import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useTags } from "@/hooks/useTags";

interface FilterSortProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  filterBy?: string;
  onFilterChange?: (value: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  sortOptions: { value: string; label: string }[];
  filterOptions?: { value: string; label: string }[];
}

export const FilterSort = ({
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  selectedTags,
  onTagsChange,
  sortOptions,
  filterOptions,
}: FilterSortProps) => {
  const { tags } = useTags();

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.id));

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Сортировка</Label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filterOptions && onFilterChange && (
          <div className="space-y-2">
            <Label>Фильтр</Label>
            <Select value={filterBy} onValueChange={onFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Теги</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag.id)}
            >
              {tag.name}
              {selectedTags.includes(tag.id) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
