import { Modal } from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isDanger?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isDanger = true,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-dangerBg">
            <AlertTriangle size={18} className="text-status-danger" />
          </div>
        </div>
        <p className="text-sm text-ink-600 pt-2">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={isDanger ? 'btn-danger' : 'btn-primary'}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
