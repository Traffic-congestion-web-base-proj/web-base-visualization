// 지도 초기화
L.mapbox.accessToken = "pk.eyJ1IjoibGN3MjAwMSIsImEiOiJjbTRjOHZzN2IwN3JhMmpxcXF5eHN4YmV2In0.Uzc4pqLXYiT6RBLqkvz29w";

var map = L.mapbox
  .map("map", null, { zoomControl: false })
  .setView([37.5088, 127.045], 14)
  .addLayer(L.mapbox.styleLayer("mapbox://styles/mapbox/streets-v11"));
