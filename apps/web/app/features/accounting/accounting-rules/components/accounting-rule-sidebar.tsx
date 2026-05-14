import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/shadcn/accordion';
import { Input } from '@repo/shadcn/input';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import { Blocks, Landmark, Search, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAllAccountingRules } from '../hooks/use-all-accounting-rules';
import { useAccountingRulesParams } from '../hooks/use-accounting-rules-params';
import {
  categoryTranslations,
  groupLabels,
  operationsByGroup,
  operationTypeTranslations,
  type Category,
  type OperationGroup,
} from '../constants/operations';

const groupIcons: Record<OperationGroup, typeof Blocks> = {
  OPERATIVE_MODELS: Blocks,
  SYSTEM_EVENTS: Zap,
  TREASURY_FLOWS: Landmark,
};

export function AccountingRuleSidebar() {
  const { category, operation, setCategory, setOperation, setReference } =
    useAccountingRulesParams();

  const { data: allRules } = useAllAccountingRules();

  const [searchTerm, setSearchTerm] = useState('');

  const configuredOps = useMemo(() => {
    if (!allRules) return new Set<string>();
    return new Set(allRules.map((r: { operationType: string }) => r.operationType));
  }, [allRules]);

  const handleOperationClick = (cat: Category, op: string) => {
    setCategory(cat);
    if (op !== operation) {
      setReference(null);
    }
    setOperation(op);
  };

  const groups = Object.keys(operationsByGroup) as OperationGroup[];

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter((group) => {
      const groupOps = operationsByGroup[group];
      return Object.entries(groupOps).some(([catKey, ops]) => {
        if (!ops) return false;
        const catMatches = categoryTranslations[catKey as Category]
          .toLowerCase()
          .includes(term);
        const opMatches = ops.some(
          (op) =>
            op.label.toLowerCase().includes(term) ||
            op.value.toLowerCase().includes(term),
        );
        return catMatches || opMatches;
      });
    });
  }, [searchTerm, groups]);

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar operación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-4">
          <Accordion
            type="multiple"
            defaultValue={groups}
          >
            {filteredGroups.map((group) => {
              const groupOps = operationsByGroup[group];
              const categories = Object.keys(groupOps) as Category[];
              const Icon = groupIcons[group];

              const categoriesFiltered = categories.filter((cat) => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                const ops = groupOps[cat] || [];
                return (
                  categoryTranslations[cat].toLowerCase().includes(term) ||
                  ops.some(
                    (op) =>
                      op.label.toLowerCase().includes(term) ||
                      op.value.toLowerCase().includes(term),
                  )
                );
              });

              if (categoriesFiltered.length === 0) return null;

              const totalOps = categories.flatMap((c) => groupOps[c] || []);
              const pendingCount = totalOps.filter(
                (op) => !configuredOps.has(op.value),
              ).length;

              return (
                <AccordionItem key={group} value={group}>
                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {groupLabels[group]}
                      {pendingCount > 0 && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-4">
                      {categoriesFiltered.map((cat) => {
                        const ops = (groupOps[cat] || []).filter((op) => {
                          if (!searchTerm) return true;
                          const term = searchTerm.toLowerCase();
                          return (
                            op.label.toLowerCase().includes(term) ||
                            op.value.toLowerCase().includes(term)
                          );
                        });
                        if (ops.length === 0) return null;

                        const catPendingCount = ops.filter(
                          (op) => !configuredOps.has(op.value),
                        ).length;

                        return (
                          <div key={cat}>
                            <div className="mb-1 flex items-center gap-1.5">
                              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                                {categoryTranslations[cat]}
                              </span>
                              {catPendingCount > 0 && (
                                <span className="text-[10px] text-orange-500 font-medium">
                                  {catPendingCount}
                                </span>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              {ops.map((op) => {
                                const isActive =
                                  operation === op.value && category === cat;
                                const isPending = !configuredOps.has(op.value);

                                return (
                                  <button
                                    key={op.value}
                                    type="button"
                                    onClick={() =>
                                      handleOperationClick(cat, op.value)
                                    }
                                    className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                                      isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                  >
                                    <span className="flex-1 truncate">
                                      {operationTypeTranslations[op.value] ||
                                        op.value}
                                    </span>
                                    {isPending && (
                                      <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                                    )}
                                    {op.isDynamic && (
                                      <span className="text-[10px] text-muted-foreground/50">
                                        +ref
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}
