import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { withdrawalTypes } from 'src/database/index';
import { CreateAssociateWithdrawalTypeDto } from './dto/create-associate-withdrawal-type.dto';
import { UpdateAssociateWithdrawalTypeDto } from './dto/update-associate-withdrawal-type.dto';

@Injectable()
export class AssociateWithdrawalTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}
  async create(
    createAssociateWithdrawalTypeDto: CreateAssociateWithdrawalTypeDto,
  ) {
    try {
      const [created] = await this.drizzle
        .insert(withdrawalTypes)
        .values({
          ...createAssociateWithdrawalTypeDto,
          administrativeFeePercentage:
            createAssociateWithdrawalTypeDto.administrativeFeePercentage !==
            undefined
              ? String(
                  createAssociateWithdrawalTypeDto.administrativeFeePercentage,
                )
              : undefined,
        })
        .returning();
      return created;
    } catch (error) {
      throw new InternalServerErrorException('Error creating withdrawal type');
    }
  }

  async findAllPaginated() {
    return await this.drizzle.select().from(withdrawalTypes);
  }

  async findAll() {
    const response = await this.drizzle
      .select({
        id: withdrawalTypes.id,
        description: withdrawalTypes.description,
        withdrawalPercentage: withdrawalTypes.withdrawalPercentage,
        administrativeFeePercentage:
          withdrawalTypes.administrativeFeePercentage,
        withdrawalLimitQuantity: withdrawalTypes.withdrawalLimitQuantity,
        minimumAntiquityDays: withdrawalTypes.minimumAntiquityDays,
        isHouseComercial: withdrawalTypes.isHouseComercial,
        isInternalInventory: withdrawalTypes.isInternalInventory,
      })
      .from(withdrawalTypes);

    return response;
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(withdrawalTypes)
      .where(eq(withdrawalTypes.id, id));
    if (!result.length) {
      throw new NotFoundException(`Withdrawal type with ID ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: number,
    updateAssociateWithdrawalTypeDto: UpdateAssociateWithdrawalTypeDto,
  ) {
    const { administrativeFeePercentage, ...rest } =
      updateAssociateWithdrawalTypeDto;
    const [updated] = await this.drizzle
      .update(withdrawalTypes)
      .set({
        ...rest,
        administrativeFeePercentage:
          administrativeFeePercentage !== undefined
            ? String(administrativeFeePercentage)
            : undefined,
      })
      .where(eq(withdrawalTypes.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException(`Withdrawal type with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: number) {
    const [deleted] = await this.drizzle
      .delete(withdrawalTypes)
      .where(eq(withdrawalTypes.id, id))
      .returning();
    if (!deleted) {
      throw new NotFoundException(`Withdrawal type with ID ${id} not found`);
    }
    return { message: 'Withdrawal type deleted successfully' };
  }
}
