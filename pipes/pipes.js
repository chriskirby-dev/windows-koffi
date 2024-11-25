import { exec, spawn, execSync } from "child_process";
import { default as path, dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkIfPipeExists(pipeName) {
    return new Promise((resolve, reject) => {
        fs.access(pipeName, fs.constants.F_OK, (err) => {
            if (err) {
                console.log(`Pipe ${pipeName} is not active or doesn't exist.`);
                resolve(false);
            } else {
                console.log(`Pipe ${pipeName} is active.`);
                resolve(true);
            }
        });
    });
}

export function duplexPipe(pipeDetail) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(`${__dirname}/pipes/duplex.js`);
        worker.on("message", (msg) => {
            if (msg.pipeReady) {
                console.log("The named pipe is ready!");
                // You can now interact with scrcpy and FFmpeg
                resolve();
            }
        });

        worker.on("error", (error) => {
            console.error("Worker error:", error);
        });

        worker.on("exit", (code) => {
            console.log(`Worker exited with code ${code}`);
        });

        if (typeof pipeDetail == "string") {
            pipeDetail = {
                name: pipeDetail,
            };
        }

        worker.postMessage(pipeDetail);
    });
}
