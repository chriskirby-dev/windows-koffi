import { writeFileSync } from "node:fs";
import koffi from "koffi";
import "./inc/types.js";
import { RECT } from "./inc/struct.js";
import { getMonitors } from "./monitor.js";
import { withPhysicalPixels } from "./inc/dpi.js";

const user32 = koffi.load("user32.dll");
const gdi32 = koffi.load("gdi32.dll");


const HBITMAP = koffi.alias("HBITMAP", "void*");
const HGDIOBJ = koffi.alias("HGDIOBJ", "void*");

const BITMAPINFOHEADER = koffi.struct("BITMAPINFOHEADER", {
    biSize: "uint32_t",
    biWidth: "int32_t",
    biHeight: "int32_t",
    biPlanes: "uint16_t",
    biBitCount: "uint16_t",
    biCompression: "uint32_t",
    biSizeImage: "uint32_t",
    biXPelsPerMeter: "int32_t",
    biYPelsPerMeter: "int32_t",
    biClrUsed: "uint32_t",
    biClrImportant: "uint32_t",
});

const BITMAPINFO = koffi.struct("BITMAPINFO", {
    bmiHeader: BITMAPINFOHEADER,
    bmiColors: "uint32_t[1]", // Define as an empty array or explicitly set
});

const GetDC = user32.func("HDC __stdcall GetDC(HWND hWnd)");
const ReleaseDC = user32.func("int __stdcall ReleaseDC(HWND hWnd, HDC hDC)");
const CreateCompatibleDC = gdi32.func("HDC __stdcall CreateCompatibleDC(HDC hDC)");
const DeleteDC = gdi32.func("int __stdcall DeleteDC(HDC hDC)");

const CreateCompatibleBitmap = gdi32.func("HBITMAP __stdcall CreateCompatibleBitmap(HDC hDC, int nWidth, int nHeight)");
const SelectObject = gdi32.func("HGDIOBJ __stdcall SelectObject(HDC hDC, HGDIOBJ hObject)");
const BitBlt = gdi32.func(
    "bool __stdcall BitBlt(HDC hDC, int x, int y, int nWidth, int nHeight, HDC hSrcDC, int xSrc, int ySrc, DWORD dwRop)"
);

const DeleteObject = gdi32.func("bool __stdcall DeleteObject(HGDIOBJ hObject)");
const SRCCOPY = 0x00cc0020;

const GetDIBits = gdi32.func(
    "int __stdcall GetDIBits(HDC hdc, HBITMAP hbmp, uint32_t start, uint32_t cLines, void *lpvBits, BITMAPINFO *lpbmi, uint32_t usage)"
);

const GetWindowRect = user32.func("int __stdcall GetWindowRect(HWND hwnd, _Out_ RECT *rect)");
const IsWindow = user32.func("int __stdcall IsWindow(HWND hwnd)");
const IsIconic = user32.func("int __stdcall IsIconic(HWND hwnd)");
const IsWindowVisible = user32.func("int __stdcall IsWindowVisible(HWND hwnd)");
const PrintWindow = user32.func("int __stdcall PrintWindow(HWND hwnd, HDC dc, uint32_t flags)");
/** Captures a monitor number returned by getMonitors(). Optional outputPath saves a BMP file. */
export function captureMonitor(number = 1, outputPath) {
    const monitor = getMonitors().find((item) => item.number === number);
    if (!monitor) throw new RangeError(`Monitor ${number} is not connected`);
    return capture(monitor.x, monitor.y, monitor.width, monitor.height, outputPath);
}

/** Captures the entire window, including its frame, using PrintWindow.
 * Optional outputPath saves a BMP file.
 * Tries full-content and standard printing, then copies the visible screen area.
 * Returns method="screen" for the fallback, which includes overlapping windows.
 * Hidden/minimized windows are rejected; some GPU/protected content may be blank.
 */
