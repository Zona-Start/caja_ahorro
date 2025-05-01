import { useMutation } from "@tanstack/react-query";
import { saveIndividualLoadAction } from "../actions/individual-load.action";
import { LoadAssest } from "../schemas/individual-load-schema";

export function useIndividualLoadMutation() {
  const mutation = useMutation({
    mutationFn: (loadAssest: LoadAssest) => saveIndividualLoadAction(loadAssest),
  });

  return mutation;
}