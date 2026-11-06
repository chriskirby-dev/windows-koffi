# windows-koffi
Native Windows bindings for Node JS inplemented using koffi.dev 

## Desktop Windows
Get desktop windows with descriptors

### Get window by Title

```
Window.fromTitle("My Window Title");
```

### Get window by Class Name

```
Window.fromClassName("WindowClass")
```

### Get window by Handle
```
Window.fromHandle(HWND);
```

## Get Pixel
Get pixel relative to desktop or specific window 

## Type text

```js
import { Keyboard } from './index.js';
import { setTimeout as delay } from 'node:timers/promises';

const keyboard = new Keyboard();
await delay(3000); // Time to focus the destination window.
await keyboard.type('Hello, world!\nNext line.', { speed: 12, randomness: 0.3 });
```

`speed` is characters per second (default `10`). `randomness` is a fraction
from `0` to `1` (default `0`): `0.3` varies each interval by up to ±30%.
The first character is sent immediately; the returned promise resolves when typing
finishes. Unicode text, tabs, and line breaks are supported (CRLF counts as one
line break). Input goes to whichever window has focus at each character.
You can also call `typeText(text, options)` directly. Await calls to keep strings
from interleaving. Windows may block input to applications running at a higher
privilege level.
