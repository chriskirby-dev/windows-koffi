import koffi from "koffi";
import "./inc/types.js";
import { RECT } from "./inc/struct.js";
import { withPhysicalPixels } from "./inc/dpi.js";

const user32 = koffi.load("user32.dll");

const MONITORINFO = koffi.struct("CAPTURE_MONITORINFO", {
    cbSize: "uint32_t", rcMonitor: RECT, rcWork: RECT, dwFlags: "uint32_t",
});
koffi.proto("int __stdcall CaptureMonitorEnumProc(void *monitor, HDC dc, RECT *rect, intptr_t data)");
const EnumDisplayMonitors = user32.func("int __stdcall EnumDisplayMonitors(HDC dc, RECT *clip, CaptureMonitorEnumProc *callback, intptr_t data)");
const GetMonitorInfo = user32.func("int __stdcall GetMonitorInfoW(void *monitor, _Inout_ CAPTURE_MONITORINFO *info)");

/** Lists current monitors in Windows enumeration order (one-based, not Settings numbers). */
export function getMonitors() {
    return withPhysicalPixels(() => {
        const monitors = [];
        let failed = false;
        const success = EnumDisplayMonitors(null, null, (handle) => {
            const info = { cbSize: koffi.sizeof(MONITORINFO) };
            if (!GetMonitorInfo(handle, info)) { failed = true; return 0; }
            const { left, top, right, bottom } = info.rcMonitor;
            monitors.push({ number: monitors.length + 1, handle, x: left, y: top,
                width: right - left, height: bottom - top, primary: !!(info.dwFlags & 1) });
            return 1;
        }, 0);
        if (!success || failed) throw new Error("Unable to enumerate monitors");
        return monitors;
    });
}

