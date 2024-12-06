// 지도 초기화
L.mapbox.accessToken = 'pk.eyJ1IjoibGN3MjAwMSIsImEiOiJjbTRjOHZzN2IwN3JhMmpxcXF5eHN4YmV2In0.Uzc4pqLXYiT6RBLqkvz29w';
var map = L.mapbox.map('map', null, { zoomControl: false })
    .setView([37.5088, 127.045], 14)
    .addLayer(L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v11'));

var featureGroup = L.featureGroup().addTo(map);
var isRoadHovered = false; // 도로 위에 마우스가 있는지 여부 플래그

// 모달창 생성 함수
function showModal(regionName) {
    const modalHtml = `
        <div id="modal" style="
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.5); z-index: 1000;
        ">
            <p>이 구역에 통행료를 부과하겠습니까?</p>
            <p><strong>선택된 구역:</strong> ${regionName}</p>
            <button onclick="document.getElementById('modal').remove()">닫기</button>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 구역 처리
const geoJsonPath = './data/divide.geojson';
fetch(geoJsonPath)
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch GeoJSON');
        return response.json();
    })
    .then(geoJson => {
        L.geoJson(geoJson, {
            style: feature => ({
                color: 'blue',
                fillColor: 'rgba(0, 0, 255, 0.3)',
                weight: 2
            }),
            onEachFeature: (feature, layer) => {
                const regionName = feature.properties.nhood || 'Unknown';

                // 마우스 이벤트
                layer.on('mouseover', function () {
                    if (isRoadHovered) return; // 도로 위에 마우스가 있는 경우 툴팁 표시하지 않음

                    layer.setStyle({ fillColor: 'rgba(0, 0, 255, 0.7)' });
                    layer.bindTooltip(`<strong>${regionName}</strong>`, { sticky: true }).openTooltip();
                }).on('mouseout', function () {
                    layer.setStyle({ fillColor: 'rgba(0, 0, 255, 0.3)' });
                    layer.unbindTooltip();
                }).on('click', function () {
                    // 클릭 시 모달창 표시
                    showModal(regionName);
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// 도로 처리
const dataPath = './data/gangnam_edge.csv';
fetch(dataPath)
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
    })
    .then(text => {
        const data = d3.csvParse(text);

        data.forEach((row, index) => {
            if (!row.geometry || !row.geometry.startsWith("LINESTRING")) return;

            var geometry = row.geometry.slice(
                row.geometry.indexOf('(') + 1,
                row.geometry.lastIndexOf(')')
            );
            var coordinates = geometry.split(', ').map(coord => {
                var [lng, lat] = coord.trim().split(/\s+/).map(parseFloat);
                return [lat, lng];
            });

            var roadName = row.ROAD_NAME || '도로명없음';
            var roadId = row.LINK_ID;

            var polyline = new L.polyline(coordinates, {
                color: 'red',
                weight: 3,
                customData: {
                    road_name: roadName,
                    road_id: roadId
                }
            }).bindPopup(`도로명: ${roadName}<br>LINK_ID: ${roadId}`)
                .on('mouseover', function (e) {
                    isRoadHovered = true; // 도로 위에 마우스가 있음을 표시
                    this.openPopup();
                    e.target.setStyle({ color: 'green', weight: 10 });
                }).on('mouseout', function (e) {
                    isRoadHovered = false; // 도로에서 마우스가 벗어남
                    this.closePopup();
                    e.target.setStyle({ color: 'red', weight: 3 });
                });

            featureGroup.addLayer(polyline);
        });
    })
    .catch(error => console.error('Error fetching CSV file:', error));

