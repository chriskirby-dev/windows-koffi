import koffi from "koffi";

const ole32 = koffi.load("ole32.dll");
const user32 = koffi.load("user32.dll");
const CoInitializeEx = ole32.func("int32_t __stdcall CoInitializeEx(void *reserved, uint32_t flags)");
const CoUninitialize = ole32.func("void __stdcall CoUninitialize()");
const CLSIDFromString = ole32.func("int32_t __stdcall CLSIDFromString(const char16_t *text, _Out_ uint8_t *guid)");
const CoCreateInstance = ole32.func("int32_t __stdcall CoCreateInstance(const uint8_t *clsid, void *outer, uint32_t context, const uint8_t *iid, _Out_ void **object)");
const IsWindow = user32.func("int __stdcall IsWindow(void *hwnd)");
const Release = koffi.proto("uint32_t __stdcall TaskbarRelease(void *self)");
const HrInit = koffi.proto("int32_t __stdcall TaskbarInit(void *self)");
const UpdateTab = koffi.proto("int32_t __stdcall TaskbarUpdate(void *self, void *hwnd)");

function check(result, operation) {
    if (result < 0) {
        throw new Error(`${operation} failed (HRESULT 0x${(result >>> 0).toString(16)})`);
    }
}

function guid(text) {
    const buffer = Buffer.alloc(16);
    check(CLSIDFromString(text, buffer), "CLSIDFromString");
    return buffer;
}

const clsid = guid("{56FDF344-FD6D-11D0-958A-006097C9A090}");
const iid = guid("{56FDF342-FD6D-11D0-958A-006097C9A090}");

/** Change a running window's taskbar button without hiding or restyling it. */
export function setTaskbarVisible(hwnd, visible) {
    if (typeof visible !== "boolean") throw new TypeError("visible must be a boolean");
    if (!hwnd || !IsWindow(hwnd)) throw new Error("A valid window handle is required");
    const initialized = CoInitializeEx(null, 2); // COINIT_APARTMENTTHREADED
    // Electron may have already initialized this thread in another apartment.
    if ((initialized >>> 0) !== 0x80010106) check(initialized, "CoInitializeEx");
    let object;
    let methods;
    try {
        const output = [null];
        check(CoCreateInstance(clsid, null, 1, iid, output), "CoCreateInstance");
        object = output[0];
        const vtable = koffi.decode(object, "void *");
        // IUnknown (0–2), HrInit (3), AddTab (4), DeleteTab (5).
        methods = koffi.decode(vtable, koffi.array("void *", 6));
        check(koffi.call(methods[3], HrInit, object), "ITaskbarList.HrInit");
        check(koffi.call(methods[visible ? 4 : 5], UpdateTab, object, hwnd),
            visible ? "ITaskbarList.AddTab" : "ITaskbarList.DeleteTab");
    } finally {
        try {
            if (object && methods) koffi.call(methods[2], Release, object);
        } finally {
            if (initialized >= 0) CoUninitialize();
        }
    }
}
