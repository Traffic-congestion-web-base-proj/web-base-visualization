// 구역 처리
const geoJsonPath = "./data/divide.geojson";
const selectedRegions = {}; // 선택된 구역 상태 저장 객체

fetch(geoJsonPath)
  .then((response) => {
    if (!response.ok) throw new Error("Failed to fetch GeoJSON");
    return response.json();
  })
  .then((geoJson) => {
    // 지도에 GeoJSON 데이터 추가
    const geoJsonLayer = L.geoJson(geoJson, {
      style: (feature) => ({
        color: "skyblue",
        fillColor: "rgba(0, 0, 255, 0.3)",
        weight: 1,
      }),
      onEachFeature: (feature, layer) => {
        const regionName = feature.properties.nhood || "Unknown";

        // 클릭 이벤트 추가
        layer.on("click", function () {
          toggleRegionSelection(regionName, layer);
        });

        // 구역 스타일 초기화
        updateRegionStyle(regionName, layer);
      },
    }).addTo(map);

    // 사이드바 초기화
    initSidebar(geoJson.features);
  })
  .catch((error) => console.error("Error loading GeoJSON:", error));

// 사이드바 초기화 함수
function initSidebar(features) {
  const regionList = document.getElementById("region-list");

  features.forEach((feature) => {
    const regionName = feature.properties.nhood || "Unknown";
    const listItem = document.createElement("li");
    listItem.textContent = regionName;
    listItem.style.cursor = "pointer";
    listItem.classList.add("region-item");

    // 클릭 이벤트
    listItem.addEventListener("click", () => {
      toggleRegionSelection(regionName);
    });

    regionList.appendChild(listItem);
  });
}

// 구역 선택/해제 토글 함수
function toggleRegionSelection(regionName, layer = null) {
  selectedRegions[regionName] = !selectedRegions[regionName]; // 선택 상태 토글

  // 지도 업데이트
  if (layer) {
    updateRegionStyle(regionName, layer);
  } else {
    map.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties.nhood === regionName) {
        updateRegionStyle(regionName, layer);
      }
    });
  }

  // 사이드바 스타일 업데이트
  document.querySelectorAll(".region-item").forEach((item) => {
    if (item.textContent === regionName) {
      item.classList.toggle("selected", selectedRegions[regionName]);
    }
  });
}

// 구역 스타일 업데이트 함수
function updateRegionStyle(regionName, layer) {
  layer.setStyle({
    fillColor: selectedRegions[regionName] ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 0, 255, 0.3)",
  });
}
        // 마우스 이벤트
        layer
          .on("mouseover", function () {
            if (isRoadHovered) return; // 도로 위에 마우스가 있는 경우 툴팁 표시하지 않음
            layer.setStyle({ fillColor: "rgba(0, 0, 255, 0.7)" });
            layer.bindTooltip(`<strong>${regionName}</strong>`, { sticky: true }).openTooltip();
          })
          .on("mouseout", function () {
            layer.setStyle({ fillColor: "rgba(0, 0, 255, 0.3)" });
            layer.unbindTooltip();
          });
      },
    }).addTo(map);

    // 버튼 생성
    layers.forEach(({ name, layer }) => {
      const button = document.createElement("button");
      button.textContent = name;
      button.addEventListener("click", () => {
        map.fitBounds(layer.getBounds());
      });
      button.addEventListener("mouseover", () => {
        layer.setStyle({ fillColor: "rgba(255, 0, 0, 0.7)" });
      });
      button.addEventListener("mouseout", () => {
        layer.setStyle({ fillColor: "rgba(0, 0, 255, 0.3)" });
      });
      regionButtonsContainer.appendChild(button);
    });
  })
  .catch((error) => console.error("Error loading GeoJSON:", error));
