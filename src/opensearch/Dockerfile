# Copyright The OpenTelemetry Authors
# SPDX-License-Identifier: Apache-2.0

FROM opensearchproject/opensearch:3.2.0

USER 0

# Install curl for Docker healthcheck (base image may not include it)
RUN if command -v dnf >/dev/null 2>&1; then dnf install -y curl && dnf clean all; elif command -v yum >/dev/null 2>&1; then yum install -y curl && yum clean all; elif command -v apt-get >/dev/null 2>&1; then apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*; fi

# Remove plugins in dependency order - remove dependent plugins first
# These plugins are not needed for basic log storage and retrieval in the demo
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-security-analytics && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-alerting && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-anomaly-detection && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-asynchronous-search && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-cross-cluster-replication && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-custom-codecs && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-flow-framework && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-geospatial && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-neural-search && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-knn && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-ltr && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-skills && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-ml && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-notifications && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-notifications-core && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-observability && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-performance-analyzer && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-reports-scheduler && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-search-relevance && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-system-templates && \
    /usr/share/opensearch/bin/opensearch-plugin remove opensearch-ubi && \
    /usr/share/opensearch/bin/opensearch-plugin remove query-insights

# Keep only these essential plugins:
# - opensearch-security (authentication/authorization) - already disabled via env var
# - opensearch-index-management (index lifecycle management)
# - opensearch-sql (SQL query support for Grafana PPL queries)
# - opensearch-job-scheduler (task scheduling)

USER 1000
