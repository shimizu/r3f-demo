export const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition; // ライト計算用の位置


    attribute vec3 color;
    varying vec3 vColor;

    uniform float displacementScale;

    void main() {
        vUv = uv;

        //マテリアルがカラーを持っている場合はflagmentshaderに渡す
        vColor = color;

        // 頂点の高さを適用
        vec3 displacedPosition = position + normal;
        vPosition = displacedPosition;
        vNormal = normalMatrix * normal; // 法線を更新

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    }
`

export const fragmentShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vColor;

    uniform float time;
    uniform vec3 lightPosition;  // ライトの位置
    uniform vec3 lightColor;     // ライトの色
    uniform vec3 ambientColor;   // 環境光の色
    uniform sampler2D colorMap; // カラーマップ
    uniform sampler2D normalMap; // 法線マップ
    uniform float normalScale;   // 法線マップの強度

    uniform sampler2D splatMap;


    void main() {
        //モデルのカラーを使う
        //vec4 baseColor = vec4(vColor, 1.0);

        //テクスチャ―のカラーを使う
        vec3 baseColor = texture2D(colorMap, vUv).rgb;


        //一旦真っ白にする
        //vec4 baseColor = vec4(0.9, 0.5, 0.1, 1.0); //glbのカラーを取得したい

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
        float splatValue = texture2D(splatMap, vUv).b;
        if (splatValue > 0.5) {
            finalColor.rgb = vec3(0.0, 0.0, 1.0);
        }



        gl_FragColor = vec4(finalColor, 1.0);
    }
`