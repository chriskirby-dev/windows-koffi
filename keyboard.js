import koffi from "koffi";
import { setTimeout as delay } from "node:timers/promises";
import { INPUT, SendInput } from "./input/input.js";

const KEYEVENTF_KEYUP = 0x0002;
const KEYEVENTF_UNICODE = 0x0004;
const inputSize = koffi.sizeof(INPUT);

/** Types into the focused window. Speed is characters/second; randomness is 0–1. */
export async function typeText(text, { speed = 10, randomness = 0, signal } = {}) {
    console.log(text, speed, randomness);

    if (typeof text !== "string") throw new TypeError("text must be a string");
    if (!Number.isFinite(speed) || speed <= 0) {
        throw new RangeError("speed must be a finite number greater than zero");
    }
    if (!Number.isFinite(randomness) || randomness < 0 || randomness > 1) {
        throw new RangeError("randomness must be a number between 0 and 1");
    }
    const interval = 1000 / speed;
    // Node timers cannot represent longer intervals without overflowing.
    if (interval * (1 + randomness) > 2147483647) {
        throw new RangeError("speed is too low for the requested timing");
    }

    signal?.throwIfAborted();
    let first = true;
    for (const character of text.replace(/\r\n?/g, "\n")) {
        if (!first) {
            await delay(interval * (1 + (Math.random() * 2 - 1) * randomness), undefined, { signal });
        }
        signal?.throwIfAborted();
        first = false;
        const vk = character === "\n" ? 0x0d : character === "\t" ? 0x09 : 0;
        const events = [];
        // Send both UTF-16 units together for characters outside the BMP.
        for (let i = 0; i < character.length; i++) {
            for (const up of [false, true]) {
                events.push({
                    type: 1,
                    u: {
                        ki: {
                            wVk: vk,
                            wScan: vk ? 0 : character.charCodeAt(i),
                            dwFlags: (vk ? 0 : KEYEVENTF_UNICODE) | (up ? KEYEVENTF_KEYUP : 0),
                            time: 0,
                            dwExtraInfo: 0
                        }
                    }
                });
            }
        }
        console.log(events);
        if (SendInput(events.length, events, inputSize) !== events.length) {
            throw new Error("Windows did not accept all keyboard input events");
        }
    }
}

export class Keyboard {
    type(text, options) {
        return typeText(text, options);
    }
}

export default Keyboard;
