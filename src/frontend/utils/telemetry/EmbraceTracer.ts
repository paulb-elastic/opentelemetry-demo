// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { initSDK } from '@embrace-io/web-sdk';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SessionIdProcessor } from './SessionIdProcessor';

const {
  NEXT_PUBLIC_EMBRACE_APP_ID: EMBRACE_APP_ID = '',
  NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = '',
} = typeof window !== 'undefined' ? window.ENV : {};

export const initEmbrace = () => {
  if (typeof window === 'undefined') return;

  initSDK({
    appID: EMBRACE_APP_ID,
    appVersion: process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME ?? 'frontend',
    spanExporters: [
      new OTLPTraceExporter({
        url: NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
      }),
    ],
    spanProcessors: [new SessionIdProcessor()],
  });
};
