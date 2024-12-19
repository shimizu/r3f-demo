import * as THREE from "three"
import { geoMercator } from "d3-geo";


// GeoJSONデータを読み込み、メッシュを生成する関数
export async function loadGeoJSON(url, style, callback){
    const res = await fetch(url).then((res) => res.json());
    const projection = geoMercator().fitExtent([[0, 0], [30, 30]], res);
    const data = convertGeoJSONToScreenCoordinates(res, projection);
    const meshes = generateMesh({ data, fill: style.fill, stroke: style.stroke });
    callback(meshes);
};

export function convertGeoJSONToScreenCoordinates(geojson, projection) {
    // 各Geometry Typeに応じて座標を変換する再帰関数
    function projectCoordinates(geometry) {
        const type = geometry.type;
        const coords = geometry.coordinates;

        switch (type) {
            case 'Point':
                return projection(coords);

            case 'MultiPoint':
                return coords.map(coord => projection(coord));

            case 'LineString':
                return coords.map(coord => projection(coord));

            case 'MultiLineString':
                return coords.map(line => line.map(coord => projection(coord)));

            case 'Polygon':
                return coords.map(ring => ring.map(coord => projection(coord)));

            case 'MultiPolygon':
                return coords.map(polygon => polygon.map(ring => ring.map(coord => projection(coord))));

            case 'GeometryCollection':
                return {
                    type: 'GeometryCollection',
                    geometries: geometry.geometries.map(geom => projectCoordinates(geom))
                };

            default:
                throw new Error('Unsupported geometry type: ' + type);
        }
    }

    // GeoJSONのタイプに応じて処理を分岐
    if (geojson.type === 'Feature') {
        return {
            type: 'Feature',
            geometry: projectCoordinates(geojson.geometry),
            properties: geojson.properties
        };
    } else if (geojson.type === 'FeatureCollection') {
        return {
            type: 'FeatureCollection',
            features: geojson.features.map(feature => convertGeoJSONToScreenCoordinates(feature, projection))
        };
    } else if (geojson.type === 'GeometryCollection') {
        return projectCoordinates(geojson);
    } else {
        // Geometryオブジェクトの場合
        return projectCoordinates(geojson);
    }
}

// ポリゴンからExtrudeGeometryを返す関数
export const createExtrudedGeometry = (coordinates, depth) => {
    const shape = new THREE.Shape();

    // ポリゴンの座標からShapeを作成
    coordinates[0].forEach((point, index) => {
        const [x, y] = point.map((coord, idx) => coord);
        if (index === 0) {
            // 最初の点のみmoveTo
            shape.moveTo(x, y);
        } else if (index + 1 === coordinates[0].length) {
            // 最後の点のみclosePathで閉じる
            shape.closePath();
        } else {
            // それ以外はlineTo
            shape.lineTo(x, y);
        }
    });
    return new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: depth,
        bevelEnabled: false,
    });
};

//メッシュを生成する
export function generateMesh({ data, fill, stroke } = props) {
    const meshes = []

    data.features
        .filter(f => f.geometry)
        .forEach((f) => {

            //ExtrudeGeometryをdataを元に生成
            const geometry = createExtrudedGeometry(f.geometry, 0.01);

            // 90度回転させる
            const matrix = new THREE.Matrix4().makeRotationX(Math.PI / -2);
            geometry.applyMatrix4(matrix)

            // 4. マテリアルとメッシュの作成
            const material = new THREE.MeshBasicMaterial({ color: fill });
            const mesh = new THREE.Mesh(geometry, material);

            // フィーチャのプロパティをメッシュに紐付け
            mesh.userData = { properties: f.properties };

            // 外枠のエッジ用のジオメトリを生成
            const edgesGeometry = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: stroke }); // 外枠の色
            const edges = new THREE.LineSegments(edgesGeometry, lineMaterial);

            // 作成したメッシュを配列に追加
            meshes.push({ mesh, edges, properties: f.properties });
        })


    return meshes

}
