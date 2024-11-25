import koffi from "koffi";

const UINT = koffi.alias("UINT", "int");
const DWORD = koffi.alias("DWORD", "uint32_t");
const HANDLE = koffi.pointer(koffi.opaque("HANDLE"));
const HWND = koffi.alias("HWND", HANDLE);
const HDC = koffi.alias("HDC", HANDLE);
const LPCSTR = koffi.alias("LPCSTR", "const char*");
const LPARAM = koffi.alias("LPARAM", "int");
const WPARAM = koffi.alias("WPARAM", "int");
const LRESULT = koffi.alias("LRESULT", "int");
const LPWSTR = koffi.alias("LPWSTR", "wchar_t");
///const BOOL = koffi.alias("BOOL", "bool");
const HMODULE = koffi.alias("HMODULE", "void*");
const LONG = koffi.alias("LONG", "int");
