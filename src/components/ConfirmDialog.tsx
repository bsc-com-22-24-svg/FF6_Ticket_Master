import { Modal } from './Modal'

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
      ? 'rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
      : 'rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-navy'

  const cancelClasses =
    'rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400'

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
    <Modal open={open} onClose={onClose} title={title} description={description} footer={footer} />
  )
}
