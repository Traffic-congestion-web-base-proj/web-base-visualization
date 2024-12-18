let currentRegionName = null; // 선택된 regionName 저장
let currentRoadId = null;     // 선택된 roadId 저장

let roadNameMap = {};

// 도로명 데이터 로딩
d3.csv("./data/gangnam_edge.csv").then(data => {
  data.forEach(d => {
    roadNameMap[d.LINK_ID] = d.ROAD_NAME || "Unknown"; // LINK_ID를 키로, ROAD_NAME을 값으로 저장
  });
  console.log("Loaded Road Names:", roadNameMap); // 확인용
});


// regionName 이벤트 리스너
window.addEventListener("regionSelected", (event) => {
    currentRegionName = event.detail.regionName;
    console.log(`Region selected: ${currentRegionName}`);
    if (currentRoadId) {
      showGraphs(currentRoadId, currentRegionName);
      prepareHeatmapData(currentRoadId, currentRegionName);
    }
});

// roadSelected 이벤트 리스너
window.addEventListener("roadSelected", (event) => {
    currentRoadId = event.detail.roadId;
    console.log(`Road selected: ${currentRoadId}`);
    showGraphs(currentRoadId, currentRegionName);
    prepareHeatmapData(currentRoadId, currentRegionName);
});

// 그래프 및 히트맵 표시 함수
function showGraphs(roadId, regionName = null) {
  const regionSpecificPath = regionName
    ? `./data/data_${regionName.replace(/\s/g, "")}.csv`
    : null; // regionName이 null이면 regionSpecificPath는 null
  const feeBeforePath = "./data/data_feeBefore.csv";

  Promise.all([
    regionSpecificPath ? d3.csv(regionSpecificPath) : Promise.resolve([]), // region 데이터가 없으면 빈 배열
    d3.csv(feeBeforePath),
  ])
    .then(([regionData, feeBeforeData]) => {
      const filteredRegionData = regionData.filter((row) => String(row.id) === String(roadId));
      const filteredFeeBefore = feeBeforeData.filter((row) => String(row.id) === String(roadId));
      // 도로명 가져오기
      const roadName = roadNameMap[roadId] || "Unknown";

      // 도로명과 ID를 가져와 화면에 표시
      document.getElementById("roadName").innerText = `Road Name: ${roadName}`;
      document.getElementById("roadId").innerText = `Road ID: ${roadId}`;

      if (filteredFeeBefore.length === 0) {
        console.error(`No fee before data found for roadId: ${roadId}`);
        return;
      }

      // 기존 그래프 삭제
      d3.select("#feeBeforeGraph").selectAll("*").remove();
      d3.select("#feeAfterGraph").selectAll("*").remove();

      // 그래프 생성
      drawGraph(filteredRegionData, filteredFeeBefore);
      prepareHeatmapData(roadId, regionName); // 히트맵 추가
    })
    .catch((error) => console.error("Error loading or filtering data:", error));
}


