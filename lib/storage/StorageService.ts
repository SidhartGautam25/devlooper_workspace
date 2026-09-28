import dns from "node:dns/promises";
import path from "path";
import { Readable } from "stream";
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
}

async function resolveFtpHost(host: string): Promise<{ host: string; logs: string[] }> {
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
  // Prefer PASV over EPSV — some Hostinger accounts return 504 on EPSV.
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

export class FtpStorageService implements IStorageService {
  private host = process.env.FTP_HOST;
  private user = process.env.FTP_USER;
  private password = process.env.FTP_PASSWORD;
  private port = Number(process.env.FTP_PORT) || 21;
  private remotePath = process.env.FTP_REMOTE_PATH || "public_html/assets";

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
    folder: string = "assets",
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

      await ensureFtpDir(client, this.remotePath, logs);
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, uniqueName);

      return {
        url: `/${folder}/${uniqueName}`,
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
      await cdFtpDir(client, this.remotePath);
      await client.remove(filename);
    } catch (error) {
      console.warn(
        `[FtpStorageService] Could not delete file '${fileUrlOrName}':`,
        error,
      );
    } finally {
      client?.close();
    }
  }
}

export const storageService: IStorageService = new FtpStorageService();
