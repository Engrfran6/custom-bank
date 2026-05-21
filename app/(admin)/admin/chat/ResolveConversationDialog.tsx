// ResolveConversationDialog.tsx
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

interface ResolveConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConversation: ChatConversation | null;
  onResolve: (id: string) => void;
  onMobileViewChange: (view: "list" | "chat") => void;
}

function ResolveConversationDialog({
  open,
  onOpenChange,
  selectedConversation,
  onResolve,
  onMobileViewChange,
}: ResolveConversationDialogProps) {
  const handleResolve = () => {
    if (selectedConversation) {
      onResolve(selectedConversation.id);
      onOpenChange(false);
      onMobileViewChange("list");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark conversation as resolved?</DialogTitle>
          <DialogDescription>
            This will move the conversation to resolved status. The customer will be notified.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleResolve}>Mark as Resolved</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ResolveConversationDialog;
