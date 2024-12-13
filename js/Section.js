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
        console.log(regionName);
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
