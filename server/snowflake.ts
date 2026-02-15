const SNOWFLAKE_ACCOUNT = process.env.SNOWFLAKE_ACCOUNT;
const SNOWFLAKE_PAT = process.env.SNOWFLAKE_PAT;

const MAX_PROMPT_LENGTH = 8000;

function getSqlApiUrl(): string {
  if (!SNOWFLAKE_ACCOUNT) throw new Error("SNOWFLAKE_ACCOUNT not configured");
  return `https://${SNOWFLAKE_ACCOUNT}.snowflakecomputing.com/api/v2/statements`;
}

async function executeSql(sql: string): Promise<any> {
  if (!SNOWFLAKE_PAT) throw new Error("SNOWFLAKE_PAT not configured");

  const url = getSqlApiUrl();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SNOWFLAKE_PAT}`,
      "Accept": "application/json",
    },
    body: JSON.stringify({
      statement: sql,
      timeout: 60,
      resultSetMetaData: { format: "jsonv2" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Snowflake SQL API error (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function snowflakeCortexComplete(
  prompt: string,
  model: string = "mistral-large2"
): Promise<string> {
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.substring(0, MAX_PROMPT_LENGTH);
  }

  const escapedPrompt = prompt
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

  const sql = `SELECT SNOWFLAKE.CORTEX.COMPLETE('${model}', '${escapedPrompt}') AS response;`;

  const result = await executeSql(sql);

  if (result.data && result.data.length > 0) {
    const rawValue = result.data[0][0];
    if (typeof rawValue === "string") {
      return rawValue.trim();
    }
    return String(rawValue);
  }

  if (result.message && result.code !== "090001") {
    throw new Error(`Snowflake query failed: ${result.message}`);
  }

  throw new Error("No response from Snowflake Cortex");
}

export function isSnowflakeConfigured(): boolean {
  return !!(SNOWFLAKE_ACCOUNT && SNOWFLAKE_PAT);
}

export async function analyzeOceanData(
  cityData: any[],
  scanData: any[],
  analysisType: string = "overview"
): Promise<string> {
  const cityContext = cityData.slice(0, 10).map(c => ({
    city: c.cityName,
    country: c.country,
    kelpDensity: c.kelpDensity,
    trashLevel: c.trashLevel,
    healthScore: c.overallScore,
    rating: c.overallRating,
  }));

  const recentScans = scanData.slice(0, 5).map(s => ({
    zone: s.zone,
    algae: s.algaeLevel,
    greenery: s.greeneryLevel,
    waterQuality: s.waterQuality,
    temperature: s.temperature,
    salinity: s.salinity,
  }));

  const prompts: Record<string, string> = {
    overview: `You are an expert marine biologist and environmental data scientist. Analyze this ocean health monitoring data and provide a concise, actionable intelligence report.

City monitoring data (top 10 by health score):
${JSON.stringify(cityContext, null, 2)}

Recent drone scan data:
${JSON.stringify(recentScans, null, 2)}

Provide a structured analysis with these sections:
1. **Key Findings** - Top 3 critical observations from the data
2. **Risk Assessment** - Which cities face the highest environmental risk and why
3. **Kelp Health Trends** - Analysis of kelp density patterns across monitored cities
4. **Pollution Hotspots** - Cities with concerning trash levels and recommended interventions
5. **Actionable Recommendations** - 3 specific actions for cleanup operations

Keep the analysis data-driven, referencing specific numbers from the data. Be concise but thorough.`,

    predictions: `You are a marine environmental data scientist specializing in predictive analytics. Based on this ocean monitoring data, provide predictions.

City monitoring data:
${JSON.stringify(cityContext, null, 2)}

Recent drone scans:
${JSON.stringify(recentScans, null, 2)}

Provide:
1. **30-Day Forecast** - Predicted changes in ocean health metrics for each monitored region
2. **Emerging Threats** - Environmental threats likely to develop based on current trends
3. **Recovery Opportunities** - Areas showing positive trends that could benefit from intervention
4. **Resource Allocation** - Where to prioritize cleanup resources for maximum impact
5. **Confidence Levels** - Rate your prediction confidence for each forecast (High/Medium/Low)

Use the actual data values in your analysis.`,

    comparison: `You are a comparative environmental analyst. Analyze the ocean health differences across these monitored cities.

City monitoring data:
${JSON.stringify(cityContext, null, 2)}

Provide:
1. **City Rankings** - Rank all cities by overall environmental health with justification
2. **Best Practices** - What the healthiest cities are doing right
3. **Worst Performers** - Which cities need immediate intervention and specific recommendations
4. **Regional Patterns** - Geographic patterns in ocean health (hemispheres, coastlines, etc.)
5. **Correlation Analysis** - Relationships between kelp density, trash levels, and health scores

Reference specific data points and comparisons between cities.`,
  };

  const prompt = prompts[analysisType] || prompts.overview;
  return snowflakeCortexComplete(prompt, "mistral-large2");
}
