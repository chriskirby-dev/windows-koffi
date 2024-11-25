import * as types from "./inc/types.js";
import * as struct from "./inc/struct.js";
import * as pix from "./pixel.js";
import * as win from "./window.js";
import * as input from "./input/input.js";
import * as pipes from "./pipes.js";
//import * as apps from "./applications.js";

export const Mouse = input.Mouse;

export const Window = win.Window;

export const WindowDetail = win.WindowDetail;

export const handleFromTitle = win.handleFromTitle;

export const handleFromClassName = win.handleFromClassName;

export const getDesktopWindow = win.getDesktopWindow;

export const windowChildren = win.windowChildren;

export const Pixel = pix.Pixel;

export const getPixel = pix.getPixel;

export const getWindowPixel = pix.getWindowPixel;

export const getCursorPosition = pix.getCursorPosition;

//export const getApplications = apps.getApplications;

export const duplexPipe = pipes.duplexPipe;
