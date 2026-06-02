import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Destructive Action',
  message = 'Are you sure you want to perform this action? This step cannot be undone.',
  confirmText = 'Delete',
  confirmColor = 'rose',
  loading = false,
}) => {
  const colorMap = {
    rose: 'bg-rose-500 hover:bg-rose-600 shadow-rose-950/20 text-white',
    sky: 'bg-sky-500 hover:bg-sky-600 shadow-sky-950/20 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 shadow-amber-950/20 text-white',
  };

  const buttonStyle = colorMap[confirmColor] || colorMap.rose;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Warning Icon & Message */}
        <div className="flex gap-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-sm text-slate-350 leading-relaxed font-medium">
            {message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-800/60 pt-5 mt-6">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-350 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-w-[100px] ${buttonStyle}`}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="border-t-white" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
