import dns from "node:dns/promises";
import fs from "node:fs/promises";
import path from "path";
import { Readable, Writable } from "stream";
import * as ftp from "basic-ftp";
import { AppError } from "@/lib/errors";

export interface UploadResult {
  url: string;
  filename: string;
  logs: string[];
}

export interface IStorageService {
  uploadFile(
    file: File | Buffer,
    folder?: string,
    originalName?: string,
  ): Promise<UploadResult>;
  deleteFile(fileUrlOrName: string): Promise<void>;
  downloadFile(
    fileUrlOrName: string,
    subfolder?: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null>;
}

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    case ".ico":
      return "image/x-icon";
    case ".bmp":
      return "image/bmp";
    case ".tiff":
    case ".tif":
      return "image/tiff";
    default:
      return "application/octet-stream";
  }
}

async function resolveFtpHost(
  host: string,
): Promise<{ host: string; logs: string[] }> {
  const logs: string[] = [];
  if (process.env.FTP_FORCE_IPV4 === "false") {
    return { host, logs };
  }
  try {
    const { address } = await dns.lookup(host, { family: 4 });
    if (address !== host) {
      logs.push(`Resolved ${host} to IPv4 ${address}`);
    }
    return { host: address, logs };
  } catch {
    return { host, logs };
  }
}

function ftpSecureMode(): boolean | "implicit" {
  const value = (process.env.FTP_SECURE || "false").toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "implicit") return "implicit";
  return false;
}

function isTlsUnsupported(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /\b504\b/.test(message) ||
    /not implemented/i.test(message) ||
    /AUTH TLS/i.test(message) ||
    /534\b/.test(message)
  );
}

function formatFtpError(error: unknown, host: string, port: number): string {
  const err = error as {
    message?: string;
    code?: string;
    errors?: Array<{ code?: string; address?: string; port?: number }>;
  };
  const nested = err.errors?.[0];
  const code = nested?.code || err.code || "";
  const address = nested?.address || host;

  if (code === "ECONNREFUSED" || code === "ETIMEDOUT") {
    return (
      `FTP ${code} at ${address}:${port}. ` +
      `Use the hosting FTP hostname or server IP (not a CDN/WAF domain), ` +
      `and confirm FTP is enabled. Current FTP_HOST=${process.env.FTP_HOST} FTP_PORT=${port}.`
    );
  }
  return err.message || "Unknown FTP error";
}

function configureClient(): ftp.Client {
  const client = new ftp.Client(20000);
  client.ftp.verbose = process.env.FTP_DEBUG === "true";
  client.ftp.ipFamily = 4;
  return client;
}

async function ensureFtpDir(
  client: ftp.Client,
  remotePath: string,
  logs: string[],
): Promise<void> {
  const segments = remotePath.split("/").filter(Boolean);
  for (const segment of segments) {
    try {
      await client.cd(segment);
    } catch {
      logs.push(`FTP directory '${segment}' did not exist. Creating...`);
      await client.sendIgnoringError(`MKD ${segment}`);
      await client.cd(segment);
    }
  }
}

async function cdFtpDir(client: ftp.Client, remotePath: string): Promise<void> {
  const segments = remotePath.split("/").filter(Boolean);
  for (const segment of segments) {
    await client.cd(segment);
  }
}

function getEffectiveRemotePath(folder?: string): string {
  const configured =
    folder ||
    process.env.FTP_REMOTE_PATH ||
    process.env.NEXT_PUBLIC_FTP_REMOTE_PATH ||
    "images";
  return configured.replace(/^\/+|\/+$/g, "");
}

export class FtpStorageService implements IStorageService {
  private host = process.env.FTP_HOST;
  private user = process.env.FTP_USER;
  private password = process.env.FTP_PASSWORD;
  private port = Number(process.env.FTP_PORT) || 21;
  private remotePath = getEffectiveRemotePath();

