// 구역 처리
const geoJsonPath = "./data/divide.geojson";
fetch(geoJsonPath)
  .then((response) => {
    if (!response.ok) throw new Error("Failed to fetch GeoJSON");
    return response.json();
  })
  .then((geoJson) => {
    L.geoJson(geoJson, {
      style: (feature) => ({
        color: "skyblue",
        fillColor: "rgba(0, 0, 255, 0.3)",
        weight: 1,
      }),
      onEachFeature: (feature, layer) => {
        const regionName = feature.properties.nhood || "Unknown";

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
          })
          .on("click", function () {
            // 클릭 시 모달창 표시
            showModal(regionName);
          });
      },
    }).addTo(map);
  })
  .catch((error) => console.error("Error loading GeoJSON:", error));

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
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}
