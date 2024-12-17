import { updateRoadsWithNewData } from "./Street.js";

const geoJsonPath = "./data/divide.geojson";
let previousdensitypath = "./data/data_feeBefore.csv"; // 초기 밀도 데이터 경로
const selectedRegions = {}; // 선택된 구역 상태 저장 객체
let geoJsonLayer; // GeoJSON 레이어 참조
let selectedRegionName = null; // 하나의 선택된 구역만 저장

// 지도에 추가된 폴리라인 관리를 위한 Feature Group
let featureGroup;

// 지도 및 FeatureGroup 초기화
window.onload = () => {
  featureGroup = L.featureGroup().addTo(map); // 지도에 추가
  initializeGeoJson(); // GeoJSON 데이터 초기화
};

// GeoJSON 데이터 초기화
function initializeGeoJson() {
  fetch(geoJsonPath)
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch GeoJSON");
      return response.json();
    })
    .then((geoJson) => {
      geoJsonLayer = L.geoJson(geoJson, {
        style: (feature) => ({
          color: "skyblue",
          fillColor: "rgba(0, 0, 255, 0.3)",
          weight: 1,
        }),
        onEachFeature: (feature, layer) => {
          const regionName = feature.properties.nhood || "Unknown";
          layer._regionName = regionName; // 레이어에 구역 이름 저장

          // 구역 스타일 초기화
          updateRegionStyle(regionName, layer);
        },
      }).addTo(map);

      // 구역 목록 초기화
      initRegionList(geoJson.features);
    })
    .catch((error) => console.error("Error loading GeoJSON:", error));
}

// 구역 목록 초기화 함수
function initRegionList(features) {
  const regionList = document.getElementById("region-list");

  features.forEach((feature) => {
    const regionName = feature.properties.nhood || "Unknown";
    const listItem = document.createElement("li");
    listItem.textContent = regionName;
    listItem.style.cursor = "pointer";
    listItem.classList.add("region-item");

    // 구역 목록 마우스 이벤트
    listItem.addEventListener("mouseover", () => {
      highlightRegion(regionName); // 구역 강조
    });

    listItem.addEventListener("mouseout", () => {
      resetHighlightRegion(regionName); // 구역 강조 해제
    });

    // 구역 목록 클릭 이벤트
    listItem.addEventListener("click", () => {
      showModal(regionName); // 모달 표시
    });

    regionList.appendChild(listItem);
  });

  // 초기화 버튼 추가
  const resetButton = document.createElement("button");
  resetButton.textContent = "초기화";
  resetButton.style.marginLeft = "20px";
  resetButton.style.cursor = "pointer";
  resetButton.classList.add("reset-button");

  resetButton.addEventListener("click", () => {
    resetRoadsToInitialState(); // 도로 데이터 초기화
  });

  // 초기화 버튼을 사이드바에 추가
  const sidebar = document.getElementById("sidebar");
  sidebar.appendChild(resetButton);

  // 접기/펼치기 버튼 추가
  const toggleButton = document.getElementById("toggle-sidebar");
  toggleButton.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const mapElement = document.getElementById("map");

    // 사이드바 상태 토글
    const isCollapsed = sidebar.classList.toggle("collapsed");
    toggleButton.textContent = isCollapsed ? "구역 목록 펼치기" : "구역 목록 접기";

    // 지도 크기 동기화
    if (isCollapsed) {
      mapElement.style.top = "0";
      mapElement.style.height = "100%";
    } else {
      mapElement.style.top = "60px";
      mapElement.style.height = "calc(100% - 60px)";
    }
  });
}

