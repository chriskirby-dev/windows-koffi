import koffi from "koffi";

const user32 = koffi.load("user32.dll");

const EnumWindows = user32.func("BOOL __stdcall EnumWindows(WNDENUMPROC lpEnumFunc, LPARAM lParam)");

const GetWindowTextLengthW = user32.func("int __stdcall GetWindowTextLengthW(HWND hWnd)");

const GetWindowTextW = user32.func("int __stdcall GetWindowTextW(HWND hWnd, LPWSTR lpString, int nMaxCount)");

const IsWindowVisible = user32.func("BOOL __stdcall IsWindowVisible(HWND hWnd)");

const Application = koffi.struct("Application", {
    handle: "HWND",
    title: koffi.array("uint16_t", "int"),
    isVisible: 1,
});

export function getApplications() {
    const applications = [];
    EnumWindows((hwnd, lParam) => {
        const title = new Array(GetWindowTextLengthW(hwnd) + 1);
        GetWindowTextW(hwnd, title, title.length);
        const isVisible = IsWindowVisible(hwnd);
        applications.push(new Application({ handle: hwnd, title, isVisible }));
        return true;
    }, 0);
    return applications;
}
