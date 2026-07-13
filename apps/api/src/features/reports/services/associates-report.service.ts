import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { GenderEnum, StatusEnum } from '@/types/enum';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { AssociatesReportDto } from '../dto/associates-report.dto';
import { buildAssociatesTableContent } from '../templates/pdf/associates.template';

const payrollTypeCat = alias(schema.categories, 'payroll_type');
const associatedTypeCat = alias(schema.categories, 'associated_type');

@Injectable()
export class AssociatesReportService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generatePdf(tenantId: string, filters: AssociatesReportDto) {
    const conditions: any[] = [eq(schema.associates.tenantId, tenantId)];

    if (filters.status) {
      conditions.push(eq(schema.associates.status, filters.status as StatusEnum));
    }
    if (filters.isPayrollCredit) {
      conditions.push(
        eq(schema.associates.isPayrollCredit, filters.isPayrollCredit === 'true'),
      );
    }
    if (filters.gender) {
      conditions.push(eq(schema.associates.gender, filters.gender as GenderEnum));
    }
    if (filters.associatedTypeId) {
      conditions.push(eq(schema.associates.associatedTypeId, filters.associatedTypeId));
    }
    if (filters.payrollTypeId) {
      conditions.push(eq(schema.associates.payrollTypeId, filters.payrollTypeId));
    }
    if (filters.dateFrom) {
      conditions.push(gte(schema.associates.dateAdmission, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(schema.associates.dateAdmission, filters.dateTo));
    }

    const rawData = await this.drizzle
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        dateAdmission: schema.associates.dateAdmission,
        status: schema.associates.status,
        isPayrollCredit: schema.associates.isPayrollCredit,
        gender: schema.associates.gender,
        payrollType: payrollTypeCat.name,
        associatedType: associatedTypeCat.name,
        jobTitle: schema.associates.jobTitle,
        phone: schema.associates.phone,
        email: schema.associates.email,
      })
      .from(schema.associates)
      .leftJoin(
        payrollTypeCat,
        eq(schema.associates.payrollTypeId, payrollTypeCat.id),
      )
      .leftJoin(
        associatedTypeCat,
        eq(schema.associates.associatedTypeId, associatedTypeCat.id),
      )
      .where(and(...conditions));

    const content = buildAssociatesTableContent(rawData);

    return this.pdfService.generateReport('LISTADO DE ASOCIADOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}
