import koffi from 'koffi';


const UINT = koffi.alias('UINT', 'int');
const DWORD = koffi.alias('DWORD', 'uint32_t');
const HANDLE = koffi.pointer(koffi.opaque('HANDLE'));
const HWND = koffi.alias('HWND', HANDLE);
const HDC = koffi.alias('HDC', HANDLE);
const LPCSTR = koffi.alias('LPCSTR', 'const char*');