import koffi from 'koffi';

const user32 = koffi.load('user32.dll');


const GetWindowThreadProcessId = user32.func('DWORD __stdcall GetWindowThreadProcessId(HWND hWnd, _Out_ DWORD *lpdwProcessId)');
const GetDesktopWindow = user32.func('HWND __stdcall GetDesktopWindow()');
const GetWindowDC = user32.func('HDC __stdcall GetWindowDC(HWND hWnd)');
const ReleaseDC = user32.func('int __stdcall ReleaseDC(HWND hWnd, HDC hDC)');
const FindWindowEx = user32.func('HWND __stdcall FindWindowExW(HWND hWndParent, HWND hWndChildAfter, const char16_t *lpszClass, const char16_t *lpszWindow)');
const FindWindowA = user32.func('HWND __stdcall FindWindowA(LPCSTR lpClassName, LPCSTR lpWindowName)');


export function processIdFromHandle( hwnd ){
    let pid;
    let ptr = [null];
    let tid = GetWindowThreadProcessId(hwnd, ptr);
    pid = ptr[0];
    return pid;
}

export function handleFromTitle(windowName) {
    console.log('findTopWindow', windowName );
    return FindWindowA(null, windowName);
}

export function handleFromClassName(windowName) {
    console.log('findTopWindow', windowName );
    return FindWindowA(null, windowName);
}

export function findHandle(className, windowName) {
    console.log('findTopWindow', windowName );
    return FindWindowA(null, windowName);
}


export function WindowDetail(){

}


export class Window {

    static fromTitle( windowTitle ){
        const handle = FindWindowA(null, windowTitle);
        return new Window(handle);
    }

    static fromClassName(className){
        const handle = FindWindowA(className, null);
        return new Window(handle);
    }

    static findHandle(handle){
        return new Window(handle);
    }

    constructor(handle){
        this.hwnd = handle;
    }
}