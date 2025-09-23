'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Edit, Eye, Trash } from 'lucide-react';
import { useState } from 'react';
import { useDeleteFixedAsset } from '../../hooks/use-mutation-fixed-asset';
import { FixedAsset } from '../../schemas/fixed-asset.schema';
import FixedAssetDetailsModal from '../fixed-asset-details-modal';
import FixedAssetModal from '../fixed-asset-modal';

interface CellActionProps {
  data: FixedAsset;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { mutate: deleteFixedAsset } = useDeleteFixedAsset();

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteFixedAsset(data.id!);
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processedData = {
    ...data,
    acquisitionDate: data.acquisitionDate
      ? new Date(data.acquisitionDate)
      : undefined,
    lastDepreciationDate: data.lastDepreciationDate
      ? new Date(data.lastDepreciationDate)
      : undefined,
    disposalDate: data.disposalDate ? new Date(data.disposalDate) : undefined,
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar este bien o activo?"
        description="Esta acción no se puede deshacer."
      />

      <FixedAssetModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        defaultValues={processedData}
        readOnly={false}
      />

      <FixedAssetDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        asset={data}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowDetailsModal(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowEditModal(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
