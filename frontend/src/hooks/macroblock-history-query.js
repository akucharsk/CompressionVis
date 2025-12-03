import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../utils/urls";
import { defaultRefetchIntervalPolicy, defaultRetryPolicy } from "../utils/retryUtils";
import { genericFetch } from "../api/genericFetch";
import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";

export function useMacroblockHistoryQuery(selectedBlock) {
  const [ params ] = useSearchParams();
  const videoId = params.get("videoId");
  const frameNumber = params.get("frameNumber");
  const x = selectedBlock?.x;
  const y = selectedBlock?.y;

  const queryFn = useCallback(async () => {
      const response = await genericFetch(`${apiUrl}/macroblocks/${videoId}/${frameNumber}/history/?x=${x}&y=${y}`);
      console.log({ response });
      return response;

  }, [ videoId, frameNumber, x, y ]);

  const macroblockHistoryQuery = useQuery({
      queryKey: ["macroblock-history", videoId, frameNumber, x, y],
      queryFn,
      retry: defaultRetryPolicy,
      refetchInterval: defaultRefetchIntervalPolicy,
      enabled: !!videoId && !!frameNumber && !!x && !!y
  });
  macroblockHistoryQuery.isPending = macroblockHistoryQuery.isPending || macroblockHistoryQuery.data?.message === "processing";
  return macroblockHistoryQuery;
}