import { updateRoadsWithNewData } from "./Street.js";

const geoJsonPath = "./data/divide.geojson";
let densityPath = "./data/data_feeBefore.csv"; // 초기 밀도 데이터 경로
const selectedRegions = {}; // 선택된 구역 상태 저장 객체
let geoJsonLayer; // GeoJSON 레이어 참조

fetch(geoJsonPath)
  .then((response) => {
    if (!response.ok) throw new Error("Failed to fetch GeoJSON");
    return response.json();
  })
  .then((geoJson) => {
    // GeoJSON 데이터로 지도 초기화
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

// 초기화 버튼 클릭 시 실행되는 함수
function resetRoadsToInitialState() {
  densityPath = "./data/data_feeBefore.csv"; // 초기 상태로 데이터 경로 변경
  updateRoadsWithNewData(densityPath); // 초기 데이터로 도로 업데이트
  alert("도로 상태가 초기화되었습니다.");
}

// 모달 창 표시 함수
function showModal(regionName) {
  // 데이터 파일 경로 생성
  const dataFileName = `data_${regionName.replace(/\s/g, "")}.csv`;
  const dataFilePath = `./data/${dataFileName}`;

  // 모달 HTML 생성
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

  // 모달 버튼 이벤트
  document.getElementById("modal-yes").addEventListener("click", () => {
    updateRoadsWithNewData(dataFilePath); // 도로 데이터 업데이트
    alert(`${regionName} 구역에 통행료를 부과했습니다.`);
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
    if (layer._regionName === regionName) {
      layer.setStyle({ fillColor: "rgba(0, 255, 0, 0.5)" });
      layer.bringToFront();
    }
  });
}

// 구역 강조 해제 함수
function resetHighlightRegion(regionName) {
  geoJsonLayer.eachLayer((layer) => {
    if (layer._regionName === regionName && !selectedRegions[regionName]) {
      layer.setStyle({ fillColor: "rgba(0, 0, 255, 0.3)" });
    }
  });
}

// 구역 스타일 업데이트 함수
function updateRegionStyle(regionName, layer) {
  layer.setStyle({
    fillColor: selectedRegions[regionName] ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 0, 255, 0.3)",
  });
}
