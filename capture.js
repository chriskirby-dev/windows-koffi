import koffi from "koffi";
import "./inc/types.js";

const user32 = koffi.load("user32.dll");
const gdi32 = koffi.load("gdi32.dll");
const kernel32 = koffi.load("kernel32.dll");

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
const GetDeviceCaps = gdi32.func("int __stdcall GetDeviceCaps(HDC hDC, int iCap)");
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

export function capture(x, y, width, height) {
    ///console.log("capture called with:", { x, y, width, height });

    const hdc = GetDC(0);
    const memdc = CreateCompatibleDC(hdc);
    const bitmap = CreateCompatibleBitmap(hdc, width, height);
    SelectObject(memdc, bitmap);

    const bitBltResult = BitBlt(memdc, 0, 0, width, height, hdc, x, y, SRCCOPY);

    const data = new Uint8Array(width * height * 4);

    const bmi = {
        bmiHeader: {
            biSize: 40, // Set size explicitly
            biWidth: width,
            biHeight: -height, // Keep upright
            biPlanes: 1,
            biBitCount: 32, // Set to 32 for RGBA
            biCompression: 0, // BI_RGB, no compression
            biSizeImage: 0,
            biXPelsPerMeter: 0,
            biYPelsPerMeter: 0,
            biClrUsed: 0,
            biClrImportant: 0,
        },
    };

    const getDIBitsResult = GetDIBits(memdc, bitmap, 0, height, data, bmi, 0);
    if (getDIBitsResult === 0) {
        console.error("GetDIBits failed to capture data. Result:", getDIBitsResult);
    }

    DeleteObject(bitmap);
    DeleteDC(memdc);
    ReleaseDC(0, hdc);

    return { width, height, data }; // Return the captured data;
}
