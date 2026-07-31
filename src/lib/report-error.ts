type ReportableError = Error & { digest?: string };

export function reportError(error: ReportableError): void {
  console.error("[reportError]", error);
}
