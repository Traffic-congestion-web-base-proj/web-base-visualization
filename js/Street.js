var featureGroup = L.featureGroup().addTo(map);
var isRoadHovered = false; // 도로 위에 마우스가 있는지 여부 플래그

// 도로 및 밀도 데이터 경로
const edgePath = "./data/gangnam_edge.csv";
let densityPath = "./data/data_feeBefore.csv"; // 초기 밀도 데이터 경로
let previousDensityMap = new Map(); // 통행료 부과 전 밀도 저장

// 슬라이더 요소
const timeSlider = document.getElementById("timeSlider");
const timeLabel = document.getElementById("timeLabel");

function calculateWeight(zoomLevel) {
  return Math.max(1, (zoomLevel - 14) * 3); // 최소값 1, 줌 레벨에 따라 증가
}

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
function loadDensityData(densityPath, isAfterFee = false) {
  console.log("loadDensityData");
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

        updateRoads(filteredDensityData, isAfterFee);
      });

      // 초기 렌더링
      timeSlider.dispatchEvent(new Event("input"));
    })
    .catch((error) => console.error("Error fetching density data:", error));
}

// 도로 데이터 업데이트 함수
function updateRoads(filteredDensityData, isAfterFee = false) {
  console.log("updateRoads");

  // 밀도 데이터를 LINK_ID로 매핑
  const densityMap = new Map();
  filteredDensityData.forEach((row) => {
    const linkId = row.id.toString().trim();
    const density = parseFloat(row.density);
    if (!isNaN(density)) {
      densityMap.set(linkId, density);
    }
  });

  // 통행료 부과 전 밀도 저장
  if (!isAfterFee) {
    previousDensityMap = new Map(densityMap); // 복사 저장
  }

  // 기존 레이어를 업데이트하거나 새로 추가
  featureGroup.eachLayer((layer) => {
    if (layer instanceof L.Polyline) {
      const roadId = layer.options.customData.road_id;
      const previousDensity = previousDensityMap.get(roadId) || 0;
      const currentDensity = densityMap.get(roadId) || 0;

      const color = currentDensity < 1 ? "green" : currentDensity <= 100 ? "orange" : "red";

      // 레이어 스타일 업데이트
      layer.setStyle({
        color: color,
      });

      // 팝업 업데이트
      layer.bindPopup(
        `도로명: ${layer.options.customData.road_name}<br>
        LINK_ID: ${roadId}<br>
        통행료 부과 전 밀도: ${previousDensity.toFixed(2)}<br>
        ${isAfterFee ? `통행료 부과 후 밀도: ${currentDensity.toFixed(2)}` : ""}`
      );

      // 기존 레이어 처리 완료 표시
      densityMap.delete(roadId);
    }
  });

  // 새로 추가해야 할 레이어만 처리
  fetch(edgePath)
    .then((res) => res.text())
    .then((edgeText) => {
      const edgeData = d3.csvParse(edgeText);

      edgeData.forEach((row) => {
        if (!row.geometry || !row.geometry.startsWith("LINESTRING")) return;

        const geometry = row.geometry.slice(row.geometry.indexOf("(") + 1, row.geometry.lastIndexOf(")"));
        const coordinates = geometry.split(", ").map((coord) => {
          const [lng, lat] = coord.trim().split(/\s+/).map(parseFloat);
          return [lat, lng];
        });

        const roadName = row.ROAD_NAME || "도로명없음";
        const roadId = row.LINK_ID.trim();

        if (!densityMap.has(roadId)) return;

        const previousDensity = previousDensityMap.get(roadId) || 0;
        const currentDensity = densityMap.get(roadId) || 0;

        const color = currentDensity < 1 ? "green" : currentDensity <= 100 ? "orange" : "red";

        const polyline = new L.polyline(coordinates, {
          color: color,
          weight: calculateWeight(map.getZoom()),
          customData: {
            road_name: roadName,
            road_id: roadId,
            previous_density: previousDensity,
            current_density: isAfterFee ? currentDensity : null,
          },
        })
          .bindPopup(
            `도로명: ${roadName}<br>
            LINK_ID: ${roadId}<br>
            통행료 부과 전 밀도: ${previousDensity.toFixed(2)}<br>
            ${isAfterFee ? `통행료 부과 후 밀도: ${currentDensity.toFixed(2)}` : ""}`
          )
          .on("mouseover", function () {
            this.openPopup();
          })
          .on("mouseout", function () {
            this.closePopup();
          });

        polyline.on("click", function (e) {
          const { road_id } = this.options.customData;
          showGraphs(road_id); // 그래프를 표시하는 함수 호출
        });

        featureGroup.addLayer(polyline);
      });

      map.on("zoomend", () => {
        const currentZoom = map.getZoom();

        featureGroup.eachLayer((layer) => {
          if (layer instanceof L.Polyline) {
            const newWeight = calculateWeight(currentZoom);

            if (layer.options.weight !== newWeight) {
              layer.setStyle({
                weight: newWeight,
              });
            }
          }
        });
      });
    })
    .catch((error) => console.error("Error fetching edge data:", error));
}

// 초기 밀도 데이터 로드
loadDensityData(densityPath);

// 밀도 데이터 변경 함수 (초기화 및 구역 변경에 사용)
function updateRoadsWithNewData(newDensityPath) {
  loadDensityData(newDensityPath, true); // 통행료 부과 후 데이터 로드
}

export { updateRoadsWithNewData };
