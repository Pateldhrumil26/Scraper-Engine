import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { WebsiteSource } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

interface DeleteSourceDialogProps {
  isOpen: boolean;
  source: WebsiteSource | null;
  onClose: () => void;
  onConfirm: (sourceId: string) => Promise<void>;
}

export const DeleteSourceDialog: React.FC<DeleteSourceDialogProps> = ({
  isOpen,
  source,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!source) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(source._id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Website Source" maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-xs text-rose-900 leading-relaxed">
            Are you sure you want to delete <span className="font-semibold">{source.name}</span>?
            This will remove the configuration and its scheduled fetching jobs.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};
