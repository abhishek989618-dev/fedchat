import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { prisma } from "../../config/database.js";

const BACKUPS_DIR = path.resolve(process.env.MEDIA_BACKUP_DIR ?? "uploads/media-backups");
const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR ?? "uploads/media");
// Guard against path traversal in downloaded/wiped backup filenames.
const SAFE_BACKUP_NAME = /^media-backup-[0-9T:.\-]+\.tar\.gz$/;

// ---------------------------------------------------------------------------
// Minimal pure-Node TAR (USTAR) writer — deliberately dependency-free so a
// backup doesn't rely on an unaudited third-party archiving package.
// ---------------------------------------------------------------------------
function tarHeader(name: string, size: number): Buffer {
  const header = Buffer.alloc(512);
  const write = (value: string, offset: number, length: number) => header.write(value, offset, length, "utf8");
  write(name.slice(0, 100), 0, 100);
  write("000644 \0", 100, 8);
  write("000000 \0", 108, 8);
  write("000000 \0", 116, 8);
  write(size.toString(8).padStart(11, "0") + " ", 124, 12);
  write(Math.floor(Date.now() / 1000).toString(8).padStart(11, "0") + " ", 136, 12);
  header.write("        ", 148, 8, "utf8"); // checksum placeholder
  write("0", 156, 1); // regular file
  write("ustar", 257, 6);
  write("00", 263, 2);

  let checksum = 0;
  for (let i = 0; i < 512; i++) checksum += header[i];
  header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "utf8");
  return header;
}

function tarEntry(name: string, content: Buffer): Buffer {
  const header = tarHeader(name, content.length);
  const padLength = (512 - (content.length % 512)) % 512;
  return Buffer.concat([header, content, Buffer.alloc(padLength)]);
}

export const mediaBackupService = {
  async createBackup() {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });

    const assets = await prisma.mediaAsset.findMany({
      select: { id: true, storedName: true, originalName: true, path: true, size: true },
    });

    const chunks: Buffer[] = [];
    let included = 0;
    for (const asset of assets) {
      try {
        const content = await fs.readFile(asset.path);
        chunks.push(tarEntry(asset.storedName, content));
        included++;
      } catch {
        // File already missing from disk — skip it, but keep going so one
        // missing file doesn't fail the whole backup.
      }
    }
    chunks.push(Buffer.alloc(1024)); // two zero blocks terminate a tar archive

    const tarBuffer = Buffer.concat(chunks);
    const gzipped = zlib.gzipSync(tarBuffer);

    const filename = `media-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.tar.gz`;
    const filePath = path.join(BACKUPS_DIR, filename);
    await fs.writeFile(filePath, gzipped);

    return {
      filename,
      sizeBytes: gzipped.length,
      mediaCount: included,
      totalMediaAssets: assets.length,
      createdAt: new Date().toISOString(),
    };
  },

  async listBackups() {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
    const files = await fs.readdir(BACKUPS_DIR);
    const backups = await Promise.all(
      files.filter((f) => SAFE_BACKUP_NAME.test(f)).map(async (f) => {
        const stat = await fs.stat(path.join(BACKUPS_DIR, f));
        return { filename: f, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
      })
    );
    return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  resolveBackupPath(filename: string) {
    if (!SAFE_BACKUP_NAME.test(filename)) throw new Error("Invalid backup filename");
    const resolved = path.join(BACKUPS_DIR, filename);
    if (!resolved.startsWith(BACKUPS_DIR)) throw new Error("Invalid backup path");
    return resolved;
  },

  async backupExists(filename: string) {
    try {
      await fs.access(this.resolveBackupPath(filename));
      return true;
    } catch {
      return false;
    }
  },

  streamBackup(filename: string) {
    return createReadStream(this.resolveBackupPath(filename));
  },

  /**
   * Deletes every media file on disk and every MediaAsset row, but only
   * after the caller has confirmed a specific, already-created backup
   * filename actually exists — this is the only safety rail preventing an
   * accidental irreversible wipe.
   */
  async wipeAllMedia(confirmedBackupFilename: string) {
    const exists = await this.backupExists(confirmedBackupFilename);
    if (!exists) {
      throw new Error("Backup file not found — create and verify a backup before wiping media.");
    }

    const assets = await prisma.mediaAsset.findMany({ select: { id: true, path: true } });
    for (const asset of assets) {
      await fs.rm(asset.path, { force: true }).catch(() => undefined);
    }
    await prisma.mediaAsset.deleteMany({});
    await fs.rm(MEDIA_DIR, { recursive: true, force: true }).catch(() => undefined);
    await fs.mkdir(MEDIA_DIR, { recursive: true });

    return { wiped: assets.length };
  },
};
