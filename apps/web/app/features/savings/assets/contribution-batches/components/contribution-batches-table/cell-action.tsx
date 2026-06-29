'use client';

import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Ban, EllipsisVertical, Eye } from 'lucide-react';
import { useState } from 'react';
import { useReverseContributionBatch } from '../../hooks/use-contribution-batches-mutation';
import type { ContributionBatch } from '../../schemas/contribution-batches.schema';
import { ContributionBatchesDetailModal } from '../contribution-batches-detail-modal';

interface CellActionProps {
  data: ContributionBatch;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { mutate: reverseBatch } = useReverseContributionBatch();

  const onConfirmReverse = () => {
    setLoading(true);
    reverseBatch(data.id, {
      onSettled: () => {
        setLoading(false);
        setShowReversalModal(false);
      },
    });
  };

  return (
    <>
      <AlertModal
        isOpen={showReversalModal}
        onClose={() => setShowReversalModal(false)}
        onConfirm={onConfirmReverse}
        loading={loading}
        title="Anular Carga de Haberes"
        description="¿Anular esta carga? Se generará un movimiento de reverso, se revertirá la transacción bancaria y el asiento contable."
      />

      <ContributionBatchesDetailModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        batchId={data.id}
      />

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowDetailsModal(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
          {data.status !== 'reversed' && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowReversalModal(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Anular
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
