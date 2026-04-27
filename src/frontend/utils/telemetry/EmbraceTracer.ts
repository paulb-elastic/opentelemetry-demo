// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { initSDK } from '@embrace-io/web-sdk';
import { SessionIdProcessor } from './SessionIdProcessor';

const { NEXT_PUBLIC_EMBRACE_APP_ID: EMBRACE_APP_ID = '' } =
  typeof window !== 'undefined' ? window.ENV : {};

export const initEmbrace = () => {
  if (typeof window === 'undefined') return;

  initSDK({
    appID: EMBRACE_APP_ID,
    appVersion: process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME ?? 'frontend',
    spanProcessors: [new SessionIdProcessor()],
  });
};
