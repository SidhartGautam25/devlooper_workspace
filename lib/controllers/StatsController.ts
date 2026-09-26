import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { StatsService } from "@/lib/services/StatsService";

export const StatsController = {
  async overview() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const stats = await StatsService.getOverview(currentUser);
      return jsonSuccess(stats);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
