"use client";

import { Modal } from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = "確認",
  message,
  confirmText = "確定",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      actions={
        <>
          <button
            onClick={onCancel}
            className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 active:scale-95 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white active:scale-95 ${
              danger ? "bg-red-500" : "bg-foreground text-background"
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
