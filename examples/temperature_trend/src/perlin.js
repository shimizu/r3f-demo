// グラデーションベクトルを生成するヘルパー関数
function grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

// 補間関数
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

// 線形補間
function lerp(t, a, b) {
    return a + t * (b - a);
}

// 単一のパーリンノイズ値を生成する関数
function perlin(x, y) {
    const permutation = [...Array(256).keys()].sort(() => Math.random() - 0.5);
    const p = permutation.concat(permutation); // 繰り返し用に配列を2倍に

    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = fade(xf);
    const v = fade(yf);

    const aa = p[p[xi] + yi];
    const ab = p[p[xi] + yi + 1];
    const ba = p[p[xi + 1] + yi];
    const bb = p[p[xi + 1] + yi + 1];

    const x1 = lerp(u, grad(aa, xf, yf), grad(ba, xf - 1, yf));
    const x2 = lerp(u, grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1));

    return lerp(v, x1, x2);
}

// 2次元のパーリンノイズ配列を生成する関数
export function generatePerlinNoise(width, height, scale = 0.1) {
    const noiseArray = [];

    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // スケールを調整してノイズ値を取得
            let value = perlin(x * scale, y * scale);
            // 値を0から1の範囲に正規化
            value = (value + 1) / 2;
            row.push(value);
        }
        noiseArray.push(row);
    }

    return noiseArray;
}
