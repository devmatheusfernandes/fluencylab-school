export interface ResendUsageData {
  dailyLimit: string | null;
  dailyUsed: string | null;
  monthlyLimit: string | null;
  monthlyUsed: string | null;
  status:
    | "connected"
    | "connected_no_data"
    | "error"
    | "missing_key"
    | "restricted_key";
  error?: string;
}

export async function getResendUsage(): Promise<ResendUsageData> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      dailyLimit: null,
      dailyUsed: null,
      monthlyLimit: null,
      monthlyUsed: null,
      status: "missing_key",
    };
  }

  try {
    // We make a lightweight request to listing emails to get the headers
    const response = await fetch("https://api.resend.com/emails?limit=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 }, // Disable cache to ensure fresh data
    });

    if (!response.ok) {
      // Check for restricted key error
      if (response.status === 401 || response.status === 403) {
        try {
          const errorData = await response.json();
          if (errorData.name === "restricted_api_key") {
            return {
              dailyLimit: null,
              dailyUsed: null,
              monthlyLimit: null,
              monthlyUsed: null,
              status: "restricted_key",
            };
          }
        } catch {
          // JSON parsing failed
        }
      }

      return {
        dailyLimit: null,
        dailyUsed: null,
        monthlyLimit: null,
        monthlyUsed: null,
        status: "error",
        error: `API returned ${response.status}`,
      };
    }

    // Extract quota headers - note: daily quota only for free plan users
    const dailyUsed = response.headers.get("x-resend-daily-quota") || null;
    const monthlyUsed = response.headers.get("x-resend-monthly-quota") || null;

    console.log("[Resend Usage] Headers:", {
      daily: dailyUsed,
      monthly: monthlyUsed,
      // status: response.status
    });

    // Resend does not provide limit headers, only usage
    // If we have a successful connection but no usage headers, return specific status
    if (dailyUsed === null && monthlyUsed === null) {
      return {
        dailyLimit: null,
        dailyUsed: null,
        monthlyLimit: null,
        monthlyUsed: null,
        status: "connected_no_data",
      };
    }

    return {
      dailyLimit: null, // Not provided by API
      dailyUsed,
      monthlyLimit: null, // Not provided by API
      monthlyUsed,
      status: "connected",
    };
  } catch (error) {
    console.error("Error fetching Resend usage:", error);
    return {
      dailyLimit: null,
      dailyUsed: null,
      monthlyLimit: null,
      monthlyUsed: null,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
