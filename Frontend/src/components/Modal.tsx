import { useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  description,
  maxWidth = 'max-w-md'
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full ${maxWidth} p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold font-serif">{title}</h2>
                {description && <p className="text-gray-400 mt-1 text-sm">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
