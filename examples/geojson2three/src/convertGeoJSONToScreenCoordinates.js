function convertGeoJSONToScreenCoordinates(geojson, projection) {
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

export default convertGeoJSONToScreenCoordinates