export const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition; // ライト計算用の位置

    uniform sampler2D heightMap;
    uniform float displacementScale;

    void main() {
        vUv = uv;

        // Height Map から高さを取得
        float height = texture2D(heightMap, vUv).r * displacementScale * 0.5;
        // 頂点の高さを適用
        vec3 displacedPosition = position + normal * height;
        vPosition = displacedPosition;
        vNormal = normalMatrix * normal; // 法線を更新


        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
`

export const fragmentShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    uniform float time;
    uniform sampler2D colorMap;
    uniform vec3 lightPosition;  // ライトの位置
    uniform vec3 lightColor;     // ライトの色
    uniform vec3 ambientColor;   // 環境光の色
    uniform sampler2D normalMap; // 法線マップ
    uniform float normalScale;   // 法線マップの強度

    uniform sampler2D splatMap0;
    uniform sampler2D splatMap1;
    uniform sampler2D splatMap2;
    uniform sampler2D splatMap3;
    uniform sampler2D splatMap4;


    uniform sampler2D rockTexture;
    uniform sampler2D grassTexture;

    uniform vec2 textureRepeat; 



    // 0〜255の範囲を0〜1に正規化する関数
    float normalize255(float value) {
        return value / 255.0;
    }


    // 2Dランダムベクトル生成
    vec2 random2(vec2 st) {
        st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
    }

    float perlinNoise(vec2 vUv) {
        vec2 i = floor(vUv);  // 格子の位置
        vec2 f = fract(vUv);  // フラクション部分
        vec2 u = f * f * (3.0 - 2.0 * f);  // スムーズステップ（補間用）

        // 4つのコーナーの勾配ベクトルを取得
        vec2 g00 = random2(i + vec2(0.0, 0.0));
        vec2 g10 = random2(i + vec2(1.0, 0.0));
        vec2 g01 = random2(i + vec2(0.0, 1.0));
        vec2 g11 = random2(i + vec2(1.0, 1.0));

        // 各コーナーからの距離
        vec2 d00 = f - vec2(0.0, 0.0);
        vec2 d10 = f - vec2(1.0, 0.0);
        vec2 d01 = f - vec2(0.0, 1.0);
        vec2 d11 = f - vec2(1.0, 1.0);

        // 各コーナーでのドット積を計算
        float n00 = dot(g00, d00);
        float n10 = dot(g10, d10);
        float n01 = dot(g01, d01);
        float n11 = dot(g11, d11);

        // 補間
        return mix(mix(n00, n10, u.x), mix(n01, n11, u.y), u.y);
    }

    // FBM関数
    float fbm(vec2 vUv) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;

        for (int i = 0; i < 5; i++) {
            value += amplitude * perlinNoise(vUv * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
        }

        return value;
    }


    void main() {
        //vec4 baseColor = texture2D(colorMap, vUv);
        vec4 baseColor = vec4(1.0, 1.0, 1.0, 1.0);

        // ポジションとUVの微分を取得
        vec3 dp1 = dFdx(vPosition);
        vec3 dp2 = dFdy(vPosition);
        vec2 duv1 = dFdx(vUv);
        vec2 duv2 = dFdy(vUv);


        // TBNマトリックスを計算
        vec3 N = normalize(vNormal);
        vec3 T = normalize(dp1 * duv2.y - dp2 * duv1.y);
        vec3 B = normalize(dp1 * duv2.x - dp2 * duv1.x);
        mat3 TBN = mat3(T, B, N);

        // 法線マップをサンプリングし、[-1, 1]の範囲に変換
        vec3 normalMapSample = texture2D(normalMap, vUv).rgb;
        normalMapSample = normalize(normalMapSample * 2.0 - 1.0);
        normalMapSample.xy *= normalScale;
        normalMapSample = normalize(normalMapSample);

        // 新しい法線を計算
        vec3 normal = normalize(TBN * normalMapSample);

        // ライト方向の計算
        vec3 lightDir = normalize(lightPosition - vPosition);

        // 環境光の計算
        vec3 ambient = ambientColor * baseColor.rgb;

        // 拡散光の計算 (Lambertian)
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * lightColor * baseColor.rgb * 0.1;

        // 鏡面反射光の計算 (Phong)
        vec3 viewDir = normalize(-vPosition);  // カメラの方向
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);  // 鏡面反射の強度
        vec3 specular = spec * lightColor * 0.1;

        // ライトとテクスチャによる最終カラー
        vec3 finalColor = ambient + diffuse + specular;


        // Splat Mapによるテクスチャ切り替え
        float splat1Value = texture2D(splatMap1, vUv).r;
        if (splat1Value > 0.1) {
            //finalColor.rgb += vec3(0.25, 0.05, 0);
        }

        // Splat Mapによるテクスチャ切り替え
        float splat2Value = texture2D(splatMap2, vUv).r;
        if (splat2Value > 0.1) {
           // finalColor.rgb -= vec3(0.1, 0.15, 0.15);
        }


        // Splat Mapによるテクスチャ切り替え
        float splat4Value = texture2D(splatMap4, vUv).r;
        if (splat4Value > 0.1) {
            //finalColor.rgb -= vec3(0.8, 0.1, 0.8);
    
            //float noise = fract(sin(dot(vUv * 50.0, vec2(12.9898, 78.233))) * 43758.5453);
            //finalColor.rgb += vec3(noise * 0.0, noise * 0.2, noise * 0.0); // 簡易的なノイズ追加
        }



        //finalColor.rgb += vec3(perlinNoise(vUv) * 0.5);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`