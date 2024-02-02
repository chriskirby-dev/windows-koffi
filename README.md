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
