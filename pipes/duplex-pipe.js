import koffi from "koffi";

/*const HANDLE = koffi.pointer("HANDLE", koffi.opaque());
//const LPCSTR = koffi.alias("LPCSTR", "const char*");
const UINT = koffi.alias("UINT", "int");
const DWORD = koffi.alias("DWORD", "uint32_t");
const BOOL = koffi.alias("BOOL", "bool");
*/

const LPCVOID = koffi.pointer("LPCVOID", koffi.opaque());
const LPDWORD = koffi.alias("LPDWORD", "int");

koffi.struct("LPOVERLAPPED", {
    Internal: "uint32",
    InternalHigh: "uint32",
    Offset: "uint32",
    OffsetHigh: "uint32",
    hEvent: "HANDLE*",
});

const SECURITY_ATTRIBUTES = koffi.struct("LPSECURITY_ATTRIBUTES", {
    nLength: "uint32", // Use uint32 for nLength (4 bytes)
    lpSecurityDescriptor: "void*", // Pointer to void for security descriptor
    bInheritHandle: "int8", // Use int8 for a boolean value
});

class DuplexPipe {
    constructor(name) {
        this.name = name;
        this.kernel32 = koffi.load("kernel32.dll");

        this.CreateNamedPipeA = this.kernel32.func(
            "HANDLE* __stdcall CreateNamedPipeA(LPCSTR lpName, DWORD dwOpenMode, DWORD dwPipeMode, DWORD nMaxInstances, DWORD nOutBufferSize, DWORD nInBufferSize, DWORD nDefaultTimeOut, LPSECURITY_ATTRIBUTES lpSecurityAttributes)"
        );

        this.securityAttributes = {
            nLength: SECURITY_ATTRIBUTES.size,
            lpSecurityDescriptor: koffi.NULL,
            bInheritHandle: 1,
        };

        this.hPipe = this.CreateNamedPipeA(
            this.name,
            0x00000003, // dwOpenMode
            0x00000000, // dwPipeMode
            1, // nMaxInstances
            512 * 1024, // nOutBufferSize
            512 * 1024, // nInBufferSize
            0, // nDefaultTimeOut
            this.securityAttributes
        );

        if (this.hPipe == koffi.INVALID_HANDLE_VALUE) {
            throw new Error(`Failed to create named pipe: ${this.name}`);
        }
    }

    write(data) {
        const bytesWritten = this.kernel32.func(
            "BOOL __stdcall WriteFile(HANDLE* hFile, LPCVOID lpBuffer, DWORD nNumberOfBytesToWrite)"
        )(this.hPipe, data, data.length);
        console.log("bytesWritten", bytesWritten);
        if (!bytesWritten) {
            throw new Error(`Failed to write to named pipe: ${this.name}`);
        }
    }

    read(buffer) {
        const bytesRead = this.kernel32.func(
            "BOOL __stdcall ReadFile(HANDLE* hFile, LPVOID lpBuffer, DWORD nNumberOfBytesToRead, LPDWORD lpNumberOfBytesRead, LPOVERLAPPED lpOverlapped)"
        )(this.hPipe, buffer, buffer.length, null, null);

        if (!bytesRead) {
            throw new Error(`Failed to read from named pipe: ${this.name}`);
        }
    }

    close() {
        this.kernel32.func("BOOL __stdcall CloseHandle(HANDLE* hFile)")(this.hPipe);
    }
}

export default DuplexPipe;

/*
// Example of using DuplexPipe with scrcpy
const { spawn } = require('child_process');
const DuplexPipe = require('./duplex.js'); // Adjust the path as necessary

function streamFromScrcpy(pipeName) {
    const pipe = new DuplexPipe(pipeName);

    const args = [
        '--max-size', '1920',
        '--bit-rate', '8M',
        '--no-control',
        '--tcpip=7000',
        '--push-target', '/data/local/tmp/scrcpy-server.jar'
        // Add additional arguments as needed
    ];

    const scrcpyProcess = spawn(__dirname + '/vendor/scrcpy/scrcpy', args);

    scrcpyProcess.stdout.on('data', (data) => {
        pipe.write(data);
    });

    scrcpyProcess.stderr.on('data', (data) => {
        console.error(`scrcpy error: ${data}`);
    });

    scrcpyProcess.on('close', (code) => {
        console.log(`scrcpy process exited with code ${code}`);
        pipe.close();
    });
}

// Example of using DuplexPipe with ffmpeg
const ffmpeg = require('fluent-ffmpeg');

function readWithFFmpeg(pipeName) {
    const command = ffmpeg()
        .input(pipeName)
        .inputFormat('rawvideo') // Adjust input format as required
        .output('output.mp4') // Adjust output file and format as required
        .on('start', () => {
            console.log('FFmpeg processing started');
        })
        .on('end', () => {
            console.log('FFmpeg processing finished');
        })
        .on('error', (err) => {
            console.error(`FFmpeg error: ${err.message}`);
        });

    command.run();
}

// Example usage
const scrcpyPipeName = '\\\\.\\pipe\\scrcpy-stream';
streamFromScrcpy(scrcpyPipeName);
readWithFFmpeg(scrcpyPipeName);

*/
