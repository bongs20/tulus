import { NextResponse } from "next/server";

export class AidWorkflowError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 400, code = "AID_WORKFLOW_ERROR") {
    super(message);
    this.name = "AidWorkflowError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function toAidErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AidWorkflowError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ message }, { status: 400 });
}
