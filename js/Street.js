var featureGroup = L.featureGroup().addTo(map);
var isRoadHovered = false; // 도로 위에 마우스가 있는지 여부 플래그

// 도로 및 밀도 데이터 경로
const edgePath = "./data/gangnam_edge.csv";
let previousDensityPath = "./data/data_feeBefore.csv"; // 초기 밀도 데이터 경로

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
function loadDensityData(previousDensityPath, isAfterFee = false) {
  console.log("loadDensityData");
  fetch(previousDensityPath)
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

function updateRoads(filteredDensityData, isAfterFee = false) {
  console.log("updateRoads");

  // 밀도 데이터를 LINK_ID로 매핑
  const densityMap = new Map();
  filteredDensityData.forEach((row) => {
    const linkId = row.id.toString().trim();
    const density = parseFloat(row.density);
    const speed = parseFloat(row.speed);
    const entered = parseInt(row.entered, 10);
    if (!isNaN(density)) {
      densityMap.set(linkId, { density, speed, entered });
    }
  });

  // 통행료 부과 전 밀도 저장
  if (!isAfterFee) {
    previousDensityMap = new Map(densityMap); // 복사 저장
  }

  // 기존 레이어를 업데이트
  featureGroup.eachLayer((layer) => {
    if (layer instanceof L.Polyline) {
      const roadId = layer.options.customData.road_id;
      const previousData = previousDensityMap.get(roadId) || { density: 0, speed: null, entered: null };
      const currentData = densityMap.get(roadId) || { density: 0, speed: null, entered: null };

      const color = currentData.density < 1 ? "green" : currentData.density <= 100 ? "orange" : "red";

      // 레이어 스타일 및 팝업 업데이트
      layer.setStyle({ color: color });
      layer.bindPopup(
        isAfterFee
          ? // 통행료 부과 후 팝업 내용
            `도로명: ${layer.options.customData.road_name}<br>
            LINK_ID: ${roadId}<br>
            혼잡도: ${currentData.density.toFixed(2)}<br>
            평균 속도: ${currentData.speed ? `${currentData.speed.toFixed(2)} km/h` : "데이터 없음"}<br>
            진입 차량 수: ${currentData.entered ? `${currentData.entered}` : "데이터 없음"}`
          : // 통행료 부과 전 팝업 내용
            `도로명: ${layer.options.customData.road_name}<br>
            LINK_ID: ${roadId}<br>
            밀도: ${previousData.density.toFixed(2)}<br>
            평균 속도: ${previousData.speed ? `${previousData.speed.toFixed(2)} km/h` : "데이터 없음"}<br>
            진입 차량 수: ${previousData.entered ? `${previousData.entered}` : "데이터 없음"}`
      );
    }
  });

  // 새로 추가할 폴리라인 처리
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

        const previousData = previousDensityMap.get(roadId) || { density: 0, speed: null, entered: null };
        const currentData = densityMap.get(roadId) || { density: 0, speed: null, entered: null };

        const color = currentData.density < 1 ? "green" : currentData.density <= 100 ? "orange" : "red";

        const polyline = new L.polyline(coordinates, {
          color: color,
          weight: calculateWeight(map.getZoom()),
          customData: {
            road_name: roadName,
            road_id: roadId,
            previous_density: previousData.density,
            current_density: isAfterFee ? currentData.density : null,
            previous_speed: previousData.speed,
            current_speed: currentData.speed,
            previous_entered: previousData.entered,
            current_entered: currentData.entered,
          },
          pane: "overlayPane", // 클릭 가능 영역
          interactive: true, // 클릭 활성화
        });
        
        // 팝업 설정
        polyline.bindPopup(
          isAfterFee
            ? `도로명: ${roadName}<br>
              LINK_ID: ${roadId}<br>
              밀도: ${currentData.density.toFixed(2)}<br>
              평균 속도: ${currentData.speed ? `${currentData.speed.toFixed(2)} km/h` : "데이터 없음"}<br>
              진입 차량 수: ${currentData.entered ? `${currentData.entered}` : "데이터 없음"}`
            : `도로명: ${roadName}<br>
              LINK_ID: ${roadId}<br>
              혼잡도: ${previousData.density.toFixed(2)}<br>
              평균 속도: ${previousData.speed ? `${previousData.speed.toFixed(2)} km/h` : "데이터 없음"}<br>
              진입 차량 수: ${previousData.entered ? `${previousData.entered}` : "데이터 없음"}`
        );
        
        // 이벤트 설정
        polyline.on("mouseover", function () {
          if (!this.isPopupOpen()) {
            this.openPopup();
          }
        });
        polyline.on("mouseout", function () {
          if (this.isPopupOpen()) {
            this.closePopup();
          }
        });
        polyline.on("click", function () {
          const { road_id } = this.options.customData;
          // CustomEvent로 roadId 전달
          const event = new CustomEvent("roadSelected", { detail: { roadId: road_id } });
          window.dispatchEvent(event);
        });
        
        // featureGroup에 추가
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


// 초기 밀도 데이터 로드
loadDensityData(previousDensityPath);

// 밀도 데이터 변경 함수 (초기화 및 구역 변경에 사용)
function updateRoadsWithNewData(newDensityPath) {
  loadDensityData(newDensityPath, true); // 통행료 부과 후 데이터 로드
}

export { updateRoadsWithNewData };
export let previousDensityMap = new Map();
