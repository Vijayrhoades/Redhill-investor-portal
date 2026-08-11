import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-md p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-white"
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isDanger ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
              {isDanger ? (
                <Trash2 className="w-7 h-7 text-red-400" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              )}
            </div>

            {/* Content */}
            <h2 className="text-xl font-bold text-white mb-2 font-serif">{title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">{message}</p>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-gray-500 font-medium">
                ⚠️ This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer border border-white/[0.06]"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 font-bold rounded-xl transition-all cursor-pointer shadow-lg ${
                  isDanger
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
