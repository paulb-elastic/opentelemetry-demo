// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { resourceFromAttributes, detectResources } from '@opentelemetry/resources';
import { browserDetector } from '@opentelemetry/opentelemetry-browser-detector';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SessionIdProcessor } from './SessionIdProcessor';

const {
  NEXT_PUBLIC_OTEL_SERVICE_NAME = '',
  NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = '',
  NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT = '',
  IS_SYNTHETIC_REQUEST = '',
} = typeof window !== 'undefined' ? window.ENV : {};

const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment';

const FrontendTracer = async () => {
  const { ZoneContextManager } = await import('@opentelemetry/context-zone');

  const resourceAttributes: Record<string, string> = {
    [ATTR_SERVICE_NAME]: NEXT_PUBLIC_OTEL_SERVICE_NAME,
  };
  if (NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT) {
    resourceAttributes[ATTR_DEPLOYMENT_ENVIRONMENT] = NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT;
  }
  let resource = resourceFromAttributes(resourceAttributes);
  const detectedResources = detectResources({detectors: [browserDetector]});
  resource = resource.merge(detectedResources);

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [
      new SessionIdProcessor(),
      new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
          }),
          {
            scheduledDelayMillis: 500,
          }
      ),
    ],
  });

  const contextManager = new ZoneContextManager();

  provider.register({
    contextManager,
    propagator: new CompositePropagator({
      propagators: [
        new W3CBaggagePropagator(),
        new W3CTraceContextPropagator()],
    }),
  });

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-fetch': {
          propagateTraceHeaderCorsUrls: /.*/,
          clearTimingResources: true,
          applyCustomAttributesOnSpan(span) {
            span.setAttribute('app.synthetic_request', IS_SYNTHETIC_REQUEST);
          },
        },
      }),
    ],
  });
};

export default FrontendTracer;
