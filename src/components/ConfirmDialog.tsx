import { Modal } from './Modal'
import { AlertTriangle, CircleHelp } from 'lucide-react'

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  function handleConfirm() {
    onConfirm()
    onClose()
  }

  const confirmClasses =
    variant === 'danger'
      ? 'rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
      : 'rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2'

  const cancelClasses =
    'rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2'

  const footer = (
    <>
      <button type="button" onClick={onClose} className={cancelClasses}>
        {cancelLabel}
      </button>
      <button type="button" onClick={handleConfirm} className={confirmClasses}>
        {confirmLabel}
      </button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} footer={footer}>
      <div className={`flex gap-3 rounded-xl border p-4 ${variant === 'danger' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
        <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-red-100 text-red-700' : 'bg-navy-50 text-navy'}`}>
          {variant === 'danger' ? <AlertTriangle size={19} aria-hidden="true" /> : <CircleHelp size={19} aria-hidden="true" />}
        </span>
        <div>
          <p className={`text-sm font-semibold ${variant === 'danger' ? 'text-red-900' : 'text-slate-800'}`}>
            {variant === 'danger' ? 'Destructive action' : 'Confirmation required'}
          </p>
          <p className={`mt-1 text-xs ${variant === 'danger' ? 'text-red-800' : 'text-slate-600'}`}>
            Check the details above before you continue.
          </p>
        </div>
      </div>
    </Modal>
  )
}
