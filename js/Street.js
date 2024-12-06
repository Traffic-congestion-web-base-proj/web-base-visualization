var featureGroup = L.featureGroup().addTo(map);
var isRoadHovered = false; // 도로 위에 마우스가 있는지 여부 플래그

// 도로 처리
const dataPath = "./data/gangnam_edge.csv";
fetch(dataPath)
  .then((response) => {
    if (!response.ok) throw new Error("Network response was not ok");
    return response.text();
  })
  .then((text) => {
    const data = d3.csvParse(text);

    data.forEach((row, index) => {
      if (!row.geometry || !row.geometry.startsWith("LINESTRING")) return;

      var geometry = row.geometry.slice(row.geometry.indexOf("(") + 1, row.geometry.lastIndexOf(")"));
      var coordinates = geometry.split(", ").map((coord) => {
        var [lng, lat] = coord.trim().split(/\s+/).map(parseFloat);
        return [lat, lng];
      });

      var roadName = row.ROAD_NAME || "도로명없음";
      var roadId = row.LINK_ID;

      var polyline = new L.polyline(coordinates, {
        color: "red",
        weight: 3,
        customData: {
          road_name: roadName,
          road_id: roadId,
        },
      })
        .bindPopup(`도로명: ${roadName}<br>LINK_ID: ${roadId}`)
        .on("mouseover", function (e) {
          isRoadHovered = true; // 도로 위에 마우스가 있음을 표시
          this.openPopup();
          e.target.setStyle({ color: "green", weight: 10 });
        })
        .on("mouseout", function (e) {
          isRoadHovered = false; // 도로에서 마우스가 벗어남
          this.closePopup();
          e.target.setStyle({ color: "red", weight: 3 });
        });

      featureGroup.addLayer(polyline);
    });
  });
