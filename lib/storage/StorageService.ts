import path from "path";
import { Readable } from "stream";
import * as ftp from "basic-ftp";

export interface UploadResult {
  url: string; // Web-accessible URL path (e.g., "/assets/1712345678-abc123.jpg")
  filename: string; // Clean generated filename
  logs: string[]; // Diagnostic logs (e.g. directories created)
}

export interface IStorageService {
  uploadFile(
    file: File | Buffer,
    folder?: string,
    originalName?: string,
  ): Promise<UploadResult>;
  deleteFile(fileUrlOrName: string): Promise<void>;
}

/**
 * Helper to ensure and navigate remote directory trees with cPanel/Hostinger "public_html" compatibility.
 */
async function ensureFtpDir(
  client: ftp.Client,
  remotePath: string,
  logs: string[],
): Promise<void> {
  const segments = remotePath.split("/").filter(Boolean);
  let currentPath = "";

  for (const segment of segments) {
    if (segment === "public_html") {
      const list = await client.list();
      const hasPublicHtml = list.some(
        (item) => item.name === "public_html" && item.isDirectory,
      );
      if (!hasPublicHtml) {
        continue;
      }
    }
    const list = await client.list();
    const exists = list.some(
      (item) => item.name === segment && item.isDirectory,
    );
    if (!exists) {
      const folderName = currentPath ? `${currentPath}/${segment}` : segment;
      logs.push(`FTP directory '${folderName}' did not exist. Creating...`);
    }
    await client.ensureDir(segment);
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
  }
}

/**
 * Helper to navigate directly to directory for deletion.
 */
async function cdFtpDir(client: ftp.Client, remotePath: string): Promise<void> {
  const segments = remotePath.split("/").filter(Boolean);
  for (const segment of segments) {
    if (segment === "public_html") {
      const list = await client.list();
      const hasPublicHtml = list.some(
        (item) => item.name === "public_html" && item.isDirectory,
      );
      if (!hasPublicHtml) {
        continue;
      }
    }
    await client.cd(segment);
  }
}

export class FtpStorageService implements IStorageService {
  private host = process.env.FTP_HOST;
  private user = process.env.FTP_USER;
  private password = process.env.FTP_PASSWORD;
  private port = Number(process.env.FTP_PORT) || 21;
  private remotePath = process.env.FTP_REMOTE_PATH || "public_html/assets";

  /**
   * Uploads a File or Buffer to the remote FTP server and returns the public path.
   */
  async uploadFile(
    file: File | Buffer,
    folder: string = "assets",
    originalName?: string,
  ): Promise<UploadResult> {
    if (!this.host || !this.user || !this.password) {
      throw new Error(
        "FTP Upload Configuration is missing. Please configure FTP_HOST, FTP_USER, and FTP_PASSWORD.",
      );
    }
    const client = new ftp.Client();
    const logs: string[] = [];
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

      // Generate collision-resistant unique name
      const uniqueName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}${ext.toLowerCase()}`;

      await client.access({
        host: this.host,
        user: this.user,
        password: this.password,
        port: this.port,
        secure: false,
      });

      // Ensure directory exists on the remote host
      await ensureFtpDir(client, this.remotePath, logs);

      // Stream buffer to remote FTP file
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, uniqueName);

      return {
        url: `/${folder}/${uniqueName}`,
        filename: uniqueName,
        logs,
      };
    } catch (error) {
      console.error("[FtpStorageService] Upload failed:", error);
      throw new Error(
        `Failed to upload file to FTP storage: ${(error as Error).message}`,
      );
    } finally {
      client.close(); // Prevent dangling sockets
    }
  }

  /**
   * Deletes a file from the remote FTP server by URL or filename.
   */
  async deleteFile(fileUrlOrName: string): Promise<void> {
    if (!fileUrlOrName) return;
    if (!this.host || !this.user || !this.password) {
      console.warn(
        "[FtpStorageService] Skipping deletion: FTP configuration missing.",
      );
      return;
    }
    const client = new ftp.Client();
    try {
      const filename = path.basename(fileUrlOrName);
      await client.access({
        host: this.host,
        user: this.user,
        password: this.password,
        port: this.port,
        secure: false,
      });
      await cdFtpDir(client, this.remotePath);
      await client.remove(filename);
      console.log(`[FtpStorageService] Deleted file '${filename}' from FTP.`);
    } catch (error) {
      console.warn(
        `[FtpStorageService] Could not delete file '${fileUrlOrName}':`,
        error,
      );
    } finally {
      client.close();
    }
  }
}

// Export singleton instance
export const storageService: IStorageService = new FtpStorageService();
