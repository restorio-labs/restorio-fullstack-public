export const motionTokens = {
  duration: {
    instant: "0ms",
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
  },
} as const;

export type MotionDuration = keyof typeof motionTokens.duration;
