import "server-only"; // <--- 1. PROTEÇÃO DE SEGURANÇA OBRIGATÓRIA

import { MetricServiceClient } from "@google-cloud/monitoring";

export interface FirebaseUsageData {
  reads: number;
  writes: number;
  deletes: number;
  activeConnections: number;
  storageBytes: number;
  bandwidthGB: number;
  appEngineInstances: number;
  cloudFunctionsInvokes: number;
  cloudFunctionsErrors: number;
  tokenVerifications: number;
  period: "month" | "day";
  status: "connected" | "error" | "no_permission";
  error?: string;
}

// Helper to get credentials safely
const getCredentials = () => {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey && clientEmail && projectId) {
      return {
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        projectId,
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing credentials:", error);
    return null;
  }
};

// --- 2. SINGLETON PATTERN PARA NEXT.JS ---
// Evita criar múltiplos clientes durante o Hot Reload em desenvolvimento
const globalForClient = globalThis as unknown as {
  monitoringClient: MetricServiceClient | undefined;
};

const credentialsData = getCredentials();

const client =
  globalForClient.monitoringClient ??
  new MetricServiceClient(
    credentialsData
      ? {
          credentials: credentialsData.credentials,
          projectId: credentialsData.projectId,
        }
      : {},
  );

if (process.env.NODE_ENV !== "production") {
  globalForClient.monitoringClient = client;
}
// -------------------------------------------

interface UsageOptions {
  range: "24h" | "7d" | "30d" | string; // string for 'YYYY-MM' format
}

