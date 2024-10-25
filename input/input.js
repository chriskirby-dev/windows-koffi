import koffi from 'koffi';

import Window from '../window.js';

const user32 = koffi.load('user32.dll');

const INPUT_MOUSE = 0;
const INPUT_KEYBOARD = 1;
const INPUT_HARDWARE = 2;

const KEYEVENTF_KEYUP = 0x2;
const KEYEVENTF_SCANCODE = 0x8;

const MOUSEEVENTF_LEFTDOWN = 2;
const MOUSEEVENTF_LEFTUP = 4;

const VK_LWIN = 0x5B;
const VK_D = 0x44;




const MOUSEINPUT = koffi.struct('MOUSEINPUT', {
    dx: 'long',
    dy: 'long',
    mouseData: 'uint32_t',
    dwFlags: 'uint32_t',
    time: 'uint32_t',
    dwExtraInfo: 'uintptr_t'
});

const KEYBDINPUT = koffi.struct('KEYBDINPUT', {
    wVk: 'uint16_t',
    wScan: 'uint16_t',
    dwFlags: 'uint32_t',
    time: 'uint32_t',
    dwExtraInfo: 'uintptr_t'
});

const HARDWAREINPUT = koffi.struct('HARDWAREINPUT', {
    uMsg: 'uint32_t',
    wParamL: 'uint16_t',
    wParamH: 'uint16_t'
});

const INPUT = koffi.struct('INPUT', {
    type: 'uint32_t',
    u: koffi.union({
        mi: MOUSEINPUT,
        ki: KEYBDINPUT,
        hi: HARDWAREINPUT
    })
});


// Functions declarations
const SendInput = user32.func('unsigned int __stdcall SendInput(uint32_t cInputs, INPUT *pInputs, int cbSize)');
const sendMessage = user32.func('int __stdcall SendMessageW(HWND hWnd, unsigned int Msg, uint16_t wParam, long lParam)');
const setCursorPos = user32.func('bool __stdcall SetCursorPos(int X, int Y)');
const GetCursorPos = user32.func('int __stdcall GetCursorPos(_Out_ POINT *pos)');
const mouse_event = user32.func('void __stdcall mouse_event(uint32_t dwFlags, int dx, int dy, int cButtons, int dwExtraInfo)');
// ... (existing code)


// Utility function to make mouse event
function make_mouse_event(dx, dy, dwFlags) {
    let event = {
        type: INPUT_MOUSE,
        u: {
            mi: {
                dx: dx,
                dy: dy,
                mouseData: 0,
                dwFlags: dwFlags,
                time: 0,
                dwExtraInfo: 0
            }
        }
    };

    return event;
}

function make_keyboard_event(vk, down) {
    let event = {
        type: INPUT_KEYBOARD,
        u: {
            ki: {
                wVk: vk,
                wScan: 0,
                dwFlags: down ? 0 : KEYEVENTF_KEYUP,
                time: 0,
                dwExtraInfo: 0
            }
        }
    };

    return event;
}

export class Mouse {

    constructor() {
        this.x = 0;
        this.y = 0;
        let pos = {};
        GetCursorPos( pos );
        console.log(pos);
    }

    position(){
        let pos = {};
        GetCursorPos( pos );
        return pos;
    }

    pollCursor( callback, interval ){
        const self = this;
        function updatePosition(){
            const position = self.position();
            callback(position);
            setTimeout(updatePosition, interval);
        }
        updatePosition();
    }

    move( x, y ){
        
        if(x) this.x = x;
        if(y) this.y = y;
        
        setCursorPos( this.x, this.y );
    }

    down( x, y ){
        if(x) this.x = x;
        if(y) this.y = y;
        
        console.log(this.x, this.y);
       
        const mouseDownEvent = make_mouse_event(x, y, 0x0001); // Mouse down
        SendInput(1, [mouseDownEvent], koffi.sizeof(INPUT));
    }

    up( x, y ){

        if(x) this.x = x;
        if(y) this.y = y;

        const mouseUpEvent = make_mouse_event(x, y, 0x0002); // Mouse up
        return SendInput(1, [mouseUpEvent], koffi.sizeof(INPUT));
    }

    click( x, y ){

        if(x) this.x = x;
        if(y) this.y = y;

        this.down(this.x, this.y);
        setTimeout(() => {
            this.up(this.x, this.y);
        }, 100 );
    }
}

// Function to simulate mouse down event at specified coordinates
export function mouseDown(x, y) {
    const mouseDownEvent = make_mouse_event(x, y, 0x0001); // Mouse down
    SendInput(1, [mouseDownEvent], koffi.sizeof(INPUT));
}

// Function to simulate mouse up event at specified coordinates
export function mouseUp(x, y) {
    const mouseUpEvent = make_mouse_event(x, y, 0x0002); // Mouse up
    SendInput(1, [mouseUpEvent], koffi.sizeof(INPUT));
}