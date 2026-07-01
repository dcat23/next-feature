'use client';

import { useEffect } from 'react';
import browserLogger from '../lib/client';
import { setCorrelationId } from '../lib/correlation';

export default function GlobalErrorHandler({
  correlationId,
}: {
  correlationId?: string;
}) {
  useEffect(() => {
    if (correlationId) {
      setCorrelationId(correlationId);
    }
  }, [correlationId]);

  useEffect(() => {
    function onError(event: ErrorEvent) {
      browserLogger.error({
        msg: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      browserLogger.error({
        msg: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
