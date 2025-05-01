import { useSafeQuery } from "@/hooks/use-safe-query";
import { getAssociatesByCedulaAction } from "../actions/individual-load.action";


export function useAssociatesByCedula(cedula: string, options?: { enabled?: boolean }) {
  return  useSafeQuery(
    ['associates-by-cedula', cedula],
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula ? options?.enabled : false,
      ...options,
    },
  );


}
