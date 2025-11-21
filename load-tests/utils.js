import {
  RESOLUTIONS,
  GOP_SIZES,
  BF,
  AQ_MODES,
  AQ_STRENGTHS,
  PRESETS,
  BANDWIDTHS,
} from "./constants.js";

export function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function asyncTryCatch(fn) {
  try {
    const result = await fn();
    return { result, error: null };
  } catch (error) {
    return { result: null, error };
  }
}

export function generateHeavyRequestBody(videoId) {
  const body = {
    resolution: "1920x1080",
    videoId,
    gop_size: choice(GOP_SIZES),
    preset: choice(PRESETS),
    bf: choice(BF),
    aq_mode: choice(AQ_MODES),
    aq_strength: choice(AQ_STRENGTHS),
    bandwidth: "10M",
  };

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

export function generateRandomRequestBody(videoId) {
  const body = {
    resolution: choice(RESOLUTIONS),
    videoId,
    gop_size: choice(GOP_SIZES),
    preset: choice(PRESETS),
    bf: choice(BF),
    aq_mode: choice(AQ_MODES),
    aq_strength: choice(AQ_STRENGTHS),
    bandwidth: choice(BANDWIDTHS),
  };

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
