import koffi from "koffi";
import "./inc/types.js";
import { getWindowPixel, getPixel } from "./pixel.js";
import { capture } from "./capture.js";

const user32 = koffi.load("user32.dll");

const GetWindowThreadProcessId = user32.func(
    "DWORD __stdcall GetWindowThreadProcessId(HWND hWnd, _Out_ DWORD *lpdwProcessId)"
);
const GetDesktopWindow = user32.func("HWND __stdcall GetDesktopWindow()");
const GetWindowDC = user32.func("HDC __stdcall GetWindowDC(HWND hWnd)");
const ReleaseDC = user32.func("int __stdcall ReleaseDC(HWND hWnd, HDC hDC)");
const FindWindowEx = user32.func(
    "HWND __stdcall FindWindowExW(HWND hWndParent, HWND hWndChildAfter, const char16_t *lpszClass, const char16_t *lpszWindow)"
);
const FindWindowA = user32.func("HWND __stdcall FindWindowA(LPCSTR lpClassName, LPCSTR lpWindowName)");
const GetWindowText = user32.func("int __stdcall GetWindowTextA(HWND hWnd, _Out_ uint8_t *lpString, int nMaxCount)");
const GetWindowTextLengthA = user32.func("int __stdcall GetWindowTextLengthA(HWND hWnd)");
const GetWindowRect = user32.func("int __stdcall GetWindowRect(HWND hWnd, _Out_ RECT *lpRect)");
const GetClientRect = user32.func("int __stdcall GetClientRect(HWND hWnd, _Out_ RECT *lpRect)");
const GetWindowInfo = user32.func("int __stdcall GetWindowInfo(HWND hWnd, _Inout_ PWINDOWINFO *pwi)");
const BringWindowToTop = user32.func("int __stdcall BringWindowToTop(HWND hWnd)");
const GetClassNameW = user32.func("int __stdcall GetClassNameW(HWND hWnd, _Out_ uint8_t *lpClassName, int nMaxCount)");
const EnumChildCallback = koffi.proto("void EnumChildCallback( HWND hWnd, LPCSTR lParam )");
const EnumChildWindows = user32.func(
    "int __stdcall EnumChildWindows(HWND hWndParent, EnumChildCallback *cb, LPCSTR lParam)"
);

const WindowProc = koffi.proto("LRESULT __stdcall WindowProc( HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam )");

const GetWindowLong = user32.func("LONG __stdcall SetWindowLongPtrW( HWND hWnd, int nIndex )");
const SetWindowLong = user32.func("LONG __stdcall SetWindowLongPtrW( HWND hWnd, int nIndex, LONG dwNewLong )");

const HWINEVENTHOOK = koffi.alias("HWINEVENTHOOK", "int");

const WinEventProc = koffi.proto(
    "void __stdcall WinEventProc(HWINEVENTHOOK hWinEventHook, UINT event, HWND hwnd, LONG idObject, LONG idChild, DWORD idEventThread, DWORD dwmsEventTime)"
);
const WINEVENTPROC = koffi.alias("WINEVENTPROC", "WinEventProc");

const SetWinEventHook = user32.func(
    "bool __stdcall SetWinEventHook( DWORD eventMin, DWORD eventMax, HMODULE hmodWinEventProc, WINEVENTPROC *lpfnWinEventProc, DWORD idProcess, DWORD idThread, DWORD dwFlags )"
);

const EVENT_OBJECT_LOCATIONCHANGE = 0x800b;
const WINEVENT_OUTOFCONTEXT = 0x0000;

export function windowChildren(hwnd, callback) {
    function childCallback(childHwnd, targetName) {
        console.log(childHwnd, targetName);
    }

    EnumChildWindows(hwnd, callback, "bsChildren");
}

export function getDesktopWindow() {
    return GetDesktopWindow();
}

export function processIdFromHandle(hwnd) {
    let pid;
    let ptr = [null];
    let tid = GetWindowThreadProcessId(hwnd, ptr);
    pid = ptr[0];
    return pid;
}

export function getClassName(hwnd) {
    const buffer = Buffer.alloc(256);
    // Get class name using GetClassNameW (returns the length of the class name string)
    const classNameLength = GetClassNameW(hwnd, buffer, buffer.length);
    // If GetClassNameW returns 0, no class name was retrieved
    if (classNameLength === 0) {
        return null;
    }

    // Convert the buffer from a wide-character string (UTF-16) to a normal string
    return buffer.toString("utf16le", 0, classNameLength * 2); // *2 for UTF-16 encoding
}

export function handleFromTitle(windowName) {
    console.log("findTopWindow", windowName);
    return FindWindowA(null, windowName);
}

export function handleFromClassName(windowName) {
    console.log("findTopWindow", windowName);
    return FindWindowA(null, windowName);
}

export function findHandle(className, windowName) {
    console.log("findTopWindow", windowName);
    return FindWindowA(null, windowName);
}

export function WindowDetail(hwnd) {
    const windowInfo = {};
    GetWindowInfo(hwnd, windowInfo);
    return windowInfo;
}

export class Window {
    static winEventHooks = new Map();

