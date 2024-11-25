import koffi from "koffi";

// Load functions from kernel32.dll for creating a named pipe and writing to it
const CreateNamedPipe = koffi
    .load("kernel32.dll")
    .func("HANDLE CreateNamedPipeA(LPCSTR, DWORD, DWORD, DWORD, DWORD, DWORD, DWORD, LPSECURITY_ATTRIBUTES)");
const ConnectNamedPipe = koffi.load("kernel32.dll").func("BOOL ConnectNamedPipe(HANDLE, LPOVERLAPPED)");
const WriteFile = koffi.load("kernel32.dll").func("BOOL WriteFile(HANDLE, LPCVOID, DWORD, LPDWORD, LPOVERLAPPED)");
const CloseHandle = koffi.load("kernel32.dll").func("BOOL CloseHandle(HANDLE)");

// Define constants
const PIPE_ACCESS_INBOUND = 0x00000001;
const PIPE_ACCESS_OUTBOUND = 0x00000002;
const PIPE_ACCESS_DUPLEX = 0x00000003;

const PIPE_TYPE_BYTE = 0x00000000;
const PIPE_WAIT = 0x00000000;

export function createNamedPipe(name) {
    // Create a named pipe
    const pipeName = `\\\\.\\pipe\\${name}`;
    const hPipe = CreateNamedPipe(
        pipeName,
        PIPE_ACCESS_DUPLEX,
        PIPE_TYPE_BYTE | PIPE_WAIT,
        1, // Only one instance
        512, // Output buffer size
        512, // Input buffer size
        0, // Default timeout
        koffi.NULL // Default security attributes
    );

    if (hPipe === -1) {
        console.error("Failed to create pipe");
        return false;
    }
    console.log("Named pipe created:", pipeName);
    return hPipe;
}

// Connect the pipe
if (!ConnectNamedPipe(hPipe, koffi.NULL)) {
    console.error("Failed to connect pipe");
    CloseHandle(hPipe);
    process.exit(1);
}
console.log("Client connected to named pipe");

// Write a message to the pipe
const message = "Hello from koffi named pipe!";
const buffer = Buffer.from(message, "utf-8");
const written = Buffer.alloc(4); // This will store the number of bytes written

if (!WriteFile(hPipe, buffer, buffer.length, written, koffi.NULL)) {
    console.error("Failed to write to pipe");
} else {
    console.log(`Message sent: ${message}`);
}

// Close the pipe handle after use
CloseHandle(hPipe);
console.log("Pipe closed");