export function captureWindow(hwnd, outputPath) {
    return withPhysicalPixels(() => {
        if (!hwnd || !IsWindow(hwnd)) throw new TypeError("A valid window handle is required");
        if (IsIconic(hwnd)) throw new Error("Cannot capture a minimized window");
        if (!IsWindowVisible(hwnd)) throw new Error("Cannot capture a hidden window");
        const rect = {};
        if (!GetWindowRect(hwnd, rect)) throw new Error("Unable to read window bounds");
        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        let method = "print-window";
        const result = captureBitmap(width, height, (dc, screen) => {
            if (PrintWindow(hwnd, dc, 2) || PrintWindow(hwnd, dc, 0)) return true;
            // Printing is application-dependent. Only fall back after drawing fails;
            // allocation, readback, and save errors must still propagate normally.
            method = "screen";
            if (!BitBlt(dc, 0, 0, width, height, screen, rect.left, rect.top, SRCCOPY)) {
                throw new Error("Window printing and screen capture both failed. Make sure the window is visible on an unlocked desktop.");
            }
            return true;
        }, outputPath);
        return { ...result, method };
    });
}

/** Captures a screen rectangle in physical pixels. Returns top-down BGRX bytes.
 * Optional outputPath saves a BMP file; existing files are overwritten.
 */
export function capture(x, y, width, height, outputPath) {
    if (![x, y].every(Number.isInteger)) throw new TypeError("Capture coordinates must be integers");
    return withPhysicalPixels(() => captureBitmap(width, height,
        (dc, screen) => BitBlt(dc, 0, 0, width, height, screen, x, y, SRCCOPY), outputPath));
}

function captureBitmap(width, height, draw, outputPath) {
    if (![width, height].every((value) => Number.isInteger(value) && value > 0)) {
        throw new RangeError("Capture dimensions must be positive integers");
    }
    if (outputPath !== undefined && (typeof outputPath !== "string" || !outputPath.trim())) {
        throw new TypeError("Output path must be a non-empty string");
    }
    const data = new Uint8Array(width * height * 4);
    let hdc, memdc, bitmap, previous;
    try {
        hdc = GetDC(null);
        if (!hdc) throw new Error("GetDC failed");
        memdc = CreateCompatibleDC(hdc);
        if (!memdc) throw new Error("CreateCompatibleDC failed");
        bitmap = CreateCompatibleBitmap(hdc, width, height);
        if (!bitmap) throw new Error("CreateCompatibleBitmap failed");
        previous = SelectObject(memdc, bitmap);
        if (!previous) throw new Error("SelectObject failed");
        if (!draw(memdc, hdc)) throw new Error("Capture failed");
        // GetDIBits requires the bitmap to be deselected from the memory DC.
        if (!SelectObject(memdc, previous)) throw new Error("Unable to deselect capture bitmap");
        previous = null;

        const bmi = {
            bmiHeader: {
                biSize: koffi.sizeof(BITMAPINFOHEADER),
                biWidth: width,
                biHeight: -height, // Keep upright
                biPlanes: 1,
                biBitCount: 32, // 32-bit BGRX
                biCompression: 0, // BI_RGB, no compression
                biSizeImage: 0,
                biXPelsPerMeter: 0,
                biYPelsPerMeter: 0,
                biClrUsed: 0,
                biClrImportant: 0,
            },
        };

        if (GetDIBits(hdc, bitmap, 0, height, data, bmi, 0) !== height) {
            throw new Error("GetDIBits failed to read the complete capture");
        }
        if (outputPath !== undefined) saveBitmap(outputPath, width, height, data);
        return { width, height, data };
    } finally {
        if (previous) SelectObject(memdc, previous);
        if (memdc) DeleteDC(memdc);
        if (bitmap) DeleteObject(bitmap);
        if (hdc) ReleaseDC(null, hdc);
    }
}

// A 14-byte file header followed by a 40-byte BITMAPINFOHEADER and top-down BGRX pixels.
function saveBitmap(outputPath, width, height, data) {
    const pixelOffset = 54;
    const file = Buffer.alloc(pixelOffset + data.byteLength);
    file.write("BM", 0, "ascii");
    file.writeUInt32LE(file.length, 2);
    file.writeUInt32LE(pixelOffset, 10);
    file.writeUInt32LE(40, 14);
    file.writeInt32LE(width, 18);
    file.writeInt32LE(-height, 22);
    file.writeUInt16LE(1, 26);
    file.writeUInt16LE(32, 28);
    file.writeUInt32LE(data.byteLength, 34);
    file.set(data, pixelOffset);
    writeFileSync(outputPath, file);
}