export async function getFirebaseUsage(
  config: UsageOptions | number = { range: "30d" },
): Promise<FirebaseUsageData> {
  const projectId = credentialsData?.projectId;

  // Backward compatibility
  const range = typeof config === "number" ? "30d" : config.range;

  if (!projectId) {
    return {
      reads: 0,
      writes: 0,
      deletes: 0,
      activeConnections: 0,
      storageBytes: 0,
      bandwidthGB: 0,
      appEngineInstances: 0,
      cloudFunctionsInvokes: 0,
      cloudFunctionsErrors: 0,
      tokenVerifications: 0,
      period: "month",
      status: "error",
      error: "Missing Project ID or Credentials",
    };
  }

  try {
    const name = client.projectPath(projectId);
    const now = new Date();

    let startTime: { seconds: number };
    let endTime: { seconds: number };
    let secondsInPeriod: number;

    // Regex to check for YYYY-MM format
    const monthRegex = /^(\d{4})-(\d{2})$/;
    const match = range.match(monthRegex);

    if (match) {
      // Specific Month Mode
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; // JS months are 0-indexed

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59); // Last day of month

      // If requested month is in future, cap at now
      const effectiveEnd = endOfMonth > now ? now : endOfMonth;

      startTime = { seconds: Math.floor(startOfMonth.getTime() / 1000) };
      endTime = { seconds: Math.floor(effectiveEnd.getTime() / 1000) };
      secondsInPeriod = endTime.seconds - startTime.seconds;
    } else if (range === "24h") {
      startTime = { seconds: Math.floor(now.getTime() / 1000) - 86400 };
      endTime = { seconds: Math.floor(now.getTime() / 1000) };
      secondsInPeriod = 86400;
    } else if (range === "7d") {
      startTime = { seconds: Math.floor(now.getTime() / 1000) - 7 * 86400 };
      endTime = { seconds: Math.floor(now.getTime() / 1000) };
      secondsInPeriod = 7 * 86400;
    } else {
      // Default to 30 days
      const days = 30;
      const startTimeDate = new Date(
        now.getTime() - days * 24 * 60 * 60 * 1000,
      );
      startTime = { seconds: Math.floor(startTimeDate.getTime() / 1000) };
      endTime = { seconds: Math.floor(now.getTime() / 1000) };
      secondsInPeriod = days * 86400;
    }

    const interval = { startTime, endTime };

    /**
     * TIPO 1: Métricas Cumulativas (Soma)
     */
    const getSumMetric = async (metricType: string, extraFilter?: string) => {
      try {
        let filter = `metric.type = "${metricType}"`;
        if (extraFilter) {
          filter += ` AND ${extraFilter}`;
        }

        const [timeSeries] = await client.listTimeSeries({
          name,
          filter,
          interval,
          view: "FULL",
          aggregation: {
            alignmentPeriod: { seconds: secondsInPeriod },
            perSeriesAligner: "ALIGN_SUM",
            crossSeriesReducer: "REDUCE_SUM",
          },
        });

        if (!timeSeries || timeSeries.length === 0) return 0;

        return timeSeries.reduce((acc, series) => {
          return (
            acc +
            (series.points?.reduce((pAcc, point) => {
              return pAcc + (Number(point.value?.int64Value) || 0);
            }, 0) || 0)
          );
        }, 0);
      } catch (err: any) {
        if (err.code === 5) return 0; // NOT_FOUND
        console.warn(`Failed to fetch sum for ${metricType}`, err);
        return 0;
      }
    };

    /**
     * TIPO 2: Métricas de Estado (Gauge)
     */
    const getGaugeMetric = async (metricType: string) => {
      try {
        const [timeSeries] = await client.listTimeSeries({
          name,
          filter: `metric.type = "${metricType}"`,
          interval,
          view: "FULL",
          aggregation: {
            alignmentPeriod: { seconds: secondsInPeriod },
            perSeriesAligner: "ALIGN_MAX",
            crossSeriesReducer: "REDUCE_SUM",
          },
        });

        if (!timeSeries || timeSeries.length === 0) return 0;

        return (
          Number(timeSeries[0]?.points?.[0]?.value?.doubleValue) ||
          Number(timeSeries[0]?.points?.[0]?.value?.int64Value) ||
          0
        );
      } catch (err: any) {
        if (err.code === 5) return 0; // NOT_FOUND
        console.warn(`Failed to fetch gauge for ${metricType}`, err);
        return 0;
      }
    };

    const [
      reads,
      writes,
      deletes,
      storageBytes,
      activeConnections,
      appEngineInstances,
      cloudFunctionsInvokes,
      cloudFunctionsErrors,
      bandwidthBytes,
      tokenVerifications,
    ] = await Promise.all([
      getSumMetric("firestore.googleapis.com/document/read_count"),
      getSumMetric("firestore.googleapis.com/document/write_count"),
      getSumMetric("firestore.googleapis.com/document/delete_count"),
      getGaugeMetric("storage.googleapis.com/storage/total_bytes"),
      getGaugeMetric("firebaseio.googleapis.com/current_active_connections"),
      getGaugeMetric("appengine.googleapis.com/system/instance_count"),
      getSumMetric("cloudfunctions.googleapis.com/function/execution_count"),
      getSumMetric(
        "cloudfunctions.googleapis.com/function/execution_count",
        'metric.label.status != "ok"',
      ),
      getSumMetric("storage.googleapis.com/network/sent_bytes_count"),
      getSumMetric("identitytoolkit.googleapis.com/token/verification_count"),
    ]);

    return {
      reads,
      writes,
      deletes,
      activeConnections,
      storageBytes,
      bandwidthGB: bandwidthBytes / (1024 * 1024 * 1024),
      appEngineInstances,
      cloudFunctionsInvokes,
      cloudFunctionsErrors,
      tokenVerifications,
      period: range === "24h" ? "day" : "month",
      status: "connected",
    };
  } catch (error: any) {
    console.error("Firebase Monitoring API Error:", error);

    if (error.code === 7 || error.message?.includes("Permission denied")) {
      return {
        reads: 0,
        writes: 0,
        deletes: 0,
        activeConnections: 0,
        storageBytes: 0,
        bandwidthGB: 0,
        appEngineInstances: 0,
        cloudFunctionsInvokes: 0,
        cloudFunctionsErrors: 0,
        tokenVerifications: 0,
        period: "month",
        status: "no_permission",
        error: 'Service Account needs "Monitoring Viewer" role',
      };
    }

    return {
      reads: 0,
      writes: 0,
      deletes: 0,
      activeConnections: 0,
      storageBytes: 0,
      bandwidthGB: 0,
      appEngineInstances: 0,
      cloudFunctionsInvokes: 0,
      cloudFunctionsErrors: 0,
      tokenVerifications: 0,
      period: "month",
      status: "error",
      error: error.message || "Unknown error",
    };
  }
}
