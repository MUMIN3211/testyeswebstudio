const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:8000";
const intervalMinutes = Number.parseInt(process.env.WORKER_INTERVAL_MINUTES || "60", 10);

async function run() {
  const now = new Date().toISOString();
  try {
    const response = await fetch(`${apiBaseUrl}/dashboard/summary`);
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    const payload = await response.json();
    console.log(`[${now}] Worker heartbeat OK | inventory_capital=${payload.inventory_capital}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(`[${now}] Worker heartbeat failed | ${message}`);
  }
}

run();
setInterval(run, intervalMinutes * 60 * 1000);
