import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RecurringExpenseTemplatesService } from './recurring-expense-templates.service';

@Injectable()
export class RecurringExpensesScheduler {
  private readonly logger = new Logger(RecurringExpensesScheduler.name);

  constructor(
    private readonly templatesService: RecurringExpenseTemplatesService,
  ) {}

  // Todos los días a las 06:00 (hora del servidor)
  @Cron('0 6 * * *')
  async processDueTemplates() {
    const due = await this.templatesService.findDueTemplates();
    if (due.length === 0) return;

    this.logger.log(
      `Procesando ${due.length} plantilla(s) de gasto recurrente vencida(s)`,
    );

    for (const template of due) {
      try {
        await this.templatesService.generateExpenseForTemplate(template);
      } catch (error) {
        this.logger.error(
          `Error procesando plantilla recurrente ${template.id}: ${(error as Error).message}`,
        );
      }
    }
  }
}
