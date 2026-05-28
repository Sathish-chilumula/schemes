'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string; // e.g. "Article" or "Category"
};

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'Item',
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Delete {itemType}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 leading-relaxed mb-4">
            Are you sure you want to delete <strong>"{itemName}"</strong>?
          </p>
          <p className="text-rose-600 text-sm font-semibold bg-rose-50 p-3 rounded-lg">
            This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
