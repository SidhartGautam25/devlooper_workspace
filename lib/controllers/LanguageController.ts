import { auth } from "@/auth";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { requireCurrentUser } from "@/lib/http/session";
import { LanguageService } from "@/lib/services/LanguageService";

export const LanguageController = {
  async list() {
    try {
      const currentUser = requireCurrentUser(await auth());
      const languages = await LanguageService.listLanguages(currentUser);
      return jsonSuccess(languages);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async create(request: Request) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const body = (await request.json()) as { name?: string };
      const language = await LanguageService.createLanguage(
        currentUser,
        body.name ?? "",
      );
      return jsonSuccess(language, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async remove(id: string) {
    try {
      const currentUser = requireCurrentUser(await auth());
      const result = await LanguageService.deleteLanguage(currentUser, id);
      return jsonSuccess(result);
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
