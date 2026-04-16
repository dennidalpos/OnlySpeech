// Unified operation-progress contract for Setup Wizard async operations.
//
// Every async operation routes its visual status through this controller so the
// wizard never shows an indeterminate or determinate bar for work that is not
// actually in flight. The contract is intentionally minimal and covers both
// indeterminate spinners and determinate progress meters.

export type OperationProgressMode = "determinate" | "indeterminate";

export interface OperationProgress {
  /** Stable identifier of the async operation (e.g. "stations-probe"). */
  operationId: string;
  /** Whether the operation exposes a measurable percent or just runs-to-completion. */
  mode: OperationProgressMode;
  /** Percent completion for determinate operations (0..100). */
  percent?: number;
  /** Short primary label displayed near the progress indicator. */
  label: string;
  /** Optional secondary detail line. */
  detail?: string;
  /** Whether the operation can be cancelled by the user. */
  cancellable?: boolean;
}

/**
 * Returns the DOM prefix used by the setup-wizard shell to group the
 * `${prefix}-progress`, `${prefix}-progress-label`, and `${prefix}-progress-detail`
 * elements for a given operation id. Kept as a pure helper so the controller
 * stays independent from the DOM wrapper used by the control script.
 */
export function resolveProgressRegionPrefix(operationId: string): string {
  return operationId;
}
