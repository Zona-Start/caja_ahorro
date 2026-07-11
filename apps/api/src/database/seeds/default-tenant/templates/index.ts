import { CAJA_AHORRO_TEMPLATE } from './CAJA_AHORRO/template';
import { EMPRESA_COMERCIAL_TEMPLATE } from './EMPRESA_COMERCIAL/template';
import type { BusinessTypeTemplate } from './template.types';

const templateRegistry: Record<string, BusinessTypeTemplate> = {
  CAJA_AHORRO: CAJA_AHORRO_TEMPLATE,
  EMPRESA_COMERCIAL: EMPRESA_COMERCIAL_TEMPLATE,
};

export function getTemplate(businessType: string): BusinessTypeTemplate {
  const template = templateRegistry[businessType];
  if (!template) {
    return CAJA_AHORRO_TEMPLATE;
  }
  return template;
}

export { BusinessTypeTemplate };
