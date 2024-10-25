import koffi from 'koffi';

const user32 = koffi.load('user32.dll');



const GetWindowThreadProcessId = user32.func('DWORD __stdcall GetWindowThreadProcessId(HWND hWnd, _Out_ DWORD *lpdwProcessId)');
const GetDesktopWindow = user32.func('HWND __stdcall GetDesktopWindow()');
const GetWindowDC = user32.func('HDC __stdcall GetWindowDC(HWND hWnd)');
const ReleaseDC = user32.func('int __stdcall ReleaseDC(HWND hWnd, HDC hDC)');
const FindWindowEx = user32.func('HWND __stdcall FindWindowExW(HWND hWndParent, HWND hWndChildAfter, const char16_t *lpszClass, const char16_t *lpszWindow)');
const FindWindowA = user32.func('HWND __stdcall FindWindowA(LPCSTR lpClassName, LPCSTR lpWindowName)');
const GetWindowText = user32.func('int __stdcall GetWindowTextA(HWND hWnd, _Out_ uint8_t *lpString, int nMaxCount)');
const GetWindowTextLengthA = user32.func('int __stdcall GetWindowTextLengthA(HWND hWnd)');
const GetWindowRect = user32.func('int __stdcall GetWindowRect(HWND hWnd, _Out_ RECT *lpRect)');
const GetWindowInfo = user32.func('int __stdcall GetWindowInfo(HWND hWnd, _Inout_ PWINDOWINFO *pwi)');
const BringWindowToTop = user32.func('int __stdcall BringWindowToTop(HWND hWnd)');``
const EnumChildCallback = koffi.proto('void EnumChildCallback( HWND hWnd, LPCSTR lParam )');
const EnumChildWindows = user32.func('int __stdcall EnumChildWindows(HWND hWndParent, EnumChildCallback *cb, LPCSTR lParam)');

export function windowChildren( hwnd, callback ){
    function childCallback( childHwnd, targetName ){
        console.log(childHwnd, targetName)
    }

    EnumChildWindows( hwnd, callback, 'bsChildren' );
}

export function getDesktopWindow(){
    return GetDesktopWindow();
}

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


export function WindowDetail(hwnd){

    const windowInfo = {};

    GetWindowInfo(hwnd, windowInfo);
    console.log(windowInfo);
    return windowInfo;
}


export class Window {

    static fromDesktop(){
        const handle = GetDesktopWindow();
        return new Window(handle);
    }

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

    title = null;
    x;
    y;
    width;
    height;

    constructor(handle){
        this.hwnd = handle;
        this.initialize();
    }

    focus(){
        return BringWindowToTop(this.hwnd);
    }

    getDC(){
        this.dc = GetWindowDC(this.hwnd);
        return this.dc;
    }

    releaseDC(){
        return ReleaseDC(this.hwnd, this.dc);
    }

    details(){
        console.log(this.hwnd);
        return WindowDetail(this.hwnd);
    }

    updateBounds(){
        let rect = {};
        GetWindowRect(this.hwnd, rect );

        this.width = rect.right - rect.left;
        this.height = rect.bottom - rect.top;
        this.x = rect.left;
        this.y = rect.top;
        this.center = {
            x: this.width / 2,
            y: this.height / 2
        }
    }

    getChildren(){
        this.children = [];
        windowChildren(this.hwnd, (hwnd, targetName) => {
            this.children.push(new Window(hwnd));
        });
        console.log(this.children);
    }

    initialize(){

        let ptr = [null];
        let tid = GetWindowThreadProcessId(this.hwnd, ptr);
        this.pid = ptr[0];

        let buf = Buffer.allocUnsafe(1024);
        let length = GetWindowText(this.hwnd, buf, buf.length);
        this.title = koffi.decode(buf, 'char', length);
        this.updateBounds();
    }
}

export default Window;