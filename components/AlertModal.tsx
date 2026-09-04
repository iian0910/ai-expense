"use client";

import { Modal } from "./Modal";

interface AlertModalProps {
  message: string | null;
  onClose: () => void;
  title?: string;
}

export function AlertModal({ message, onClose, title = "提示" }: AlertModalProps) {
  return (
    <Modal
      open={!!message}
      onClose={onClose}
      title={title}
      actions={
        <button
          onClick={onClose}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background active:scale-95"
        >
          知道了
        </button>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
