import { StatsController } from "@/lib/controllers/StatsController";

export function GET() {
  return StatsController.overview();
}
