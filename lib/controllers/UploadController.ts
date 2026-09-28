import { storageService } from "@/lib/storage/StorageService";
import { handleRouteError, jsonSuccess } from "@/lib/http/response";
import { BadRequestError } from "@/lib/errors";

export const UploadController = {
  async upload(request: Request) {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        throw new BadRequestError("Content-Type must be multipart/form-data");
      }

      const formData = await request.formData();
      const folder = (formData.get("folder") as string) || "assets";

      // Accept "image" or "file" for single upload
      const singleFile =
        (formData.get("image") as File | null) ||
        (formData.get("file") as File | null);

      // Check for multiple files ("gallery" or "files")
      const galleryFiles = [
        ...(formData.getAll("gallery") as File[]),
        ...(formData.getAll("files") as File[]),
      ].filter((f) => f && f.size > 0);

      // If gallery files provided, upload all
      if (galleryFiles.length > 0) {
        const results = await Promise.all(
          galleryFiles.map((file) => storageService.uploadFile(file, folder)),
        );

        return jsonSuccess(
          {
            files: results,
            urls: results.map((r) => r.url),
          },
          201,
        );
      }

      // Single file upload
      if (!singleFile || singleFile.size === 0) {
        throw new BadRequestError("No valid file provided for upload");
      }

      const uploadResult = await storageService.uploadFile(singleFile, folder);

      return jsonSuccess(
        {
          url: uploadResult.url,
          filename: uploadResult.filename,
          logs: uploadResult.logs,
        },
        201,
      );
    } catch (error) {
      return handleRouteError(error);
    }
  },

  async delete(request: Request) {
    try {
      let fileUrlOrName = "";

      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = (await request.json()) as {
          fileUrlOrName?: string;
          file?: string;
          url?: string;
        };
        fileUrlOrName = body.fileUrlOrName || body.file || body.url || "";
      } else {
        const { searchParams } = new URL(request.url);
        fileUrlOrName =
          searchParams.get("fileUrlOrName") ||
          searchParams.get("file") ||
          searchParams.get("url") ||
          "";
      }

      if (!fileUrlOrName) {
        throw new BadRequestError("fileUrlOrName parameter is required");
      }

      await storageService.deleteFile(fileUrlOrName);
      return jsonSuccess({
        deleted: true,
        fileUrlOrName,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  },
};
