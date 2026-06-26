import { Modal } from './Modal.jsx';

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  danger = true,
  loading = false,
}) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
    <div className="mt-6 flex justify-end gap-2">
      <button className="btn-secondary" onClick={onClose} disabled={loading}>
        Cancel
      </button>
      <button
        className={danger ? 'btn-danger' : 'btn-primary'}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? 'Working…' : confirmText}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
