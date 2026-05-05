import { LoginInput } from "@/lib/schemas";
import { UseMutationResult, useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth-service";


  export function useLoginMutation (): UseMutationResult<any, any, LoginInput, unknown>{
     return useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
  })};