// 초기화 함수
function resetRoadsToInitialState() {
  if (!featureGroup) {
    console.error("FeatureGroup이 초기화되지 않았습니다.");
    return;
  }

  // 모든 기존 레이어 제거
  featureGroup.clearLayers();

  // 초기 밀도 경로로 복구
  updateRoadsWithNewData("./data/data_feeBefore.csv",false);

  // 선택된 구역 초기화
  Object.keys(selectedRegions).forEach((region) => {
    delete selectedRegions[region]; // 선택된 구역 상태 초기화
  });

  // 모든 구역 스타일 초기화
  geoJsonLayer.eachLayer((layer) => {
    updateRegionStyle(layer._regionName, layer);
  });

  // regionName을 null로 설정하는 이벤트 디스패치
  const event = new CustomEvent("regionSelected", { detail: { regionName: null } });
  window.dispatchEvent(event);

  // regionName이 null이더라도 roadId가 설정되어 있다면 그래프 초기화
  if (currentRoadId) {
    showGraphs(currentRoadId, null);
  }

  // 팝업 초기화: "통행료 부과 전" 상태로 복원
  featureGroup.eachLayer((layer) => {
    if (layer instanceof L.Polyline) {
      const roadId = layer.options.customData.road_id;
      const previousDensity = previousDensityMap.get(roadId) || 0;

      // 팝업 내용을 "통행료 부과 전" 데이터로 설정
      layer.bindPopup(
        `도로명: ${layer.options.customData.road_name}<br>
        LINK_ID: ${roadId}<br>
        혼잡도: ${previousDensity.toFixed(2)}
        평균 속도: ${previousData.speed ? `${previousData.speed.toFixed(2)} km/h` : "데이터 없음"}<br>
        진입 차량 수: ${previousData.entered ? `${previousData.entered}` : "데이터 없음"}`
      );
    }
  });

  alert("도로 상태가 초기화되었습니다.");
}

// 모달 창 표시 함수

// 모달 창 표시 함수
function showModal(regionName) {
  if (selectedRegionName === regionName) {
    // 이미 선택된 구역을 클릭한 경우 아무런 동작을 하지 않음
    return;
  }
  const dataFileName = `data_${regionName.replace(/\s/g, "")}.csv`;
  const dataFilePath = `./data/${dataFileName}`;

  const modalHtml = `
    <div id="modal" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      z-index: 1000;
    ">
      <p>이 구역에 통행료를 부과하시겠습니까?</p>
      <p><strong>선택된 구역:</strong> ${regionName}</p>
      <button id="modal-yes" style="margin-right: 10px;">Yes</button>
      <button id="modal-no">No</button>
    </div>
    <div id="modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 999;
    "></div>`;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  document.getElementById("modal-yes").addEventListener("click", () => {
    // 이전에 선택된 구역이 있으면 초기화
    if (selectedRegionName) {
      geoJsonLayer.eachLayer((layer) => {
        if (layer._regionName === selectedRegionName) {
          updateRegionStyle(selectedRegionName, layer, false); // 이전 선택 구역 스타일 초기화
        }
      });
    }

    // 새 구역 선택 및 스타일 적용
    selectedRegionName = regionName;
    geoJsonLayer.eachLayer((layer) => {
      if (layer._regionName === regionName) {
        updateRegionStyle(regionName, layer, true); // 새 선택 구역 스타일 적용
      }
    });

    // 데이터 업데이트
    updateRoadsWithNewData(dataFilePath);
    alert(`${regionName} 구역에 통행료를 부과했습니다.`);

    // CustomEvent로 regionName 전달
    const event = new CustomEvent("regionSelected", { detail: { regionName } });
    window.dispatchEvent(event);

    closeModal();
  });

  document.getElementById("modal-no").addEventListener("click", () => {
    closeModal();
  });
}

// 모달 창 닫기 함수
function closeModal() {
  const modal = document.getElementById("modal");
  const overlay = document.getElementById("modal-overlay");
  if (modal) modal.remove();
  if (overlay) overlay.remove();
}

// 구역 강조 표시 함수
function highlightRegion(regionName) {
  geoJsonLayer.eachLayer((layer) => {
    if (layer._regionName === regionName && selectedRegionName !== regionName) {
      layer.setStyle({ fillColor: "rgba(0, 255, 0, 0.5)" });
      layer.bringToFront();
    }
  });
}

// 구역 강조 해제 함수
function resetHighlightRegion(regionName) {
  geoJsonLayer.eachLayer((layer) => {
    if (layer._regionName === regionName && selectedRegionName !== regionName) {
      layer.setStyle({ fillColor: "rgba(0, 0, 255, 0.3)" });
    }
  });
}

// 구역 스타일 업데이트 함수
function updateRegionStyle(regionName, layer, isSelected) {
  layer.setStyle({
    fillColor: isSelected ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 0, 255, 0.3)",
  });
}
