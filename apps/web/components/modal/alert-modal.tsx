'use client';
import { Button } from '@repo/shadcn/button';
import { Modal } from '@repo/shadcn/modal';
import { useEffect, useState } from 'react';

interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onConfirm?: () => void;
  loading?: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex w-full items-center justify-end space-x-2 pt-6">
        <Button disabled={loading} variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={loading} variant="destructive" onClick={onConfirm}>
          Continuar
        </Button>
      </div>
    </Modal>
  );
};
