// ArchiveConversationDialog.tsx
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {ChatConversation} from "@/types/database";

interface ArchiveConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConversation: ChatConversation | null;
  onArchive: (id: string) => void;
  onMobileViewChange: (view: "list" | "chat") => void;
}

function ArchiveConversationDialog({
  open,
  onOpenChange,
  selectedConversation,
  onArchive,
  onMobileViewChange,
}: ArchiveConversationDialogProps) {
  const handleArchive = () => {
    if (selectedConversation) {
      onArchive(selectedConversation.id);
      onOpenChange(false);
      onMobileViewChange("list");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive this conversation?</DialogTitle>
          <DialogDescription>
            This conversation will be moved to archives. You can still view it later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleArchive}>
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ArchiveConversationDialog;