function drawGraph(regionData, feeBeforeData) {
    const xScale = d3.scaleLinear().domain([0, 24]).range([50, 550]);
    const yScaleSpeed = d3.scaleLinear().domain([0, 30]).range([250, 50]);
    const yScaleDensity = d3.scaleLinear().domain([0, 500]).range([250, 50]);

    feeBeforeData.forEach(d => d.xValue = d.interval_begin / 3600);
    regionData.forEach(d => d.xValue = d.interval_begin / 3600);

    // 마지막 데이터가 23:30이면 24:00으로 가상의 데이터 추가
    const extendDataTo24 = (data) => {
        const lastPoint = data[data.length - 1];
        if (lastPoint && lastPoint.xValue === 23.5) {
        data.push({
            ...lastPoint,
            xValue: 24.0, // 24시로 확장
        });
        }
    };

    extendDataTo24(feeBeforeData);
    extendDataTo24(regionData);

    const createDualAxisGraph = (containerId, data, title) => {
        d3.select(`#${containerId}`).select("svg").remove();

        const svg = d3.select(`#${containerId}`).append("svg")
            .attr("width", 600)
            .attr("height", 300);

        svg.append("g")
          .attr("transform", "translate(0, 250)")
          .call(d3.axisBottom(xScale).tickFormat(d => `${Math.floor(d)}:00`));

        svg.append("g")
          .attr("transform", "translate(50, 0)")
          .call(d3.axisLeft(yScaleSpeed).ticks(6));

        svg.append("g")
          .attr("transform", "translate(550, 0)")
          .call(d3.axisRight(yScaleDensity).ticks(6));

        svg.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "blue")
          .attr("stroke-width", 2)
          .attr("d", d3.line().x(d => xScale(d.xValue)).y(d => yScaleSpeed(d.speed)));

        svg.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 2)
          .attr("d", d3.line().x(d => xScale(d.xValue)).y(d => yScaleDensity(d.density)));

        svg.append("text")
          .attr("x", 300).attr("y", 20)
          .attr("text-anchor", "middle")
          .text(title);
        // 범례 추가
    const legend = svg.append("g").attr("transform", "translate(485, 10)");

    // Speed Legend
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "blue");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text("Speed")
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");

    // Density Legend
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "orange");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 32)
        .text("Density")
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    };

    createDualAxisGraph("feeBeforeGraph", feeBeforeData, "Speed and Density (Before Toll)");
    if (regionData.length > 0) {
        createDualAxisGraph("feeAfterGraph", regionData, "Speed and Density (After Toll)");
    }
}

// 히트맵 그리기
function drawHeatmap(enteredData) {
  const svgWidth = 600, svgHeight = 200;
  const margin = { top: 100, right: 60, bottom: 20, left: 60 };
  const cellWidth = (svgWidth - margin.left - margin.right) / 24;
  const cellHeight = 50;

  const xScale = d3.scaleLinear().domain([0, 24]).range([margin.left, svgWidth - margin.right]);
  const maxEntered = d3.max(enteredData, d => d.entered);

  const colorScale = d3.scaleSequential(d3.interpolateOranges).domain([0, maxEntered]);

  d3.select("#heatmap").select("svg").remove();
  const svg = d3.select("#heatmap").append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

  // 히트맵 셀 생성
  svg.selectAll("rect")
    .data(enteredData)
    .enter().append("rect")
    .attr("x", d => xScale(d.interval_begin / 3600))
    .attr("y", margin.top)
    .attr("width", cellWidth - 2)
    .attr("height", cellHeight - 2)
    .attr("fill", d => colorScale(d.entered));

  // 시간 라벨 추가 (2시간마다 표시)
  svg.selectAll("text")
    .data(enteredData.filter(d => d.interval_begin % 7200 === 0)) // 2시간 간격 필터링
    .enter().append("text")
    .attr("x", d => xScale(d.interval_begin / 3600) + cellWidth / 2)
    .attr("y", margin.top + cellHeight + 20)
    .attr("text-anchor", "middle")
    .attr("transform", d => `rotate(-45, ${xScale(d.interval_begin / 3600) + cellWidth / 2}, ${margin.top + cellHeight + 20})`) // 라벨 기울임
    .text(d => `${Math.floor(d.interval_begin / 3600)}:00`);

  // 타이틀
  svg.append("text")
    .attr("x", svgWidth / 2).attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .text("Time-based Vehicle Entry Heatmap");
}


// 데이터 준비 함수
function prepareHeatmapData(roadId, regionName = null) {
    const regionSpecificPath = regionName 
      ? `./data/data_${regionName.replace(/\s/g, "")}.csv`
      : null;
    const feeBeforePath = "./data/data_feeBefore.csv";

    Promise.all([
        regionSpecificPath ? d3.csv(regionSpecificPath) : Promise.resolve([]),
        d3.csv(feeBeforePath),
    ]).then(([regionData, feeBeforeData]) => {
        const filteredData = (regionData.length > 0 ? regionData : feeBeforeData)
            .filter(d => String(d.id) === String(roadId))
            .map(d => ({ interval_begin: +d.interval_begin, entered: +d.entered }));

        drawHeatmap(filteredData);
    });
}