  private async connect(extraLogs: string[] = []) {
    if (!this.host || !this.user || !this.password) {
      throw new AppError(
        "FTP Upload Configuration is missing. Please configure FTP_HOST, FTP_USER, and FTP_PASSWORD.",
        500,
      );
    }

    const resolved = await resolveFtpHost(this.host);
    extraLogs.push(...resolved.logs);
    const preferredSecure = ftpSecureMode();
    const modes: Array<boolean | "implicit"> =
      preferredSecure === false ? [false, true] : [preferredSecure, false];

    let lastError: unknown;
    for (const secure of modes) {
      const client = configureClient();
      try {
        extraLogs.push(
          `Connecting FTP ${resolved.host}:${this.port} secure=${String(secure)}`,
        );
        await client.access({
          host: resolved.host,
          user: this.user,
          password: this.password,
          port: this.port,
          secure,
          secureOptions: {
            rejectUnauthorized: false,
            host: this.host,
            servername: this.host,
          },
        });
        extraLogs.push(`FTP login ok (secure=${String(secure)})`);
        return client;
      } catch (error) {
        client.close();
        lastError = error;
        if (secure && isTlsUnsupported(error)) {
          extraLogs.push(
            "Server rejected AUTH TLS (504). Retrying without TLS.",
          );
          continue;
        }
        if (!secure && preferredSecure !== false) {
          break;
        }
      }
    }

    throw new AppError(
      formatFtpError(lastError, resolved.host, this.port),
      502,
    );
  }

