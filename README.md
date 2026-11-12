# windows-koffi
Native Windows bindings for Node JS inplemented using koffi.dev 

## Desktop Windows
Get desktop windows with descriptors

```js
const windows = Window.all();
const applications = Window.all({ isApplication: true });
const desktopWindows = Window.all({ isVisible: true });
const visibleApplications = Window.all({ isApplication: true, isVisible: true });
window.updateVisibility(); // Refresh the state on an existing Window instance.
```

Omit either filter (or pass `undefined`) to leave that property unrestricted.
The `isApplication` filter checks `isApplicationWindow`; the `isVisible` filter
checks `isVisibleOnDesktop` (not the raw `isVisible` Windows style property).
Pass `false` to match only false values. `isVisible: null` matches unknown
visibility; unknown values do not match `false`. Filters combine with AND and can
be used alongside `mustHaveTitle`, `mustHaveClassName`, and `mustHaveSize`.

Listing returns all matching top-level windows, with these snapshot properties:

| Property | Meaning |
| --- | --- |
| `isApplicationWindow` | Practical app-window heuristic: visible or minimized, top-level, and explicitly APPWINDOW or unowned without TOOLWINDOW/NOACTIVATE styles. Not a guarantee that activation succeeds. |
| `isBackgroundWindow` | Valid window excluded by that heuristic; not a classification of its entire process. Tool windows and hidden app windows can be included here. |
| `isVisible` | Windows visibility style; can be true when minimized or covered. |
| `isMinimized` | Currently minimized. |
| `isForeground` | Currently the foreground window. |
| `isToolWindow` | Has the tool-window extended style. |
| `isCloaked` | Hidden by the compositor; null if the query fails. |
| `isOnScreen` | Nonempty bounds intersect a connected monitor. |
| `isVisibleOnDesktop` | Visible, not minimized or cloaked, and intersects a monitor. Null if cloaking is unknown. Does not check coverage by other windows or transparency. |
| `isOccluded` | Null (unknown); actual visible pixels are not determined. |
| `isValid` | Handle was valid when checked. |

Windows cannot reliably classify a window as **never visible**: apps can later
show hidden windows. Keep the unfiltered list if you need hidden tray-app windows.
These flags do not guarantee the user can see pixels from a window, and enumeration
does not include processes with no top-level windows.

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

## Hide a running window's taskbar button

```js
import { Window } from './index.js';

const target = Window.fromTitle('Exact window title');
target.setTaskbarVisible(false); // Window stays visible and usable.
target.setTaskbarVisible(true);  // Restore its taskbar button.
```

For an existing HWND, use `setTaskbarVisible(hwnd, visible)` directly.
This uses Windows ITaskbarList, without changing the window's styles or Alt+Tab
eligibility. It applies to one window, not every window belonging to the app.
Pinned shortcuts remain pinned, and apps or Explorer may recreate removed buttons.
Keep the handle so you can restore the button later.

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
