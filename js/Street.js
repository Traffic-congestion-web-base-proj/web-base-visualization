var featureGroup = L.featureGroup().addTo(map);
var isRoadHovered = false; // 도로 위에 마우스가 있는지 여부 플래그

// 도로 및 밀도 데이터 경로
const edgePath = "./data/gangnam_edge.csv";
const densityPath = "./data/data_feeBefore.csv";

// 슬라이더 요소
const timeSlider = document.getElementById("timeSlider");
const timeLabel = document.getElementById("timeLabel");

// 초를 HH:MM 형식으로 변환하는 유틸리티 함수
function secondsToHHMM(seconds) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}`;
}

// 밀도 데이터 로드 및 슬라이더 이벤트 처리
fetch(densityPath)
  .then((res) => res.text())
  .then((densityText) => {
    const densityData = d3.csvParse(densityText);

    // 슬라이더의 최대값을 84600 (23:30)으로 설정
    timeSlider.max = 84600;

    // 슬라이더 이벤트 핸들러
    timeSlider.addEventListener("input", () => {
      const selectedTime = parseInt(timeSlider.value, 10);
      const nextTime = Math.min(selectedTime + 1800, 86400); // 30분 간격, 최대 24:00:00

      // 다음 시간이 24:00:00을 넘어가지 않도록 조정
      const adjustedNextTime = nextTime > 86400 ? 86400 : nextTime;

      // 슬라이더 라벨 업데이트
      timeLabel.textContent = `${secondsToHHMM(selectedTime)} - ${secondsToHHMM(adjustedNextTime)}`;

      // 선택된 시간대 데이터 필터링
      const filteredDensityData = densityData.filter(
        (row) => parseFloat(row.interval_begin) === selectedTime && parseFloat(row.interval_end) === adjustedNextTime
      );

      updateRoads(filteredDensityData);
    });

    // 초기 렌더링
    timeSlider.dispatchEvent(new Event("input"));
  })
  .catch((error) => console.error("Error fetching density data:", error));

// 도로 데이터 업데이트 함수
function updateRoads(filteredDensityData) {
  featureGroup.clearLayers(); // 기존 도로 제거

  fetch(edgePath)
    .then((res) => res.text())
    .then((edgeText) => {
      const edgeData = d3.csvParse(edgeText);

      // 밀도 데이터를 LINK_ID로 매핑
      const densityMap = new Map();
      filteredDensityData.forEach((row) => {
        const linkId = row.id.toString().trim();
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
        const roadId = row.LINK_ID.trim();

        // 밀도 값 가져오기
        const density = densityMap.get(roadId) || 0; // 기본값 0
        const color = density < 1 ? "green" : density <= 100 ? "orange" : "red";

        const polyline = new L.polyline(coordinates, {
          color: color,
          weight: calculateWeight(map.getZoom()),
          customData: {
            road_name: roadName,
            road_id: roadId,
            density: density,
          },
        })
          .bindPopup(`도로명: ${roadName}<br>LINK_ID: ${roadId}<br>밀도: ${density}`)
          .on("mouseover", function () {
            this.openPopup();
          })
          .on("mouseout", function () {
            this.closePopup();
          });

        featureGroup.addLayer(polyline);
      });

      map.on("zoomend", () => {
        const currentZoom = map.getZoom();
        featureGroup.eachLayer((layer) => {
          if (layer instanceof L.Polyline) {
            layer.setStyle({
              weight: calculateWeight(currentZoom),
            });
          }
        });
      });
    })
    .catch((error) => console.error("Error fetching edge data:", error));
}

function calculateWeight(zoomLevel) {
  return Math.max(1, (zoomLevel - 14) * 3);
}
//test