import { asyncTryCatch } from "./utils.js";
import { logger } from "./logger.js";

export async function timeExtractor(url) {
  const startTime = performance.now();
  let data;
  do {
    const { result, error } = await asyncTryCatch(() => fetch(url));
    if (error) {
      logger.error(`Error fetching extractor data`, { error, url });
      break;
    }
    if (result.status >= 429) {
      const { result: jsonResult, error: jsonError } = await asyncTryCatch(() => result.json());
      logger.warn("Received error response from extractor, retrying...", { status: result.status, url, jsonResult });
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }
    const { result: jsonResult, error: jsonError } = await asyncTryCatch(() => result.json());
    if (jsonError) {
      logger.error(`Error parsing extractor data`, { error: jsonError, url });
      break;
    }
    data = jsonResult;
    if (data?.message === "processing") {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } while (data?.message === "processing");
  const endTime = performance.now();
  const durationMs = endTime - startTime;
  const durationSec = durationMs / 1000;
  return durationSec;
}
