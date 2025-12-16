export const AIAgentTaskStatus = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED"
} as const;

export type AIAgentTaskStatus = (typeof AIAgentTaskStatus)[keyof typeof AIAgentTaskStatus];
