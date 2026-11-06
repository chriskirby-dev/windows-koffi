import koffi from "koffi";

const user32 = koffi.load("user32.dll");
const SetThreadDpiAwarenessContext = user32.func("void * __stdcall SetThreadDpiAwarenessContext(void *context)");

export function withPhysicalPixels(action) {
    const previous = SetThreadDpiAwarenessContext(-4n); // PER_MONITOR_AWARE_V2
    if (!previous) throw new Error("Unable to set capture DPI awareness");
    try { return action(); }
    finally { SetThreadDpiAwarenessContext(previous); }
}

