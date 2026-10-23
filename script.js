// --- 1. INTERACTION HELPERS ---
function copyDiscordTag(tag) {
    const tempInput = document.createElement('input');
    tempInput.value = tag;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('Copied Discord Tag to Clipboard!');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// --- 2. 60 FPS OPTIMIZED PROCEDURAL PIXEL ART FLOWER FIELD ENGINE ---
const canvas = document.getElementById('flowerCanvas');
const ctx = canvas.getContext('2d');

const V_WIDTH = 256;
const V_HEIGHT = 144;
canvas.width = V_WIDTH;
canvas.height = V_HEIGHT;

const imgData = ctx.createImageData(V_WIDTH, V_HEIGHT);
const data = imgData.data;

// PALETTE BUFFER [R, G, B]
const cBuffer = [
    // --- Sky Gradient (Indices 0-8) ---
    30, 144, 255, // 0,1,2: Bright Blue (Top Sky)
    255, 105, 180, // 3,4,5: Soft Pink (Mid Sky)
    255, 215, 0, // 6,7,8: Golden Horizon (Low Sky)

    // --- Lush Meadow Grass Palette (Indices 9-20) ---
    14, 50, 28, // 9,10,11: Deep Shadow Base (Distant Horizon)
    28, 92, 42, // 12,13,14: Mid-tone Meadow Green
    46, 138, 56, // 15,16,17: Vibrant Foreground Green
    95, 195, 68, // 18,19,20: Sunlit Highlight Tip Green

    // --- Distant Mountain Palette (Indices 21-29) ---
    65, 48, 85, // 21,22,23: Mountain Base Shadow (Deep Muted Purple)
    130, 102, 142, // 24,25,26: Mountain Upper Body (Soft Dusk Lavender)
    255, 220, 160, // 27,28,29: Mountain Top-Left Sunlit Highlight Edge

    // --- Wildflower Palettes & Centers (Indices 30-47) ---
    184, 50, 62, // 30,31,32: Muted Red Petal
    120, 30, 40, // 33,34,35: Red Flower Dark Core
    74, 108, 181, // 36,37,38: Muted Slate Blue Petal
    40, 65, 120, // 39,40,41: Blue Flower Dark Core
    227, 222, 216, // 42,43,44: Off-White Daisy Petal
    180, 140, 50, // 45,46,47: Muted Golden Ochre Core

    // --- Luminous Sunset Cloud Colors (Indices 48-53) ---
    255, 235, 240, // 48,49,50: Luminous White/Pink 1-Pixel Top Rim Highlight
    240, 165, 185 // 51,52,53: Soft Rose Cloud Solid Body Shading
];

const baseHorizonY = Math.floor(V_HEIGHT * 0.58);

// Pre-compute horizon heightmap
const horizonMap = new Int32Array(V_WIDTH);
for (let x = 0; x < V_WIDTH; x++) {
    let lowHills = Math.sin(x * 0.035) * 2.5 + Math.cos(x * 0.08) * 1.5;
    let pixelJitter = ((x * 17 + (x % 3) * 7) % 5) - 2;
    horizonMap[x] = baseHorizonY + Math.floor(lowHills + pixelJitter * 0.6);
}

// --- ALGORITHMIC MOUNTAIN GENERATOR: NO SINGLE-PIXEL POINTS ---
const rawMtnHeight = new Float32Array(V_WIDTH);

for (let x = 0; x < V_WIDTH; x++) {
    let peak1 = Math.max(0, 32 - Math.abs(x - V_WIDTH * 0.48) * 0.42);
    let peak2 = Math.max(0, 18 - Math.abs(x - V_WIDTH * 0.22) * 0.35);
    let peak3 = Math.max(0, 20 - Math.abs(x - V_WIDTH * 0.78) * 0.32);

    let noise = Math.sin(x * 0.08) * 2.2 + Math.cos(x * 0.18) * 1.2;
    let combinedHeight = Math.max(peak1, Math.max(peak2, peak3)) + noise;

    if (combinedHeight > 1.5) {
        rawMtnHeight[x] = baseHorizonY - combinedHeight;
    } else {
        rawMtnHeight[x] = baseHorizonY;
    }
}

const mountainHeight = new Int32Array(V_WIDTH);
for (let x = 0; x < V_WIDTH; x++) {
    mountainHeight[x] = Math.floor(rawMtnHeight[x]);
}

for (let pass = 0; pass < 3; pass++) {
    for (let x = 1; x < V_WIDTH - 1; x++) {
        let prev = mountainHeight[x - 1];
        let curr = mountainHeight[x];
        let next = mountainHeight[x + 1];

        if ((curr < prev && curr < next) || (curr > prev && curr > next)) {
            mountainHeight[x] = prev;
        }
    }
}

for (let x = 1; x < V_WIDTH - 1; x++) {
    if (mountainHeight[x] !== mountainHeight[x - 1] && mountainHeight[x] !== mountainHeight[x + 1]) {
        mountainHeight[x] = mountainHeight[x - 1];
    }
}

// --- PRESET 1 CLOUD GENERATION LOGIC ---
const numClouds = 17;
const clouds = [];

function randomizeCloud(cloud, startOnScreen) {
    cloud.x = startOnScreen ? (Math.random() * (V_WIDTH + 260) - 130) : -60;
    cloud.y = 10 + Math.random() * (baseHorizonY - 55);
    cloud.shapeType = Math.floor(Math.random() * 3);
    cloud.scale = 0.55 + Math.random() * 0.35;

    let baseSpeedRate = 0.03 + Math.random() * 0.12;
    let speedSpreadBonus = (cloud.scale * 0.20);
    cloud.speed = baseSpeedRate + speedSpreadBonus;
}

for (let i = 0; i < numClouds; i++) {
    clouds[i] = {};
    randomizeCloud(clouds[i], true);
}

// Generate grass clumps
const numGrassClumps = 700;
const grassClumps = [];

for (let i = 0; i < numGrassClumps; i++) {
    let x = Math.random() * V_WIDTH;
    let ix = Math.floor(x);
    let localHorizon = horizonMap[Math.max(0, Math.min(V_WIDTH - 1, ix))];

    let normalizedY = Math.random();
    let y = localHorizon + Math.floor(Math.pow(normalizedY, 1.4) * (V_HEIGHT - localHorizon));

    let depth = (y - localHorizon) / (V_HEIGHT - localHorizon);

    let height = 2 + Math.floor(depth * depth * 18);
    let width = 1 + Math.floor(depth * 3);
    let shadeType = Math.floor(Math.random() * 3);

    let catchesWind = (depth > 0.25 || shadeType === 2 || height > 8);
    let phaseOffset = Math.random() * Math.PI * 2;

    grassClumps.push({
        x: x,
        y: y,
        height: height,
        width: width,
        depth: depth,
        shade: shadeType,
        catchesWind: catchesWind,
        phase: phaseOffset
    });
}

for (let x = 0; x < V_WIDTH; x += 1) {
    if (Math.random() > 0.3) {
        let localHorizon = horizonMap[x];
        grassClumps.push({
            x: x,
            y: localHorizon + 1,
            height: 2 + Math.floor(Math.random() * 3),
            width: 1,
            depth: 0,
            shade: Math.floor(Math.random() * 2),
            catchesWind: Math.random() > 0.7,
            phase: Math.random() * Math.PI * 2
        });
    }
}

grassClumps.sort((a, b) => a.y - b.y);

// --- WILDFLOWERS LAYOUT WITH REJECTION SAMPLING & HORIZON DENSITY ---
const flowers = [];
const maxAttempts = 3000;

for (let i = 0; i < maxAttempts && flowers.length < 90; i++) {
    let x = Math.random() * V_WIDTH;
    let ix = Math.floor(x);
    let localHorizon = horizonMap[Math.max(0, Math.min(V_WIDTH - 1, ix))];

    let normalizedY = Math.random();
    let y = localHorizon + Math.floor(Math.pow(normalizedY, 1.25) * (V_HEIGHT - localHorizon));
    let depth = (y - localHorizon) / (V_HEIGHT - localHorizon);

    let minDistance = 4 + depth * 16;
    let tooClose = false;

    for (let f = 0; f < flowers.length; f++) {
        let dx = flowers[f].x - x;
        let dy = flowers[f].y - y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
            tooClose = true;
            break;
        }
    }

    if (!tooClose) {
        let type = Math.floor(Math.random() * 3); // 0: Red, 1: Blue, 2: Off-White
        let phaseOffset = Math.random() * Math.PI * 2;
        let stemCurve = (Math.random() - 0.5) * 1.8;
        flowers.push({
            x: x,
            y: y,
            depth: depth,
            type: type,
            stemCurve: stemCurve,
            phase: phaseOffset
        });
    }
}

