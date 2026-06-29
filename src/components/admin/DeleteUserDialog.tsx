import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteAdminUser } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

type DeleteUserDialogProps = {
  userId: string;
  username: string;
  isSuperAdmin?: boolean;
  redirectTo?: string;
  onDeleted?: () => void;
  trigger?: ReactNode;
};

export function DeleteUserDialog({
  userId,
  username,
  isSuperAdmin,
  redirectTo = '/admin/users',
  onDeleted,
  trigger,
}: DeleteUserDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const canDelete = confirmText === username;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAdminUser(userId);
      toast.success(`Deleted user ${username}`);
      setOpen(false);
      onDeleted?.();
      navigate(redirectTo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete User
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {username}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            This permanently deletes the user account, organization, muawineen, income, expenses,
            and summaries. This cannot be undone.
          </p>
          {isSuperAdmin && (
            <p className="text-amber-600 font-medium">
              This user is a super admin. Their admin access will also be removed.
            </p>
          )}
          <p>
            Type <span className="font-mono font-semibold">{username}</span> to confirm:
          </p>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={username}
            disabled={loading}
          />
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !canDelete}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
