var featureGroup = L.featureGroup().addTo(map);
var isRoadHovered = false; // 도로 위에 마우스가 있는지 여부 플래그

// 도로 및 밀도 데이터 경로
const edgePath = "./data/gangnam_edge.csv";
const densityPath = "./data/data_feeBefore.csv";

// 두 파일을 비동기로 로드
Promise.all([
  fetch(edgePath).then((res) => res.text()),
  fetch(densityPath).then((res) => res.text()),
])
  .then(([edgeText, densityText]) => {
    const edgeData = d3.csvParse(edgeText);
    const densityData = d3.csvParse(densityText);

    // interval_begin = 0.0, interval_end = 1800.0 데이터 필터링
    const filteredDensityData = densityData.filter(
      (row) =>
        parseFloat(row.interval_begin) === 63000.0 &&
        parseFloat(row.interval_end) === 64800.0
    );

    // 필터링된 밀도 데이터 확인 (디버깅용)
    console.log("Filtered Density Data:", filteredDensityData);

    // 밀도 데이터를 LINK_ID로 매핑
    const densityMap = new Map();
    filteredDensityData.forEach((row) => {
      const linkId = row.id.toString().trim(); // ID를 문자열로 변환하고 공백 제거
      const density = parseFloat(row.density);
      if (!isNaN(density)) {
        densityMap.set(linkId, density);
      }
    });

    // 도로 데이터 시각화
    edgeData.forEach((row) => {
      if (!row.geometry || !row.geometry.startsWith("LINESTRING")) return;

      const geometry = row.geometry.slice(row.geometry.indexOf("(") + 1, row.geometry.lastIndexOf(")"));
      const coordinates = geometry.split(", ").map((coord) => {
        const [lng, lat] = coord.trim().split(/\s+/).map(parseFloat);
        return [lat, lng];
      });

      const roadName = row.ROAD_NAME || "도로명없음";
      const roadId = row.LINK_ID.trim(); // LINK_ID를 문자열로 처리

      // 밀도 값을 가져옴
      const density = densityMap.get(roadId) || 0; // 기본값 0
      const color = density < 1 ? "green" : density <= 100 ? "orange" : "red";

      // 밀도와 도로 ID 확인 (디버깅용)
      console.log(`LINK_ID: ${roadId}, Density: ${density}, Color: ${color}`);

      const polyline = new L.polyline(coordinates, {
        color: color,
        weight: 3,
        customData: {
          road_name: roadName,
          road_id: roadId,
          density: density,
        },
      })
        .bindPopup(
          `도로명: ${roadName}<br>LINK_ID: ${roadId}<br>밀도: ${density}`
        )
        .on("mouseover", function (e) {
          isRoadHovered = true; // 도로 위에 마우스가 있음을 표시
          this.openPopup();
          e.target.setStyle({ weight: 10 });
        })
        .on("mouseout", function (e) {
          isRoadHovered = false; // 도로에서 마우스가 벗어남
          this.closePopup();
          e.target.setStyle({ weight: 3 });
        });

      featureGroup.addLayer(polyline);
    });
  })
  .catch((error) => console.error("Error fetching CSV files:", error));
