import koffi from 'koffi';


export const POINT = koffi.struct('POINT', {
    x: 'long',
    y: 'long'
});

export const RECT = koffi.struct('RECT', {
    left: 'long',
    top: 'long',
    right: 'long',
    bottom: 'long'
});


export const PWINDOWINFO = koffi.struct('PWINDOWINFO', {
    cbSize: 'DWORD',           // Size of the structure in bytes
    rcWindow: 'RECT',         // Rectangle containing the window coordinates
    rcClient: 'RECT',         // Rectangle containing the client area coordinates
    dwStyle: 'DWORD',         // Window styles
    dwExStyle: 'DWORD',       // Extended window styles
    dwWindowStatus: 'DWORD',  // Window status flags
    cxWindowBorders: 'UINT',  // Width of window borders
    cyWindowBorders: 'UINT',  // Height of window borders
    atomWindowType: 'int',   // Atom value of the window type
    wCreatorVersion: 'int32'   // Creator version of the window
});
