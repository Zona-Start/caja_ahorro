import { useState } from 'react';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Edit, MoreHorizontal } from 'lucide-react';
import { TenantSetting } from '../../schemas/tenant-settings.schema';
import { TenantSettingsModal } from '../tenant-settings-modal';

interface TenantSettingsCellActionProps {
  data: TenantSetting;
}

export function TenantSettingsCellAction({ data }: TenantSettingsCellActionProps) {
  const [openEdit, setOpenEdit] = useState(false);

  return (
    <>
      <TenantSettingsModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        defaultValues={data}
        mode="edit"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Valor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}