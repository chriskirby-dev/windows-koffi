import koffi from 'koffi';

import Window from './window.js'

const user32 = koffi.load('user32.dll');
const gdi32 = koffi.load('gdi32.dll');

const BOOL = koffi.alias('BOOL', 'bool');
const COLORREF = koffi.alias('COLORREF', 'uint32_t');


const SetProcessDPIAware = user32.func('int __stdcall SetProcessDPIAware()');
const GetCursorPos = user32.func('int __stdcall GetCursorPos(_Out_ POINT *pos)');
const GetPixel = gdi32.func('COLORREF __stdcall GetPixel(HDC hdc, int x, int y)');



export function getCursorPosition(){
    let pos = {};
    GetCursorPos(pos);
    return pos;
}

export function getPixel(x=0, y=0) {
    // Using the GetPixel C command from Koffi
    SetProcessDPIAware();
    const desktop = Window.fromDesktop();
    const hdc = desktop.getDC();
    const pixelColor = GetPixel(hdc, x, y);
    desktop.releaseDC(hdc);
  
    const r = pixelColor & 0xFF;
    const g = (pixelColor >> 8) & 0xFF;
    const b = (pixelColor >> 16) & 0xFF;

    // Returning the pixel color information
    //console.log(rgb(r,g,b)`Pixel at (${x}, ${y}) has color: ${JSON.stringify(color)}`);
    return { x: x, y: y, color: { r, g, b } };
}

export function getWindowPixel( hwnd, x=0, y=0) {
    // Using the GetPixel command from Koffi library
    SetProcessDPIAware();
    const window = new Window(hwnd);
    const hdc = window.getDC();
    const pixelColor = GetPixel(hdc, x, y);
    window.releaseDC(hdc);
  
    const r = pixelColor & 0xFF;
    const g = (pixelColor >> 8) & 0xFF;
    const b = (pixelColor >> 16) & 0xFF;

    // Returning the pixel color information
    //console.log(rgb(r,g,b)`Pixel at (${x}, ${y}) has color: ${JSON.stringify(color)}`);
    return { x: x, y: y, color: { r, g, b } };
  }


  export class Pixel {

    x;
    y;

    constructor(x=0, y=0){
        this.x = x;
        this.y = y;
    }

    color(){
        const pix = getPixel( this.x, this.y );
        return pix.color;
    }
  
  }