flowers.sort((a, b) => a.y - b.y);

let time = 0;

// --- 60 FPS ACCUMULATOR TIMESTEP OPTIMIZATION ---
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastTime = performance.now();
let accumulator = 0;

function updateSimulation() {
    time += 0.015;

    // Preset 1 cloud movement & respawn loop
    for (let i = 0; i < numClouds; i++) {
        clouds[i].x += clouds[i].speed;
        if (clouds[i].x > V_WIDTH + 60) {
            randomizeCloud(clouds[i], false);
        }
    }
}

function renderFrame() {
    const frameR = new Float32Array(V_WIDTH * V_HEIGHT);
    const frameG = new Float32Array(V_WIDTH * V_HEIGHT);
    const frameB = new Float32Array(V_WIDTH * V_HEIGHT);

    // 1. Sky, Mountains, Ground
    for (let y = 0; y < V_HEIGHT; y++) {
        for (let x = 0; x < V_WIDTH; x++) {
            const idx = y * V_WIDTH + x;
            const localHorizon = horizonMap[x];
            const mtnTopY = mountainHeight[x];

            if (y < localHorizon) {
                if (mtnTopY < localHorizon && y >= mtnTopY) {
                    let isRimEdge = (y === mtnTopY) || (x > 0 && mountainHeight[x - 1] > y);

                    if (isRimEdge) {
                        frameR[idx] = cBuffer[27];
                        frameG[idx] = cBuffer[28];
                        frameB[idx] = cBuffer[29];
                    } else {
                        let mtnHeightSpan = Math.max(1, localHorizon - mtnTopY);
                        let verticalProgress = (y - mtnTopY) / mtnHeightSpan;
                        verticalProgress = Math.pow(verticalProgress, 1.2);

                        frameR[idx] = cBuffer[24] * (1 - verticalProgress) + cBuffer[21] * verticalProgress;
                        frameG[idx] = cBuffer[25] * (1 - verticalProgress) + cBuffer[22] * verticalProgress;
                        frameB[idx] = cBuffer[26] * (1 - verticalProgress) + cBuffer[23] * verticalProgress;
                    }
                } else {
                    let pctSky = y / baseHorizonY;
                    if (pctSky < 0.5) {
                        let t = pctSky / 0.5;
                        frameR[idx] = cBuffer[0] * (1 - t) + cBuffer[3] * t;
                        frameG[idx] = cBuffer[1] * (1 - t) + cBuffer[4] * t;
                        frameB[idx] = cBuffer[2] * (1 - t) + cBuffer[5] * t;
                    } else {
                        let t = Math.min(1.0, (pctSky - 0.5) / 0.5);
                        frameR[idx] = cBuffer[3] * (1 - t) + cBuffer[6] * t;
                        frameG[idx] = cBuffer[4] * (1 - t) + cBuffer[7] * t;
                        frameB[idx] = cBuffer[5] * (1 - t) + cBuffer[8] * t;
                    }
                }
            } else {
                let groundDepth = (y - localHorizon) / (V_HEIGHT - localHorizon);
                frameR[idx] = cBuffer[9] * (1 - groundDepth) + cBuffer[12] * groundDepth;
                frameG[idx] = cBuffer[10] * (1 - groundDepth) + cBuffer[13] * groundDepth;
                frameB[idx] = cBuffer[11] * (1 - groundDepth) + cBuffer[14] * groundDepth;
            }
        }
    }

    // 1b. Render Cloud Shape & 1-Pixel Top Rim Highlights
    for (let y = 0; y < baseHorizonY; y++) {
        for (let x = 0; x < V_WIDTH; x++) {
            if (y >= mountainHeight[x]) continue;

            for (let i = 0; i < numClouds; i++) {
                let cl = clouds[i];
                let cx = x - Math.floor(cl.x);
                let cy = y - Math.floor(cl.y);

                let isPixelInCloud = false;
                let sw = 26 * cl.scale;

                if (cl.shapeType === 0) {
                    let abx = Math.abs(cx);
                    if (cy === -1 && abx < sw * 1.3) isPixelInCloud = true;
                    if (cy === -2 && abx < sw * 0.8) isPixelInCloud = true;
                    if (cy === -3 && abx < sw * 0.4) isPixelInCloud = true;
                } else if (cl.shapeType === 1) {
                    let stratusUpperOval = Math.sqrt((cx - sw * 0.25) * (cx - sw * 0.25) + (cy * 2.2) * (cy * 2.2));
                    if (cy < 0 && stratusUpperOval < sw * 0.9) isPixelInCloud = true;
                } else if (cl.shapeType === 2) {
                    let ey = cy * 2.6;
                    let podLeft = Math.sqrt((cx + 4.5 * cl.scale) * (cx + 4.5 * cl.scale) + (ey + 2) * (ey + 2));
                    let podRight = Math.sqrt((cx - 4.5 * cl.scale) * (cx - 4.5 * cl.scale) + (ey + 2) * (ey + 2));
                    if (cy < 0 && (podLeft < 7 * cl.scale || podRight < 6 * cl.scale)) isPixelInCloud = true;
                }

                if (isPixelInCloud) {
                    let idx = y * V_WIDTH + x;

                    let aboveInCloud = false;
                    let checkY = y - 1;
                    if (checkY >= 0) {
                        let acx = x - Math.floor(cl.x);
                        let acy = checkY - Math.floor(cl.y);
                        if (cl.shapeType === 0) {
                            let aabx = Math.abs(acx);
                            if ((acy === -1 && aabx < sw * 1.3) || (acy === -2 && aabx < sw * 0.8) || (acy === -3 && aabx < sw * 0.4)) aboveInCloud = true;
                        } else if (cl.shapeType === 1) {
                            let ast = Math.sqrt((acx - sw * 0.25) * (acx - sw * 0.25) + (acy * 2.2) * (acy * 2.2));
                            if (acy < 0 && ast < sw * 0.9) aboveInCloud = true;
                        } else if (cl.shapeType === 2) {
                            let aey = acy * 2.6;
                            let apl = Math.sqrt((acx + 4.5 * cl.scale) * (acx + 4.5 * cl.scale) + (aey + 2) * (aey + 2));
                            let apr = Math.sqrt((acx - 4.5 * cl.scale) * (acx - 4.5 * cl.scale) + (aey + 2) * (aey + 2));
                            if (acy < 0 && (apl < 7 * cl.scale || apr < 6 * cl.scale)) aboveInCloud = true;
                        }
                    }

                    if (!aboveInCloud) {
                        frameR[idx] = cBuffer[48];
                        frameG[idx] = cBuffer[49];
                        frameB[idx] = cBuffer[50];
                    } else {
                        frameR[idx] = cBuffer[51];
                        frameG[idx] = cBuffer[52];
                        frameB[idx] = cBuffer[53];
                    }
                    break;
                }
            }
        }
    }

    // 2. Render Grass Blades with Wind Sway
    for (let i = 0; i < grassClumps.length; i++) {
        const clump = grassClumps[i];
        const baseX = Math.floor(clump.x);
        const baseY = clump.y;

        let baseR = cBuffer[12],
            baseG = cBuffer[13],
            baseB = cBuffer[14];
        let tipR = cBuffer[15],
            tipG = cBuffer[16],
            tipB = cBuffer[17];

        if (clump.shade === 2) {
            baseR = cBuffer[15];
            baseG = cBuffer[16];
            baseB = cBuffer[17];
            tipR = cBuffer[18];
            tipG = cBuffer[19];
            tipB = cBuffer[20];
        } else if (clump.shade === 0) {
            baseR = cBuffer[9];
            baseG = cBuffer[10];
            baseB = cBuffer[11];
            tipR = cBuffer[12];
            tipG = cBuffer[13];
            tipB = cBuffer[14];
        }

        let windOffset = 0;
        if (clump.catchesWind) {
            let gustWave = Math.sin(clump.x * 0.04 + clump.y * 0.02 + time * 2.2 + clump.phase);
            let breeze = Math.cos(time * 1.1 + clump.phase * 0.5);
            windOffset = (gustWave * 1.8 + breeze * 1.0) * (0.4 + clump.depth * 0.8);
        }

        for (let h = 0; h < clump.height; h++) {
            let progress = h / clump.height;
            let currentY = baseY - h;

            if (currentY < 0 || currentY >= V_HEIGHT) continue;

            let swayX = Math.round(Math.pow(progress, 1.6) * windOffset);

            let span = Math.max(1, Math.round(clump.width * (1 - progress * 0.5)));
            let r = baseR * (1 - progress) + tipR * progress;
            let g = baseG * (1 - progress) + tipG * progress;
            let b = baseB * (1 - progress) + tipB * progress;

            for (let w = 0; w < span; w++) {
                let px = baseX + swayX + w - Math.floor(span / 2);
                if (px >= 0 && px < V_WIDTH) {
                    let pIdx = currentY * V_WIDTH + px;
                    frameR[pIdx] = r;
                    frameG[pIdx] = g;
                    frameB[pIdx] = b;
                }
            }
        }
    }

    // 3. Render Wildflowers with Leafy Stems & 3/4 Star/Cup Blossoms
    for (let i = 0; i < flowers.length; i++) {
        const flower = flowers[i];
        const baseX = Math.floor(flower.x);
        const baseY = flower.y;

        if (baseX < 0 || baseX >= V_WIDTH || baseY < 0 || baseY >= V_HEIGHT) continue;

        let gustWave = Math.sin(flower.x * 0.04 + flower.y * 0.02 + time * 2.2 + flower.phase);
        let breeze = Math.cos(time * 1.1 + flower.phase * 0.5);
        let flowerWind = (gustWave * 1.8 + breeze * 1.0) * (0.4 + flower.depth * 0.8);

        let pMain = 30 + flower.type * 6;
        let pCore = pMain + 3;

        if (flower.depth < 0.2) {
            let idx = baseY * V_WIDTH + baseX;
            frameR[idx] = cBuffer[pMain];
            frameG[idx] = cBuffer[pMain + 1];
            frameB[idx] = cBuffer[pMain + 2];
        } else if (flower.depth < 0.5) {
            let stemH = 2 + Math.floor(flower.depth * 4);
            for (let h = 0; h < stemH; h++) {
                let progress = h / stemH;
                let sy = baseY - h;
                let archX = Math.round(flower.stemCurve * progress) + Math.round(Math.pow(progress, 1.6) * flowerWind);
                let px = baseX + archX;
                if (sy >= 0 && sy < V_HEIGHT && px >= 0 && px < V_WIDTH) {
                    let sIdx = sy * V_WIDTH + px;
                    frameR[sIdx] = cBuffer[12] * (1 - progress) + cBuffer[15] * progress;
                    frameG[sIdx] = cBuffer[13] * (1 - progress) + cBuffer[16] * progress;
                    frameB[sIdx] = cBuffer[14] * (1 - progress) + cBuffer[17] * progress;
                }
            }
            let topSway = Math.round(flowerWind) + Math.round(flower.stemCurve);
            let headY = baseY - stemH;
            let headX = baseX + topSway;

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    let targetX = headX + dx;
                    let targetY = headY + dy;
                    if (targetX >= 0 && targetX < V_WIDTH && targetY >= 0 && targetY < V_HEIGHT) {
                        let idx = targetY * V_WIDTH + targetX;
                        if (dx === 0 && dy === 0) {
                            frameR[idx] = cBuffer[pCore];
                            frameG[idx] = cBuffer[pCore + 1];
                            frameB[idx] = cBuffer[pCore + 2];
                        } else {
                            frameR[idx] = cBuffer[pMain];
                            frameG[idx] = cBuffer[pMain + 1];
                            frameB[idx] = cBuffer[pMain + 2];
                        }
                    }
                }
            }
        } else {
            let maxGrassScale = 2 + Math.floor(flower.depth * flower.depth * 14);
            let stemH = Math.floor(maxGrassScale * 0.65);

            for (let h = 0; h < stemH; h++) {
                let progress = h / stemH;
                let sy = baseY - h;
                let archX = Math.round(flower.stemCurve * progress * 2.0) + Math.round(Math.pow(progress, 1.6) * flowerWind);

                let px = baseX + archX;
                if (sy >= 0 && sy < V_HEIGHT && px >= 0 && px < V_WIDTH) {
                    let sIdx = sy * V_WIDTH + px;
                    frameR[sIdx] = cBuffer[12] * (1 - progress) + cBuffer[15] * progress;
                    frameG[sIdx] = cBuffer[13] * (1 - progress) + cBuffer[16] * progress;
                    frameB[sIdx] = cBuffer[14] * (1 - progress) + cBuffer[17] * progress;

                    if (h === Math.floor(stemH * 0.4) && px + 1 < V_WIDTH) {
                        let leafIdx = sy * V_WIDTH + px + 1;
                        frameR[leafIdx] = cBuffer[15];
                        frameG[leafIdx] = cBuffer[16];
                        frameB[leafIdx] = cBuffer[17];
                    }
                }
            }

            let topSway = Math.round(flowerWind) + Math.round(flower.stemCurve * 2.0);
            let headY = baseY - stemH;
            let headX = baseX + topSway;

            let pattern = [
                [0, 1, 0, 0, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 2, 2, 1, 1],
                [0, 1, 2, 2, 1, 0],
                [0, 0, 1, 1, 0, 0],
                [0, 0, 3, 3, 0, 0]
            ];

            let tiltShift = Math.round(flowerWind * 0.5);

            for (let py = 0; py < 6; py++) {
                let rowProgress = (5 - py) / 5.0;
                let dynamicTiltX = Math.round(tiltShift * rowProgress);

                for (let px = 0; px < 6; px++) {
                    let val = pattern[py][px];
                    if (val > 0) {
                        let targetX = headX + (px - 3) + dynamicTiltX;
                        let targetY = headY + (py - 5);

                        if (targetX >= 0 && targetX < V_WIDTH && targetY >= 0 && targetY < V_HEIGHT) {
                            let idx = targetY * V_WIDTH + targetX;
                            if (val === 2) {
                                frameR[idx] = cBuffer[pCore];
                                frameG[idx] = cBuffer[pCore + 1];
                                frameB[idx] = cBuffer[pCore + 2];
                            } else if (val === 3) {
                                frameR[idx] = cBuffer[15];
                                frameG[idx] = cBuffer[16];
                                frameB[idx] = cBuffer[17];
                            } else {
                                frameR[idx] = cBuffer[pMain];
                                frameG[idx] = cBuffer[pMain + 1];
                                frameB[idx] = cBuffer[pMain + 2];
                            }
                        }
                    }
                }
            }
        }
    }

    // 4. Retro Dither & Palette Quantization
    for (let y = 0; y < V_HEIGHT; y++) {
        for (let x = 0; x < V_WIDTH; x++) {
            const idx = (y * V_WIDTH + x) * 4;
            const pIdx = y * V_WIDTH + x;

            const isDitherTile = (x + y) % 2 === 0;
            const ditherOffset = isDitherTile ? 6 : -6;

            let finalR = Math.min(255, Math.max(0, frameR[pIdx] + ditherOffset));
            let finalG = Math.min(255, Math.max(0, frameG[pIdx] + ditherOffset));
            let finalB = Math.min(255, Math.max(0, frameB[pIdx] + ditherOffset));

            data[idx] = Math.round(finalR / 16) * 16;
            data[idx + 1] = Math.round(finalG / 16) * 16;
            data[idx + 2] = Math.round(finalB / 16) * 16;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

function gameLoop(now) {
    let delta = now - lastTime;
    lastTime = now;

    if (delta > 250) delta = 250;
    accumulator += delta;

    let updated = false;
    while (accumulator >= FRAME_TIME) {
        updateSimulation();
        accumulator -= FRAME_TIME;
        updated = true;
    }

    if (updated) {
        renderFrame();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame((now) => {
    lastTime = now;
    requestAnimationFrame(gameLoop);
});

// --- 3. INTERACTIVE CLICK-TO-HIDE FOCUS CONTROLS ---
const overlay = document.getElementById('overlay');
const hint = document.getElementById('hint');

function toggleFocus() {
    overlay.classList.toggle('hidden');
    hint.classList.toggle('hidden');
}

canvas.addEventListener('click', toggleFocus);

overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        toggleFocus();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Escape' || e.code === 'KeyH') {
        toggleFocus();
    }
});
// Automatically update copyright year
document.getElementById('current-year').innerText = new Date().getFullYear();