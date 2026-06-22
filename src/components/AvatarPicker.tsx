import { AVAILABLE_AVATAR_IDS, getAvatarUrl } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  selectedId: string | null | undefined;
  onSelect: (avatarId: string) => void;
}

export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {AVAILABLE_AVATAR_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            "aspect-square rounded-full overflow-hidden border-2 transition-colors",
            selectedId === id ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-border"
          )}
        >
          <img src={getAvatarUrl(id)} alt={`Аватар ${id}`} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );
}