  async uploadFile(
    file: File | Buffer,
    folder?: string,
    originalName?: string,
  ): Promise<UploadResult> {
    const logs: string[] = [];
    const client = await this.connect(logs);
    try {
      let buffer: Buffer;
      let ext = ".png";
      if (Buffer.isBuffer(file)) {
        buffer = file;
        ext = originalName ? path.extname(originalName) || ".png" : ".png";
      } else {
        buffer = Buffer.from(await file.arrayBuffer());
        ext = path.extname(file.name) || ".png";
      }

      const uniqueName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}${ext.toLowerCase()}`;

      // 1. Resolve remote directory dynamically from env variables
      const targetFolder = getEffectiveRemotePath(folder || this.remotePath);

      // Upload directly to the real remote FTP location
      await ensureFtpDir(client, targetFolder, logs);
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, uniqueName);

      // 2. Cache locally on server disk under targetFolder
      try {
        const localDir = path.join(
          process.cwd(),
          "public",
          ...targetFolder.split("/"),
        );
        await fs.mkdir(localDir, { recursive: true });
        await fs.writeFile(path.join(localDir, uniqueName), buffer);
      } catch (cacheErr) {
        console.warn(
          "[FtpStorageService] Local cache write warning:",
          cacheErr,
        );
      }

      // Generate the URL matching the real stored location from env variables
      const baseDomain = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(
        /\/$/,
        "",
      );
      const relativeUrl = `/${targetFolder}/${uniqueName}`;
      const url = baseDomain ? `${baseDomain}${relativeUrl}` : relativeUrl;

      return {
        url,
        filename: uniqueName,
        logs,
      };
    } catch (error) {
      console.error("[FtpStorageService] Upload failed:", error, logs);
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to upload file to FTP storage: ${formatFtpError(error, this.host || "", this.port)}`,
        502,
      );
    } finally {
      client.close();
    }
  }

  async deleteFile(fileUrlOrName: string): Promise<void> {
    if (!fileUrlOrName) return;
    if (!this.host || !this.user || !this.password) {
      console.warn(
        "[FtpStorageService] Skipping deletion: FTP configuration missing.",
      );
      return;
    }
    let client: ftp.Client | null = null;
    try {
      client = await this.connect();
      const filename = path.basename(fileUrlOrName);
      const targetFolder = getEffectiveRemotePath(this.remotePath);
      await cdFtpDir(client, targetFolder);
      await client.remove(filename);

      // Clean local cache files if present
      try {
        const localCandidates = [
          path.join(
            process.cwd(),
            "public",
            ...targetFolder.split("/"),
            filename,
          ),
          path.join(process.cwd(), "public", "images", filename),
          path.join(process.cwd(), "public", "uploads", "images", filename),
          path.join(process.cwd(), "public", "assets", filename),
        ];
        for (const lp of localCandidates) {
          await fs.unlink(lp).catch(() => {});
        }
      } catch {}
    } catch (error) {
      console.warn(
        `[FtpStorageService] Could not delete file '${fileUrlOrName}':`,
        error,
      );
    } finally {
      client?.close();
    }
  }

  /**
   * Retrieves an image. First checks local cache (if present).
   * If cache is missing, empty, or deleted, fetches DIRECTLY from the real FTP server.
   * Completely independent of local caching!
   */
  async downloadFile(
    fileUrlOrName: string,
    subfolder?: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    if (!fileUrlOrName) return null;
    const filename = path.basename(fileUrlOrName);
    const contentType = getMimeType(filename);

    const targetFolder = getEffectiveRemotePath(this.remotePath);

    // 1. Fast local cache check (if file happens to exist)
    const localCandidates = [
      path.join(process.cwd(), "public", ...targetFolder.split("/"), filename),
      subfolder
        ? path.join(process.cwd(), "public", ...subfolder.split("/"), filename)
        : null,
      path.join(process.cwd(), "public", "images", filename),
      path.join(process.cwd(), "public", "uploads", "images", filename),
      path.join(process.cwd(), "public", "assets", filename),
    ].filter(Boolean) as string[];

    for (const localPath of localCandidates) {
      try {
        const buf = await fs.readFile(localPath);
        return { buffer: buf, contentType };
      } catch {}
    }

    // 2. Fetch directly from the REAL FTP server (works even if cache is completely deleted!)
    if (!this.host || !this.user || !this.password) {
      console.warn("[FtpStorageService] FTP credentials missing for download.");
      return null;
    }

    let client: ftp.Client | null = null;
    try {
      client = await this.connect();

      // Directories to search on FTP server, prioritized by env variable
      const cleanSubfolder = subfolder?.replace(/^\/+|\/+$/g, "");
      const candidatePaths = [
        targetFolder,
        cleanSubfolder,
        cleanSubfolder?.split("/").pop(), // e.g. "images" from "uploads/images"
        "images",
        "uploads/images",
        "",
      ].filter((p): p is string => typeof p === "string" && p !== undefined);

      const uniquePaths = [...new Set(candidatePaths)];

      for (const remoteDir of uniquePaths) {
        try {
          await client.cd("/"); // Return to FTP root
          if (remoteDir) {
            await cdFtpDir(client, remoteDir);
          }

          const chunks: Buffer[] = [];
          const writable = new Writable({
            write(chunk, encoding, callback) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              callback();
            },
          });

          await client.downloadTo(writable, filename);
          const buffer = Buffer.concat(chunks);

          if (buffer.length > 0) {
            // Populate cache in background, but download already succeeded
            try {
              const localCacheDir = path.join(
                process.cwd(),
                "public",
                ...targetFolder.split("/"),
              );
              await fs.mkdir(localCacheDir, { recursive: true });
              await fs.writeFile(path.join(localCacheDir, filename), buffer);
            } catch {}

            return { buffer, contentType };
          }
        } catch {
          // Continue searching other candidate directories on FTP
          continue;
        }
      }

      console.warn(
        `[FtpStorageService] File '${filename}' not found in any FTP directory.`,
      );
      return null;
    } catch (error) {
      console.error(
        `[FtpStorageService] FTP download failed for '${filename}':`,
        error,
      );
      return null;
    } finally {
      client?.close();
    }
  }
}

export const storageService: IStorageService = new FtpStorageService();
