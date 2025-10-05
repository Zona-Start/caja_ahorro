import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  purchaseOrderItems,
  purchaseOrders,
  supplierInvoiceItems,
  supplierInvoices,
  suppliers,
} from '@/database/schema/administration';
import { priceTypeEnum } from '@/types/enum';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { differenceInDays } from 'date-fns';
import { and, eq, ilike, inArray, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { AccountsPayableService } from '../accounts-payable/accounts-payable.service';
import { FixedAssetPricesService } from '../inventory/fixed-asset-prices/fixed-asset-prices.service';
import { InventoryMovementsService } from '../inventory/inventory-movements/inventory-movements.service';
import { ProductPricesService } from '../inventory/product-prices/product-prices.service';
import { ServicePricesService } from '../inventory/services-prices/services-prices.service';
import { SupplierTransactionsService } from '../supplier-transactions/supplier-transactions.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { FilterSupplierInvoiceDto } from './dto/filter-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly supplierTransactionsService: SupplierTransactionsService,
    private accountsPayableService: AccountsPayableService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly productPricesService: ProductPricesService,
    private readonly inventoryMovementsService: InventoryMovementsService,
    private readonly fixedAssetPricesService: FixedAssetPricesService,
    private readonly servicePricesService: ServicePricesService,
  ) {}

  /***DDDDDDDDDDDDDDD
   *  Crear una nueva factura de proveedor
   * → Validar el estado
   * → Iniciar una transacción
   * → Insertar la factura
   * → Insertar los artículos
   * → Devolver la factura completa con un mensaje de éxito.
   */

  async create(userId: number, dto: CreateSupplierInvoiceDto) {
    const { status } = dto;

    const supplier = await this.drizzle
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, dto.supplierId));

    if (supplier.length === 0) {
      throw new NotFoundException('Supplier not found');
    }

    if (status !== 'DRAFT' && status !== 'PENDING') {
      throw new BadRequestException(
        `Invalid status for creation: ${status}. Only 'DRAFT' or 'PENDING' are allowed.`,
      );
    }

    return this.drizzle.transaction(async (tx) => {
      const newInvoice = await tx
        .insert(supplierInvoices)
        .values({
          ...dto,
          companyId: dto.companyId ?? Number(supplier[0].companyId),
          status: dto.status,
          subtotal: dto.subtotal.toString(),
          taxAmount: dto.taxAmount?.toString(),
          totalAmount: dto.totalAmount.toString(),
          dueDate: dto.dueDate?.toISOString(),
          invoiceDate: dto.invoiceDate.toISOString(),
          currencyCode: 'VES',
          createdById: userId,
          supplierInvoiceNumber:
            await this.generateCodeService.generateNextReference('FAC-P'),
        })
        .returning({
          status: supplierInvoices.status,
          id: supplierInvoices.id,
        });

      if (dto.items && dto.items.length > 0) {
        const itemsToInsert = dto.items.map((item) => ({
          ...item,
          invoiceId: newInvoice[0].id,
          unitCost: item.unitCost.toString(),
          totalLine: item.totalLine.toString(),
          createdById: userId,
        }));
        await tx.insert(supplierInvoiceItems).values(itemsToInsert as any);
      }

      const [completeInvoice] = await tx
        .select({
          id: supplierInvoices.id,
          supplierId: supplierInvoices.supplierId,
          purchaseOrderId: supplierInvoices.purchaseOrderId,
          invoiceNumber: supplierInvoices.invoiceNumber,
          controlNumber: supplierInvoices.controlNumber,
          invoiceDate: supplierInvoices.invoiceDate,
          dueDate: supplierInvoices.dueDate,
          subtotal: supplierInvoices.subtotal,
          taxAmount: supplierInvoices.taxAmount,
          totalAmount: supplierInvoices.totalAmount,
          paymentType: supplierInvoices.paymentType,
          status: supplierInvoices.status,
          observations: supplierInvoices.observations,
        })
        .from(supplierInvoices)
        .where(eq(supplierInvoices.id, newInvoice[0].id));

      const items = await tx
        .select({
          id: supplierInvoiceItems.id,
          lineType: supplierInvoiceItems.lineType,
          description: supplierInvoiceItems.description,
          quantity: supplierInvoiceItems.quantity,
          unitCost: supplierInvoiceItems.unitCost,
          totalLine: supplierInvoiceItems.totalLine,
          itemId: supplierInvoiceItems.itemId,
          expenseAccountId: supplierInvoiceItems.expenseAccountId,
        })
        .from(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, newInvoice[0].id));

      return {
        data: { ...completeInvoice, items },
        message: 'Supplier invoice created successfully',
      };
    });
  }

  /**
   *   Modificar una factura de proveedor existente
   * → Validar el estado
   * → Iniciar una transacción
   * → Actualizar la factura
   * → Eliminar y reinsertar los artículos
   * → Devolver la factura actualizada.
   */

  async update(
    invoiceId: number,
    userId: number,
    dto: UpdateSupplierInvoiceDto,
  ) {
    return this.drizzle.transaction(async (tx) => {
      // Step 1: Check the current status of the invoice to ensure it can be updated.
      // This prevents modifications to invoices that are no longer in a draft state.
      const [currentInvoice] = await tx
        .select({ status: supplierInvoices.status })
        .from(supplierInvoices)
        .where(eq(supplierInvoices.id, invoiceId));

      if (
        !currentInvoice ||
        (currentInvoice.status !== 'DRAFT' &&
          currentInvoice.status !== 'PENDING')
      ) {
        throw new BadRequestException(
          `Cannot update invoice. Current status is '${currentInvoice.status}', only 'DRAFT' and 'PENDING' can be modified.`,
        );
      }

      // Step 2: Update the main invoice record.
      await tx
        .update(supplierInvoices)
        .set({
          ...dto,
          status: dto.status,
          subtotal: dto.subtotal?.toString(),
          taxAmount: dto.taxAmount?.toString(),
          totalAmount: dto.totalAmount?.toString(),
          dueDate: dto.dueDate?.toISOString(),
          invoiceDate: dto.invoiceDate?.toISOString(),
          updatedById: userId,
        })
        .where(eq(supplierInvoices.id, invoiceId));

      // Step 3: Delete existing invoice items and re-insert the new ones.
      // This is a common and safer approach than complex item-by-item diffing.
      await tx
        .delete(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

      if (dto.items && dto.items.length > 0) {
        const itemsToInsert = dto.items.map((item) => ({
          ...item,
          invoiceId: invoiceId,
          unitCost: item.unitCost?.toString(),
          totalLine: item.totalLine?.toString(),
          createdById: userId,
        }));
        await tx.insert(supplierInvoiceItems).values(itemsToInsert as any);
      }

      // Step 4: Fetch and return the complete updated invoice with its items.
      const [completeInvoice] = await tx
        .select({
          id: supplierInvoices.id,
          supplierId: supplierInvoices.supplierId,
          purchaseOrderId: supplierInvoices.purchaseOrderId,
          invoiceNumber: supplierInvoices.invoiceNumber,
          controlNumber: supplierInvoices.controlNumber,
          invoiceDate: supplierInvoices.invoiceDate,
          dueDate: supplierInvoices.dueDate,
          subtotal: supplierInvoices.subtotal,
          taxAmount: supplierInvoices.taxAmount,
          totalAmount: supplierInvoices.totalAmount,
          paymentType: supplierInvoices.paymentType,
          status: supplierInvoices.status,
          observations: supplierInvoices.observations,
        })
        .from(supplierInvoices)
        .where(eq(supplierInvoices.id, invoiceId));

      const items = await tx
        .select({
          id: supplierInvoiceItems.id,
          lineType: supplierInvoiceItems.lineType,
          description: supplierInvoiceItems.description,
          quantity: supplierInvoiceItems.quantity,
          unitCost: supplierInvoiceItems.unitCost,
          totalLine: supplierInvoiceItems.totalLine,
          itemId: supplierInvoiceItems.itemId,
          expenseAccountId: supplierInvoiceItems.expenseAccountId,
        })
        .from(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

      return {
        data: { ...completeInvoice, items },
        message: 'Supplier invoice updated successfully',
      };
    });
  }

  /**
   * Esta función está diseñada para cambiar el estado de una factura y realizar los procesos de contabilidad relacionados.
   * @param userId
   * @param id
   * @param dto
   * @returns
   */
  async accountFor(userId: number, id: number, dto: UpdateSupplierInvoiceDto) {
    return this.drizzle.transaction(async (tx) => {
      const existingInvoice = await tx
        .select()
        .from(supplierInvoices)
        .where(eq(supplierInvoices.id, id))
        .leftJoin(
          supplierInvoiceItems,
          eq(supplierInvoices.id, supplierInvoiceItems.invoiceId),
        );

      if (existingInvoice.length === 0) {
        throw new NotFoundException('Supplier invoice not found');
      }

      const originalStatus = existingInvoice[0].supplier_invoices.status;
      const newStatus = dto.status;

      // --- Logic for PENDING invoices ---
      if (originalStatus === 'PENDING') {
        if (newStatus === 'ACCOUNTED_FOR') {
          const fullDto = {
            ...existingInvoice,
            ...dto,
          } as CreateSupplierInvoiceDto;
          return this.accountForInvoice(userId, id, fullDto, tx);
        }
        throw new BadRequestException(
          `Cannot update PENDING invoice to status '${newStatus}'. Only 'ACCOUNTED_FOR' is allowed.`,
        );
      }

      throw new BadRequestException(
        `Cannot update invoice with status '${originalStatus}'.`,
      );
    });
  }

  private async accountForInvoice(
    userId: number,
    invoiceId: number,
    dto: CreateSupplierInvoiceDto,
    tx: NodePgDatabase<typeof schema>,
  ) {
    // 1. Validations

    const supplier = await tx
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, dto.supplierId), eq(suppliers.status, 'ACTIVE')),
      );

    if (supplier.length === 0) {
      throw new BadRequestException(
        'Supplier is not active or does not exist.',
      );
    }

    const existingInvoice = await tx
      .select()
      .from(supplierInvoices)
      .where(
        and(
          eq(supplierInvoices.invoiceNumber, dto.invoiceNumber),
          eq(supplierInvoices.supplierId, dto.supplierId),
          ne(supplierInvoices.id, invoiceId),
        ),
      );

    if (existingInvoice.length !== 0) {
      throw new ConflictException(
        'An invoice with this number and supplier already exists.',
      );
    }

    if (dto.totalAmount <= 0) {
      throw new BadRequestException('Total amount must be greater than 0.');
    }

    // 2. Purchase Order Logic
    if (dto.purchaseOrderId) {
      await this.updatePurchaseOrderStatus(dto.purchaseOrderId, invoiceId, tx);
    }

    // 4. Check if PO can be closed after payment
    if (dto.purchaseOrderId) {
      await this.checkAndClosePurchaseOrder(dto.purchaseOrderId, tx);
    }

    // 5. Process Invoice Items for Inventory and Pricing
    const invoiceItems = await tx
      .select()
      .from(supplierInvoiceItems)
      .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

    for (const item of invoiceItems) {
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);

      if (item.lineType === 'SALES_INVENTORY') {
        // Update product price
        const resultProduct = await this.productPricesService.create(
          {
            productId: item?.itemId ?? 0,
            suppliersId: dto.supplierId,
            priceType: 'SELLING' as priceTypeEnum,
            baseCost: unitCost,
            otherCosts: 0,
            isActive: true,
            supplierInvoiceId: invoiceId,
          },
          userId,
          tx,
        );

        // Generate inventory movement (income)
        await this.inventoryMovementsService.create(
          userId,
          {
            movementType: 'IN',
            description: `INGRESO PRODUCTO POR FACTURA DE PROVEEDOR ${dto.invoiceNumber}`,
            documentType: 'COMPRA',
            documentNumber: dto.invoiceNumber,
            supplierInvoiceId: invoiceId,
            items: [
              {
                itemId: item.itemId ?? 0,
                itemType: 'PRODUCT',
                quantity: quantity,
                unitCost: Number(resultProduct.data.totalCost),
              },
            ],
          },
          tx,
        );
      } else if (item.lineType === 'FIXED_ASSET') {
        // Update fixed asset price
        const resultFixedAsset = await this.fixedAssetPricesService.create(
          userId,
          {
            fixedAssetsId: item.itemId ?? 0,
            baseCost: unitCost,
            otherCosts: 0, // Assuming 0 for now, can be added to DTO later
            purchaseTax: 0, // Assuming 0 for now, can be added to DTO later
            startDate: dto.invoiceDate,
            supplierInvoiceId: invoiceId,
            isActive: true,
          },
          tx,
        );

        // Generate inventory movement (income)
        await this.inventoryMovementsService.create(
          userId,
          {
            movementType: 'IN',
            description: `INGRESO ACTIVO POR FACTURA PROVEEDOR ${dto.invoiceNumber}`,
            documentType: 'COMPRA',
            documentNumber: dto.invoiceNumber,
            supplierInvoiceId: invoiceId,
            items: [
              {
                itemId: item.itemId ?? 0,
                itemType: 'FIXED_ASSET',
                quantity: quantity,
                unitCost: Number(resultFixedAsset.data.totalCost),
              },
            ],
          },
          tx,
        );
      } else if (item.lineType === 'SERVICE') {
        // Update service price
        await this.servicePricesService.create(
          userId,
          {
            serviceId: item.itemId ?? 0,
            baseCost: unitCost,
            otherCosts: 0,
            purchaseTax: 0,
            startDate: dto.invoiceDate,
            isActive: true,
            supplierInvoiceId: invoiceId,
          },
          tx,
        );
        // No inventory movement for services
      }
    }

    // 6. Finalize invoice status

    const finalStatus = 'ACCOUNTED_FOR';

    await tx
      .update(supplierInvoices)
      .set({ status: finalStatus, updatedById: userId })
      .where(eq(supplierInvoices.id, invoiceId));

    const finalInvoice = await tx
      .select({
        id: supplierInvoices.id,
        supplierId: supplierInvoices.supplierId,
        purchaseOrderId: supplierInvoices.purchaseOrderId,
        invoiceNumber: supplierInvoices.invoiceNumber,
        controlNumber: supplierInvoices.controlNumber,
        invoiceDate: supplierInvoices.invoiceDate,
        dueDate: supplierInvoices.dueDate,
        subtotal: supplierInvoices.subtotal,
        taxAmount: supplierInvoices.taxAmount,
        totalAmount: supplierInvoices.totalAmount,
        paymentType: supplierInvoices.paymentType,
        status: supplierInvoices.status,
        observations: supplierInvoices.observations,
        supplierInvoiceNumber: supplierInvoices.supplierInvoiceNumber,
      })
      .from(supplierInvoices)
      .where(eq(supplierInvoices.id, invoiceId));

    const items = await tx
      .select({
        id: supplierInvoiceItems.id,
        lineType: supplierInvoiceItems.lineType,
        description: supplierInvoiceItems.description,
        quantity: supplierInvoiceItems.quantity,
        unitCost: supplierInvoiceItems.unitCost,
        totalLine: supplierInvoiceItems.totalLine,
        itemId: supplierInvoiceItems.itemId,
        expenseAccountId: supplierInvoiceItems.expenseAccountId,
      })
      .from(supplierInvoiceItems)
      .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

    // . Payment and Accounts Payable Logic
    await this.handlePaymentAndAccountsPayable(
      userId,
      invoiceId,
      finalInvoice[0].supplierInvoiceNumber,
      dto,
      tx,
    );

    return { ...finalInvoice[0], items };
  }

  private async updatePurchaseOrderStatus(
    purchaseOrderId: number,
    invoiceId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    // 1. Obtener los ítems de la Orden de Compra (PO)
    const poItems = await tx
      .select({
        id: purchaseOrderItems.id,
        itemId: purchaseOrderItems.itemId,
        quantity: purchaseOrderItems.quantity,
        lineType: purchaseOrderItems.lineType,
        description: purchaseOrderItems.description,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

    if (poItems.length === 0) {
      throw new NotFoundException('Purchase Order not found or has no items.');
    }

    // 2. Obtener todos los ítems de las facturas relacionadas, excluyendo la actual
    const invoicedItems = await tx
      .select({
        id: supplierInvoiceItems.id,
        itemId: supplierInvoiceItems.itemId,
        quantity: supplierInvoiceItems.quantity,
        lineType: supplierInvoiceItems.lineType,
        description: supplierInvoiceItems.description,
      })
      .from(supplierInvoiceItems)
      .leftJoin(
        supplierInvoices,
        eq(supplierInvoiceItems.invoiceId, supplierInvoices.id),
      )
      .where(
        and(
          eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
          ne(supplierInvoices.status, 'CANCELLED'),
          ne(supplierInvoices.id, invoiceId),
        ),
      );

    // 3. Obtener los ítems de la factura actual
    const currentInvoiceItems = await tx
      .select({
        id: supplierInvoiceItems.id,
        itemId: supplierInvoiceItems.itemId,
        quantity: supplierInvoiceItems.quantity,
        lineType: supplierInvoiceItems.lineType,
        description: supplierInvoiceItems.description,
      })
      .from(supplierInvoiceItems)
      .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

    // 4. Calcular la cantidad total facturada por ítem (usando clave compuesta)
    const totalInvoicedPerItem = new Map<string, number>();

    // **Función para generar la clave única, con la validación mejorada**
    const getUniqueKey = (item: {
      itemId: number | null;
      lineType: string;
      description: string | null;
    }): string => {
      if (item.lineType === 'EXPENSE') {
        if (!item.description) {
          throw new BadRequestException(
            'Expense item is missing a description.',
          );
        }
        return `${item.lineType}-${item.description.trim()}`;
      }

      // Validación para tipos que requieren itemId
      if (item.itemId === null || item.itemId === undefined) {
        throw new BadRequestException(
          `Item with lineType '${item.lineType}' is missing a valid itemId.`,
        );
      }

      return `${item.lineType}-${item.itemId}`;
    };

    // Sumar cantidades de facturas anteriores
    for (const item of invoicedItems) {
      const key = getUniqueKey(item);
      const currentQty = totalInvoicedPerItem.get(key) || 0;
      totalInvoicedPerItem.set(key, currentQty + item.quantity);
    }

    // Sumar cantidades de la factura actual
    for (const item of currentInvoiceItems) {
      const key = getUniqueKey(item);
      const currentQty = totalInvoicedPerItem.get(key) || 0;
      totalInvoicedPerItem.set(key, currentQty + item.quantity);
    }

    // 5. Comparar las cantidades facturadas con las de la PO
    let isFullyInvoiced = true;
    for (const poItem of poItems) {
      const key = getUniqueKey({
        itemId: poItem.itemId,
        lineType: poItem.lineType,
        description: poItem.description,
      });

      const invoicedQty = totalInvoicedPerItem.get(key) || 0;

      if (invoicedQty > poItem.quantity) {
        throw new BadRequestException(`Item is being over-invoiced.`);
      }

      if (invoicedQty < poItem.quantity) {
        isFullyInvoiced = false;
      }
    }

    // 6. Actualizar el estado de la Orden de Compra
    const newStatus = isFullyInvoiced ? 'INVOICED' : 'RECEIVED';

    await tx
      .update(purchaseOrders)
      .set({ status: newStatus })
      .where(eq(purchaseOrders.id, purchaseOrderId));
  }

  private async applyCreditNote(
    cxpId: number,
    amountToApply: number,
    userId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const [creditNoteCxp] = await tx
      .select()
      .from(schema.accountsPayable)
      .where(eq(schema.accountsPayable.id, cxpId));

    if (!creditNoteCxp) {
      throw new NotFoundException(
        `Credit note with CXP ID ${cxpId} not found.`,
      );
    }

    if (Number(creditNoteCxp.remainingAmount) >= 0) {
      throw new BadRequestException(
        `CXP ID ${cxpId} is not a valid, open credit note.`,
      );
    }

    const availableCredit = Math.abs(Number(creditNoteCxp.remainingAmount));

    if (amountToApply > availableCredit) {
      throw new BadRequestException(
        `Amount to apply (${amountToApply}) exceeds the available credit (${availableCredit}) for CXP ID ${cxpId}.`,
      );
    }

    const newRemainingAmount =
      Number(creditNoteCxp.remainingAmount) + amountToApply;
    const newPaidAmount = creditNoteCxp.paidAmount; // dejar tal cual
    const newStatus = newRemainingAmount >= 0 ? 'PAID' : 'PENDING';

    await tx
      .update(schema.accountsPayable)
      .set({
        remainingAmount: newRemainingAmount.toString(),
        paidAmount: newPaidAmount.toString(),
        status: newStatus,
        updatedById: userId,
      })
      .where(eq(schema.accountsPayable.id, cxpId));
  }

  private isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    const now = new Date();
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return differenceInDays(date, now) < 0;
  }

  private async handlePaymentAndAccountsPayable(
    userId: number,
    invoiceId: number,
    invoiceReference: string,
    dto: CreateSupplierInvoiceDto,
    tx: NodePgDatabase<typeof schema>,
  ) {
    let remainingAmount = dto.totalAmount;
    let paidAmount = 0;

    const invoiceAP = await this.accountsPayableService.create(
      userId,
      {
        supplierId: dto.supplierId,
        companyId: dto.companyId,
        supplierInvoiceId: invoiceId,
        originalAmount: dto.totalAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        currencyCode: 'VES',
        status: remainingAmount <= 0 ? 'PAID' : 'PENDING',
        dueDate: dto.dueDate || new Date(),
        priority: this.isOverdue(
          dto.dueDate // 1. Verifica si existe dto.dueDate
            ? dto.dueDate.toDateString() // 2. SI existe, llama al método y pasa el string
            : null, // 3. SI NO existe, pasa null
        )
          ? 'HIGH'
          : 'NORMAL',
        observations: `CUENTA POR PAGAR POR FACTURA N° ${invoiceReference}`,
      },
      tx,
    );

    return invoiceAP;
  }

  private async checkAndClosePurchaseOrder(
    purchaseOrderId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const po = await tx.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, purchaseOrderId),
    });

    if (po?.status !== 'INVOICED') {
      return;
    }

    const relatedInvoices = await tx
      .select()
      .from(supplierInvoices)
      .where(eq(supplierInvoices.purchaseOrderId, purchaseOrderId));

    const allPaid = relatedInvoices.every(
      (invoice) => invoice.status === 'PAID',
    );

    if (allPaid) {
      await tx
        .update(purchaseOrders)
        .set({ status: 'CLOSED' })
        .where(eq(purchaseOrders.id, purchaseOrderId));
    }
  }

  async findAll(paginationDto: FilterSupplierInvoiceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierId,
      status,
      startDate,
      endDate,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(
        ilike(supplierInvoices.supplierInvoiceNumber, `%${search}%`),
      );
    }
    if (supplierId) {
      searchConditions.push(eq(supplierInvoices.supplierId, supplierId));
    }
    if (status) {
      searchConditions.push(eq(supplierInvoices.status, status as any));
    }
    if (startDate) {
      searchConditions.push(
        sql`${supplierInvoices.invoiceDate} >= ${startDate}`,
      );
    }
    if (endDate) {
      searchConditions.push(sql`${supplierInvoices.invoiceDate} <= ${endDate}`);
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${supplierInvoices[sortBy as keyof typeof supplierInvoices]} asc`
        : sql`${supplierInvoices[sortBy as keyof typeof supplierInvoices]} desc`;

    // Paso 1: Obtener el conteo total de facturas
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(supplierInvoices)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Paso 2: Obtener solo las facturas (sin ítems) con paginación
    const invoices = await this.drizzle
      .select({
        invoice: supplierInvoices,
        supplierName: suppliers.name,
        purchaseOrdersNumber: purchaseOrders.orderNumber,
      })
      .from(supplierInvoices)
      .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(
        schema.purchaseOrders,
        eq(supplierInvoices.purchaseOrderId, schema.purchaseOrders.id),
      )
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    const invoiceIds = invoices.map((row) => row.invoice.id);

    // Si no hay facturas, devolvemos un array vacío para los ítems
    if (invoiceIds.length === 0) {
      return {
        data: [],
        meta: {
          page: Number(page),
          limit: Number(limit),
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    }

    // Paso 3: Obtener todos los ítems de las facturas seleccionadas
    const allItems = await this.drizzle
      .select()
      .from(supplierInvoiceItems)
      .where(sql`${supplierInvoiceItems.invoiceId} IN ${invoiceIds}`);

    // Paso 4: Agrupar los ítems a cada factura en el código
    const data = invoices.map((invoiceRow) => {
      // Declaramos explícitamente el tipo de 'invoice' para evitar el error
      const invoice = {
        id: invoiceRow.invoice.id,
        supplierInvoiceNumber: invoiceRow.invoice.supplierInvoiceNumber,
        supplierId: invoiceRow.invoice.supplierId,
        supplierName: invoiceRow.supplierName,
        purchaseOrderId: invoiceRow.invoice.purchaseOrderId,
        purchaseOrdersNumber: invoiceRow.purchaseOrdersNumber,
        invoiceNumber: invoiceRow.invoice.invoiceNumber,
        controlNumber: invoiceRow.invoice.controlNumber,
        invoiceDate: invoiceRow.invoice.invoiceDate,
        dueDate: invoiceRow.invoice.dueDate,
        subtotal: Number(invoiceRow.invoice.subtotal),
        taxAmount: Number(invoiceRow.invoice.taxAmount),
        totalAmount: Number(invoiceRow.invoice.totalAmount),
        paymentType: invoiceRow.invoice.paymentType,
        status: invoiceRow.invoice.status,
        observations: invoiceRow.invoice.observations,
        items: [] as any[], // Inicializamos el array de ítems aquí
      };

      const invoiceItems = allItems.filter(
        (item) => item.invoiceId === invoice.id,
      );

      // Mapea y convierte los ítems al formato correcto
      invoice.items = invoiceItems.map((item) => ({
        id: item.id,
        lineType: item.lineType,
        description: item.description,
        itemId: item.itemId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalLine: Number(item.totalLine),
        expenseAccountId: item.expenseAccountId,
      }));

      return invoice;
    });

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.supplierInvoices.findFirst({
      where: eq(supplierInvoices.id, id),
      with: {
        supplier: true,
        items: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Supplier invoice not found');
    }

    return data;
  }

  async remove(id: number) {
    return this.drizzle.transaction(async (tx) => {
      const invoice = await tx.query.supplierInvoices.findFirst({
        where: eq(supplierInvoices.id, id),
      });
      if (!invoice) {
        throw new NotFoundException('Supplier invoice not found');
      }
      if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
        throw new BadRequestException(
          'Cannot cancel an invoice that has been accounted for.',
        );
      }

      const accountsPayableRecord = await tx
        .select()
        .from(schema.accountsPayable)
        .where(eq(schema.accountsPayable.supplierInvoiceId, id));

      const accountsPayableId = accountsPayableRecord.length
        ? accountsPayableRecord[0].id
        : null;

      // 1. Validate for associated payments
      const associatedPayments = await tx
        .select()
        .from(schema.supplierPayments)
        .leftJoin(
          schema.supplierPaymentLines,
          eq(
            schema.supplierPayments.id,
            schema.supplierPaymentLines.supplierPaymentId,
          ),
        )
        .leftJoin(
          schema.accountsPayable,
          eq(
            schema.supplierPaymentLines.accountsPayableId,
            schema.accountsPayable.id,
          ),
        )
        .where(
          and(
            eq(schema.accountsPayable.supplierInvoiceId, id),
            ne(schema.supplierPayments.status, 'CANCELLED'), // Consider only non-cancelled payments
          ),
        );

      if (associatedPayments.length > 0) {
        throw new BadRequestException(
          'Cannot cancel invoice: associated payments exist.',
        );
      }

      // 1. Validate for associated credit notes (supplierTransactions)
      const appliedCreditNotes = await tx
        .select()
        .from(schema.supplierTransactionApplications)
        .leftJoin(
          schema.supplierTransactions,
          eq(
            schema.supplierTransactions.id,
            schema.supplierTransactionApplications.transactionId,
          ),
        )
        .where(
          and(
            eq(
              schema.supplierTransactionApplications.accountsPayableId,
              accountsPayableId ?? 0,
            ),
            eq(schema.supplierTransactions.transactionType, 'CREDIT_NOTE'),
            eq(schema.supplierTransactions.status, 'ACTIVE'),
          ),
        );

      if (appliedCreditNotes.length > 0) {
        throw new BadRequestException(
          'Cannot cancel invoice: associated credit notes exist.',
        );
      }

      // 2. Update Invoice Status to CANCELLED
      await tx
        .update(supplierInvoices)
        .set({ status: 'CANCELLED' })
        .where(eq(supplierInvoices.id, id));

      // 3. Update Accounts Payable
      const [accountsPayableToUpdate] = await tx
        .select()
        .from(schema.accountsPayable)
        .where(eq(schema.accountsPayable.supplierInvoiceId, id));

      if (accountsPayableToUpdate) {
        await tx
          .update(schema.accountsPayable)
          .set({ status: 'CANCELLED', remainingAmount: '0.00' })
          .where(eq(schema.accountsPayable.id, accountsPayableToUpdate.id));
      }

      // 4. Update Purchase Order (if associated) /// revisar por si se debe activae
      // if (invoice.purchaseOrderId) {
      //   await this.updatePurchaseOrderStatusOnCancel(
      //     invoice.purchaseOrderId,
      //     id,
      //     tx,
      //   );
      // }

      if (invoice.purchaseOrderId) {
        await this.drizzle
          .update(purchaseOrders)
          .set({ status: 'PENDING' })
          .where(eq(purchaseOrders.id, invoice.purchaseOrderId));
      }

      // TODO: Aquí se anexará el reverso del movimiento de inventario y precio de item

      return { message: 'Supplier invoice cancelled successfully' };
    });
  }

  // New helper method for updating purchase order status on invoice cancellation
  // private async updatePurchaseOrderStatusOnCancel(
  //   purchaseOrderId: number,
  //   cancelledInvoiceId: number,
  //   tx: NodePgDatabase<typeof schema>,
  // ) {
  //   // Get all items from the purchase order
  //   const poItems = await tx
  //     .select({
  //       id: purchaseOrderItems.id,
  //       itemId: purchaseOrderItems.itemId,
  //       quantity: purchaseOrderItems.quantity,
  //       lineType: purchaseOrderItems.lineType,
  //       description: purchaseOrderItems.description,
  //     })
  //     .from(purchaseOrderItems)
  //     .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

  //   if (poItems.length === 0) {
  //     // No items in PO, nothing to do or throw error if PO should always have items
  //     return;
  //   }

  //   // Get all *other* non-cancelled invoices related to this PO
  //   const otherInvoices = await tx
  //     .select({
  //       id: supplierInvoices.id,
  //       status: supplierInvoices.status,
  //     })
  //     .from(supplierInvoices)
  //     .where(
  //       and(
  //         eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
  //         ne(supplierInvoices.id, cancelledInvoiceId), // Exclude the cancelled invoice
  //         ne(supplierInvoices.status, 'CANCELLED'), // Exclude other cancelled invoices
  //       ),
  //     );

  //   const otherInvoiceIds = otherInvoices.map((inv) => inv.id);

  //   let totalInvoicedPerItem = new Map<string, number>();

  //   // Helper to get unique key for item
  //   const getUniqueKey = (item: {
  //     itemId: number | null;
  //     lineType: string;
  //     description: string | null;
  //   }): string => {
  //     if (item.lineType === 'EXPENSE') {
  //       if (!item.description) {
  //         throw new BadRequestException(
  //           'Expense item is missing a description.',
  //         );
  //       }
  //       return `${item.lineType}-${item.description.trim()}`;
  //     }

  //     if (item.itemId === null || item.itemId === undefined) {
  //       throw new BadRequestException(
  //         `Item with lineType '${item.lineType}' is missing a valid itemId.`,
  //       );
  //     }

  //     return `${item.lineType}-${item.itemId}`;
  //   };

  //   if (otherInvoiceIds.length > 0) {
  //     // Get items from other non-cancelled invoices
  //     const itemsFromOtherInvoices = await tx
  //       .select({
  //         itemId: supplierInvoiceItems.itemId,
  //         quantity: supplierInvoiceItems.quantity,
  //         lineType: supplierInvoiceItems.lineType,
  //         description: supplierInvoiceItems.description,
  //       })
  //       .from(supplierInvoiceItems)
  //       .where(sql`${supplierInvoiceItems.invoiceId} IN ${otherInvoiceIds}`);

  //     for (const item of itemsFromOtherInvoices) {
  //       const key = getUniqueKey(item);
  //       const currentQty = totalInvoicedPerItem.get(key) || 0;
  //       totalInvoicedPerItem.set(key, currentQty + item.quantity);
  //     }
  //   }

  //   let isFullyCoveredByOtherInvoices = true;
  //   for (const poItem of poItems) {
  //     const key = getUniqueKey({
  //       itemId: poItem.itemId,
  //       lineType: poItem.lineType,
  //       description: poItem.description,
  //     });

  //     const invoicedQty = totalInvoicedPerItem.get(key) || 0;

  //     if (invoicedQty < poItem.quantity) {
  //       isFullyCoveredByOtherInvoices = false;
  //       break; // Found an item not fully covered
  //     }
  //   }

  //   const newPoStatus = isFullyCoveredByOtherInvoices ? 'RECEIVED' : 'PENDING';

  //   await tx
  //     .update(purchaseOrders)
  //     .set({ status: newPoStatus })
  //     .where(eq(purchaseOrders.id, purchaseOrderId));
  // }

  async findDraftPendiend() {
    const rawData = await this.drizzle
      .select({
        invoice: supplierInvoices,
        supplierName: suppliers.name,
        items: supplierInvoiceItems,
      })
      .from(supplierInvoices)
      .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(
        supplierInvoiceItems,
        eq(supplierInvoices.id, supplierInvoiceItems.invoiceId),
      )
      .where(
        or(
          eq(supplierInvoices.status, 'DRAFT'),
          eq(supplierInvoices.status, 'PENDING'),
        ),
      );

    // 3. Agrupa los ítems por orden en el código
    const groupedData = new Map<number, any>();

    rawData.forEach((row) => {
      if (!groupedData.has(row.invoice.id)) {
        // Mapea la orden y convierte los strings a numbers según tu esquema Zod

        const invoice = {
          id: row.invoice.id,
          supplierInvoiceNumber: row.invoice.supplierInvoiceNumber,
          supplierId: row.invoice.supplierId,
          supplierName: row.supplierName,
          purchaseOrderId: row.invoice.purchaseOrderId,
          invoiceNumber: row.invoice.invoiceNumber,
          controlNumber: row.invoice.controlNumber,
          invoiceDate: row.invoice.invoiceDate,
          dueDate: row.invoice.dueDate,
          subtotal: Number(row.invoice.subtotal),
          taxAmount: Number(row.invoice.taxAmount),
          totalAmount: Number(row.invoice.totalAmount),
          paymentType: row.invoice.paymentType,
          status: row.invoice.status,
          observations: row.invoice.observations,
          items: [],
        };
        groupedData.set(row.invoice.id, invoice);
      }

      // Mapea y convierte el ítem si existe
      if (row.items) {
        const item = {
          id: row.items.id,
          lineType: row.items.lineType,
          description: row.items.description,
          itemId: row.items.itemId,
          quantity: Number(row.items.quantity),
          unitCost: Number(row.items.unitCost),
          totalLine: Number(row.items.totalLine),
          expenseAccountId: row.items.expenseAccountId,
        };
        groupedData.get(row.invoice.id).items.push(item);
      }
    });

    const data = Array.from(groupedData.values());

    return data;
  }

  async updateStatusToPaid(id: number, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.drizzle;
    const supplierInvoice = await db
      .select()
      .from(supplierInvoices)
      .where(eq(schema.supplierInvoices.id, id));

    if (supplierInvoice.length === 0) {
      throw new NotFoundException(`Supplier Invoice with ID ${id} not found`);
    }

    // Only allow closing if it's not already closed or cancelled
    if (supplierInvoice[0].status !== 'ACCOUNTED_FOR') {
      throw new BadRequestException(
        `Supplier Invoice ${id} cannot be paid from its current status: ${supplierInvoice[0].status}`,
      );
    }

    const [updatedSupplierinvoice] = await db
      .update(schema.supplierInvoices)
      .set({ status: 'PAID' })
      .where(eq(schema.supplierInvoices.id, id))
      .returning();
    if (supplierInvoice[0].purchaseOrderId) {
      await this.checkAndClosePurchaseOrder(
        supplierInvoice[0].purchaseOrderId,
        db,
      );
    }

    return updatedSupplierinvoice;
  }

  // Helper method (copied and adapted from supplier-invoices.service.ts)
  async updatePurchaseOrderStatusOnCancel(
    purchaseOrderId: number,
    cancelledInvoiceId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    // Get all items from the purchase order
    const poItems = await tx
      .select({
        id: purchaseOrderItems.id,
        itemId: purchaseOrderItems.itemId,
        quantity: purchaseOrderItems.quantity,
        lineType: purchaseOrderItems.lineType,
        description: purchaseOrderItems.description,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

    if (poItems.length === 0) {
      return;
    }

    // Get all other non-cancelled invoices related to this PO
    const otherInvoices = await tx
      .select({
        id: supplierInvoices.id,
        status: supplierInvoices.status,
      })
      .from(supplierInvoices)
      .where(
        and(
          eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
          ne(supplierInvoices.id, cancelledInvoiceId), // Exclude the cancelled invoice
          ne(supplierInvoices.status, 'CANCELLED'), // Exclude other cancelled invoices
        ),
      );

    const otherInvoiceIds = otherInvoices.map((inv) => inv.id);

    let totalInvoicedPerItem = new Map<string, number>();

    // Helper to get unique key for item
    const getUniqueKey = (item: {
      itemId: number | null;
      lineType: string;
      description: string | null;
    }): string => {
      if (item.lineType === 'EXPENSE') {
        if (!item.description) {
          throw new BadRequestException(
            'Expense item is missing a description.',
          );
        }
        return `${item.lineType}-${item.description.trim()}`; // Corregido
      }

      if (item.itemId === null || item.itemId === undefined) {
        throw new BadRequestException(
          `Item with lineType '${item.lineType}' is missing a valid itemId.`,
        );
      }

      return `${item.lineType}-${item.itemId}`; // Corregido
    };

    if (otherInvoiceIds.length > 0) {
      // Get items from other non-cancelled invoices
      const itemsFromOtherInvoices = await tx
        .select({
          itemId: supplierInvoiceItems.itemId,
          quantity: supplierInvoiceItems.quantity,
          lineType: supplierInvoiceItems.lineType,
          description: supplierInvoiceItems.description,
        })
        .from(supplierInvoiceItems)
        .where(inArray(supplierInvoiceItems.invoiceId, otherInvoiceIds)); // Corregido

      for (const item of itemsFromOtherInvoices) {
        const key = getUniqueKey(item);
        const currentQty = totalInvoicedPerItem.get(key) || 0;
        totalInvoicedPerItem.set(key, currentQty + item.quantity);
      }
    }

    let isFullyCoveredByOtherInvoices = true;
    for (const poItem of poItems) {
      const key = getUniqueKey({
        itemId: poItem.itemId,
        lineType: poItem.lineType,
        description: poItem.description,
      });

      const invoicedQty = totalInvoicedPerItem.get(key) || 0;

      if (invoicedQty < poItem.quantity) {
        isFullyCoveredByOtherInvoices = false;
        break; // Found an item not fully covered
      }
    }

    const newPoStatus = isFullyCoveredByOtherInvoices ? 'RECEIVED' : 'PENDING';

    await tx
      .update(purchaseOrders)
      .set({ status: newPoStatus })
      .where(eq(purchaseOrders.id, purchaseOrderId));
  }
}
