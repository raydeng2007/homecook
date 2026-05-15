import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

// ─── Helpers ──────────────────────────────────────────────────────────

const ASSETS_DIR = path.resolve(__dirname, '../../assets');

function loadPng(file: string): PNG {
  const buffer = fs.readFileSync(path.join(ASSETS_DIR, file));
  return PNG.sync.read(buffer);
}

/**
 * Get alpha value at (x, y) in an RGBA PNG.
 * pngjs stores pixels as [R, G, B, A, R, G, B, A, ...] in row-major order.
 */
function alphaAt(png: PNG, x: number, y: number): number {
  const idx = (png.width * y + x) * 4 + 3;
  return png.data[idx];
}

/**
 * Sample a square region and return the max alpha value seen.
 * Used to verify a region is fully transparent (max alpha === 0).
 */
function maxAlphaInRegion(
  png: PNG,
  startX: number,
  startY: number,
  size: number
): number {
  let max = 0;
  for (let y = startY; y < startY + size; y++) {
    for (let x = startX; x < startX + size; x++) {
      const a = alphaAt(png, x, y);
      if (a > max) max = a;
    }
  }
  return max;
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('App icon assets', () => {
  describe('adaptive-icon.png (Android adaptive icon foreground)', () => {
    let png: PNG;

    beforeAll(() => {
      png = loadPng('adaptive-icon.png');
    });

    it('exists', () => {
      expect(fs.existsSync(path.join(ASSETS_DIR, 'adaptive-icon.png'))).toBe(true);
    });

    it('is square', () => {
      expect(png.width).toBe(png.height);
    });

    it('is at least 1024x1024 (Expo recommended size)', () => {
      expect(png.width).toBeGreaterThanOrEqual(1024);
    });

    /**
     * Android launchers crop adaptive icons into circles, squircles, or rounded squares.
     * Only the CENTER 66% of the canvas is guaranteed to be visible — anything in the
     * outer ~17% on each side can be clipped depending on the device.
     *
     * This test catches the regression where someone ships an icon that fills the
     * entire canvas with no safe zone, causing the chef hat to look broken or missing
     * on real Android devices.
     */
    it('has transparent safe zone padding in all four corners', () => {
      // Sample a small region in each corner (top-left, top-right, bottom-left, bottom-right).
      // For a 1024x1024 icon, the outer ~17% (172px) should be fully transparent.
      // We sample a 64x64 square right at each corner to be safe.
      const sampleSize = 64;
      const w = png.width;
      const h = png.height;

      const topLeft = maxAlphaInRegion(png, 0, 0, sampleSize);
      const topRight = maxAlphaInRegion(png, w - sampleSize, 0, sampleSize);
      const bottomLeft = maxAlphaInRegion(png, 0, h - sampleSize, sampleSize);
      const bottomRight = maxAlphaInRegion(png, w - sampleSize, h - sampleSize, sampleSize);

      expect(topLeft).toBe(0);
      expect(topRight).toBe(0);
      expect(bottomLeft).toBe(0);
      expect(bottomRight).toBe(0);
    });

    /**
     * The visible logo should occupy the center 66% of the canvas. If the icon is
     * entirely transparent (e.g., someone uploads a blank image), the center will
     * also be transparent. This catches that regression.
     */
    it('has visible content in the center 66% safe zone', () => {
      const w = png.width;
      const h = png.height;
      const centerSize = Math.floor(w * 0.33); // sample 33% region in dead center
      const startX = Math.floor((w - centerSize) / 2);
      const startY = Math.floor((h - centerSize) / 2);

      const centerMaxAlpha = maxAlphaInRegion(png, startX, startY, centerSize);

      // At least some pixels in the center should be fully opaque (alpha >= 200).
      expect(centerMaxAlpha).toBeGreaterThanOrEqual(200);
    });
  });

  describe('icon.png (iOS app icon)', () => {
    let png: PNG;

    beforeAll(() => {
      png = loadPng('icon.png');
    });

    it('exists', () => {
      expect(fs.existsSync(path.join(ASSETS_DIR, 'icon.png'))).toBe(true);
    });

    it('is square', () => {
      expect(png.width).toBe(png.height);
    });

    it('is at least 1024x1024 (App Store requirement)', () => {
      expect(png.width).toBeGreaterThanOrEqual(1024);
    });
  });
});
