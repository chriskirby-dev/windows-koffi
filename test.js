import {Window, Pixel, Mouse}  from './index.js';
//const win = Window.fromTitle('JustPlay2');

//console.log(win.focus());

const mouse = new Mouse();
mouse.click(365, 14);

mouse.pollCursor((position) => {
    console.log(position);
}, 1000 )