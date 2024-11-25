// pipeSetup.js
import koffi from "koffi";
import fs from "fs";
import { parentPort } from "worker_threads";

parentPort.on("message", (data) => {
    if (data.name) {
        let pipeName = data.name;

        if (pipeName.indexOf("\\\\.\\pipe\\") !== 0) {
            pipeName = "\\\\.\\pipe\\" + pipeName;
        }

        const BUFFER_SIZE = 512 * 1024;

        const PIPE_ACCESS_DUPLEX = 0x00000003;
        const PIPE_TYPE_BYTE = 0x00000000;
        const PIPE_NOWAIT = 0x00000001;
        const PIPE_WAIT = 0x00000000;
        const PIPE_READMODE_BYTE = 0x00000000;
        const FILE_FLAG_OVERLAPPED = 0x40000000;

        const OUTPUT_BUFFER_SIZE = parseInt(process.argv[3], 10) || BUFFER_SIZE;
        const INPUT_BUFFER_SIZE = parseInt(process.argv[4], 10) || BUFFER_SIZE;
        const kernel32 = koffi.load("kernel32.dll");

        const HANDLE = koffi.pointer("HANDLE", koffi.opaque());
        const LPCSTR = koffi.alias("LPCSTR", "const char*");
        const UINT = koffi.alias("UINT", "int");
        const DWORD = koffi.alias("DWORD", "uint32_t");
        const BOOL = koffi.alias("BOOL", "bool");

        const SECURITY_ATTRIBUTES = koffi.struct("LPSECURITY_ATTRIBUTES", {
            nLength: "uint32", // Use uint32 for nLength (4 bytes)
            lpSecurityDescriptor: "void*", // Pointer to void for security descriptor
            bInheritHandle: "int8", // Use int8 for a boolean value
        });

        const securityAttributes = {
            nLength: SECURITY_ATTRIBUTES.size, // Set struct size explicitly
            lpSecurityDescriptor: koffi.NULL,
            bInheritHandle: 1, // Boolean true for inheritance
        };

        const CreateNamedPipeA = kernel32.func(
            "HANDLE __stdcall CreateNamedPipeA(LPCSTR lpName, DWORD dwOpenMode, DWORD dwPipeMode, DWORD nMaxInstances, DWORD nOutBufferSize, DWORD nInBufferSize, DWORD nDefaultTimeOut, LPSECURITY_ATTRIBUTES lpSecurityAttributes)"
        );

        const CloseHandle = kernel32.func("BOOL CloseHandle(HANDLE)");

        const hPipe = CreateNamedPipeA(
            pipeName, //lpName
            PIPE_ACCESS_DUPLEX | FILE_FLAG_OVERLAPPED, //dwOpenMode
            PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_NOWAIT, //dwPipeMode
            1, //nMaxInstances
            OUTPUT_BUFFER_SIZE, //nOutBufferSize
            INPUT_BUFFER_SIZE, //nInBufferSize
            0, //nDefaultTimeOut
            securityAttributes
        );

        if (hPipe == koffi.INVALID_HANDLE_VALUE) {
            const errorCode = GetLastError();
            console.error(`Failed to create named pipe. Error code: ${errorCode}`);
            process.exit(1);
        }

        parentPort.postMessage({ pipeReady: true });

        console.log(
            `Duplex named pipe created at: ${pipeName}, Output Buffer: ${OUTPUT_BUFFER_SIZE}, Input Buffer: ${INPUT_BUFFER_SIZE} `,
            hPipe
        );

        // Keep the process alive
        setInterval(() => {}, 1000); // Run an empty function every second
    }
});
