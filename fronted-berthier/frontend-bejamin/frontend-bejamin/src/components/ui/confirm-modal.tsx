import { Modal } from './modal';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const variantConfig = {
  danger: { icon: 'text-red-600', bg: 'bg-red-50', button: 'bg-red-600 hover:bg-red-700' },
  warning: { icon: 'text-amber-600', bg: 'bg-amber-50', button: 'bg-amber-600 hover:bg-amber-700' },
  info: { icon: 'text-blue-600', bg: 'bg-blue-50', button: 'bg-blue-600 hover:bg-blue-700' },
};

export function ConfirmModal({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  variant = 'danger', loading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={cn('p-3 rounded-full mb-4', config.bg)}>
          <AlertTriangle className={cn('w-6 h-6', config.icon)} />
        </div>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex items-center gap-3 mt-6 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 border-gray-300 text-gray-700"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn('flex-1 h-10 text-white shadow-sm', config.button)}
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> {confirmLabel}...</>
            ) : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
