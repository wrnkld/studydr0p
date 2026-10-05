import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { StudyType, STUDY_TYPE_META } from "@/lib/types";
import { STUDY_TYPE_ICONS } from "@/lib/studyTypeIcons";
import { cn } from "@/lib/utils";

export const STUDY_TYPES: StudyType[] = ["card_sort", "survey", "tree_test", "first_click"];

export default function NewStudyMenu({ onSelect, compact = false, className, disabled = false }: { onSelect: (type: StudyType) => void; compact?: boolean; className?: string; disabled?: boolean }) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" disabled={disabled} aria-label="New study" title={compact ? "New study" : undefined} className={cn("justify-start", compact && "justify-center px-0", className)}>
        <Plus />{!compact && <><span>New study</span><ChevronDown className="ml-auto" /></>}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      {STUDY_TYPES.map(type => {
        const Icon = STUDY_TYPE_ICONS[type];
        return <DropdownMenuItem key={type} onSelect={() => onSelect(type)}><Icon />{STUDY_TYPE_META[type].label}</DropdownMenuItem>;
      })}
    </DropdownMenuContent>
  </DropdownMenu>;
}