    static fromDesktop() {
        const handle = GetDesktopWindow();
        return new Window(handle);
    }

    static fromTitle(windowTitle) {
        const handle = FindWindowA(null, windowTitle);
        return new Window(handle);
    }

    static fromClassName(className) {
        const handle = FindWindowA(className, null);
        return new Window(handle);
    }

    static findHandle(handle) {
        return new Window(handle);
    }

    title = null;
    x;
    y;
    width;
    height;

    border = {};

    constructor(handle) {
        this.hwnd = handle;
        this.initialize();
    }

    getPixel(x, y) {
        x += this.client.x;
        y += this.client.y;
        return getPixel(x, y);
    }

    focus() {
        return BringWindowToTop(this.hwnd);
    }

    getDC() {
        this.dc = GetWindowDC(this.hwnd);
        return this.dc;
    }

    releaseDC() {
        return ReleaseDC(this.hwnd, this.dc);
    }

    details() {
        console.log(this.hwnd);
        return WindowDetail(this.hwnd);
    }

    updateBounds(rect = {}, client = {}) {
        if (rect.top == undefined) GetWindowRect(this.hwnd, rect);
        if (client.top == undefined) GetClientRect(this.hwnd, client);

        this.width = rect.right - rect.left;
        this.height = rect.bottom - rect.top;
        this.x = rect.left;
        this.y = rect.top;

        this.center = {
            x: this.width / 2,
            y: this.height / 2,
        };

        const _rect = {
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
            x: rect.left,
            y: rect.top,
        };

        const _client = {
            width: client.right - client.left,
            height: client.bottom - client.top,
        };

        const _border = {
            x: _rect.width - _client.width,
            y: _rect.height - _client.height,
        };
        _border.width = _border.x / 2;
        _border.left = _border.x / 2;
        _border.right = _border.x - _border.left;

        _border.bottom = _border.x / 2;
        _border.top = _border.y - _border.bottom;

        _client.x = Math.round(_rect.x + _border.width);
        _client.y = Math.round(_rect.y + _border.top);

        this.client = _client;
        this.border = _border;
        this.rect = _rect;
    }

    getChildren() {
        this.children = [];
        windowChildren(this.hwnd, (hwnd, targetName) => {
            this.children.push(new Window(hwnd));
        });
        return this.children;
    }

    capture(cx = 0, cy = 0, cw, ch) {
        let { x: _x, y: _y, width: _width, height: _height } = this.client;

        const x = Math.round(_x + cx);
        const y = Math.round(_y + cy);
        const width = Math.round(cw || _width);
        const height = Math.round(ch || _height);

        return capture(x, y, width, height);
    }

    onChange(callback) {
        if (Window.winEventHooks.has(this.hwnd)) {
            // If already hooked, add the callback
            Window.winEventHooks.get(this.hwnd).push(callback);
        } else {
            // Create a new hook for this window
            const listeners = [callback];
            Window.winEventHooks.set(this.hwnd, listeners);

            const hook = SetWinEventHook(
                EVENT_OBJECT_LOCATIONCHANGE,
                EVENT_OBJECT_LOCATIONCHANGE,
                null,
                koffi.register((hWinEventHook, event, hwnd, idObject, idChild, idEventThread, dwmsEventTime) => {
                    if (hwnd == null) return;
                    const win = new Window(hwnd);
                    if (win.identifier === this.identifier) {
                        // Update bounds and determine the type of change
                        const previousRect = { ...this.rect };
                        this.updateBounds();

                        const isMoved = previousRect.x !== this.rect.x || previousRect.y !== this.rect.y;
                        const isResized =
                            previousRect.width !== this.rect.width || previousRect.height !== this.rect.height;

                        if (isMoved || isResized) {
                            // Notify all listeners with details of the change
                            listeners.forEach((fn) => fn({ isMoved, isResized, rect: this.rect, client: this.client }));
                        }
                    }
                }, koffi.pointer(WinEventProc)),
                0,
                0,
                WINEVENT_OUTOFCONTEXT
            );
            this.eventHook = hook;
        }
    }

    removeChangeListener(callback) {
        const listeners = Window.winEventHooks.get(this.hwnd);
        if (!listeners) return;

        const index = listeners.indexOf(callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }

        if (listeners.length === 0) {
            Window.winEventHooks.delete(this.hwnd);
            // Optionally remove the hook entirely if no listeners remain
        }
    }

    cleanup() {
        if (this.eventHook) {
            UnhookWinEvent(this.eventHook); // Clean up the hook
        }
    }

    get identifier() {
        return this.pid + ":" + this.threadId + ":" + this.className;
    }

    initialize() {
        let ptr = [null];
        let tid = GetWindowThreadProcessId(this.hwnd, ptr);
        this.threadId = tid;
        this.pid = ptr[0];
        this.className = getClassName(this.hwnd);

        let buf = Buffer.allocUnsafe(1024);
        let length = GetWindowText(this.hwnd, buf, buf.length);
        this.title = koffi.decode(buf, "char", length);
        this.updateBounds();
    }
}

export default Window;
