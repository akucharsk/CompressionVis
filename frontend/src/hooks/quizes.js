import { useQuery } from "@tanstack/react-query";
import { defaultRetryPolicy } from "../utils/retryUtils";
import { defaultRefetchIntervalPolicy } from "../utils/retryUtils";
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";
import { useSearchParams } from "react-router-dom";

export function useQuizes() {
  const [ params ] = useSearchParams();
  const videoId = params.get("videoId");
  const url = videoId ? `${apiUrl}/quizes/${videoId}` : `${apiUrl}/quizes`;
  return useQuery({
    queryKey: ["quizes", videoId],
    queryFn: async () => await genericFetch(url),
    retry: defaultRetryPolicy,
    refetchInterval: defaultRefetchIntervalPolicy,
  })
}

export function useSingleQuiz(quizId) {
  return useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => await genericFetch(`${apiUrl}/quiz/${quizId}`),
    retry: defaultRetryPolicy,
    refetchInterval: defaultRefetchIntervalPolicy,
    enabled: !!quizId
  })
}
