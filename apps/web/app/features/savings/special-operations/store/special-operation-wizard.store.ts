import { create } from 'zustand';
import {
  type ExecuteSpecialOperationResponse,
  type PreviewResponse,
  type SpecialOperationAccountConfigItem,
  type SpecialOperationType,
} from '../schemas/special-operations.schema';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const today = () => new Date().toISOString().slice(0, 10);

type WizardState = {
  step: WizardStep;
  operationType: SpecialOperationType | null;
  operationDate: string;
  file: File | null;
  preview: PreviewResponse | null;
  accountConfig: SpecialOperationAccountConfigItem[];
  result: ExecuteSpecialOperationResponse | null;

  setStep: (step: WizardStep) => void;
  next: () => void;
  back: () => void;
  setOperationType: (operationType: SpecialOperationType) => void;
  setOperationDate: (operationDate: string) => void;
  setFile: (file: File | null) => void;
  setPreview: (preview: PreviewResponse | null) => void;
  setAccountConfig: (config: SpecialOperationAccountConfigItem[]) => void;
  setResult: (result: ExecuteSpecialOperationResponse | null) => void;
  reset: () => void;
};

export const useSpecialOperationWizardStore = create<WizardState>(
  (set) => ({
    step: 1,
    operationType: null,
    operationDate: today(),
    file: null,
    preview: null,
    accountConfig: [],
    result: null,

    setStep: (step) => set({ step }),
    next: () =>
      set((state) => ({
        step: Math.min(5, state.step + 1) as WizardStep,
      })),
    back: () =>
      set((state) => ({
        step: Math.max(1, state.step - 1) as WizardStep,
      })),
    setOperationType: (operationType) =>
      set({
        operationType,
        preview: null,
        accountConfig: [],
      }),
    setOperationDate: (operationDate) => set({ operationDate }),
    setFile: (file) => set({ file, preview: null }),
    setPreview: (preview) => set({ preview }),
    setAccountConfig: (accountConfig) => set({ accountConfig }),
    setResult: (result) => set({ result }),
    reset: () =>
      set({
        step: 1,
        operationType: null,
        operationDate: today(),
        file: null,
        preview: null,
        accountConfig: [],
        result: null,
      }),
  }),
);
