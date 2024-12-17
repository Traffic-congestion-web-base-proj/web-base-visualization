let currentRegionName = null; // 선택된 regionName 저장
let currentRoadId = null;     // 선택된 roadId 저장

// regionName 이벤트 리스너
window.addEventListener("regionSelected", (event) => {
    const regionName = event.detail.regionName; // 전달된 regionName
    console.log(`Region selected: ${regionName}`);
  
    if (currentRoadId) {
      showGraphs(currentRoadId, regionName); // regionName이 null이면 data_feeBefore.csv만 사용
    }
  });
  

// roadSelected 이벤트 리스너
window.addEventListener("roadSelected", (event) => {
    currentRoadId = event.detail.roadId;
    console.log(`Road selected: ${currentRoadId}`);
  
    // regionName이 없더라도 showGraphs 호출
    showGraphs(currentRoadId, currentRegionName);
  });
  
  // showGraphs 함수 수정
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
  
        // feeBeforeData는 필수, regionData는 선택
        if (regionSpecificPath && regionData.length > 0 && filteredRegionData.length === 0) {
          console.error(`No region data found for roadId: ${roadId}`);
        }
        if (filteredFeeBefore.length === 0) {
          console.error(`No fee before data found for roadId: ${roadId}`);
          return;
        }
  
        // 기존 그래프 삭제
        d3.select("#speedGraph").selectAll("*").remove();
        d3.select("#densityGraph").selectAll("*").remove();
        d3.select("#heatmap-container").selectAll("*").remove(); // 히트맵 컨테이너 초기화
  
        // 그래프 생성
        drawGraph(filteredRegionData, filteredFeeBefore);
      })
      .catch((error) => console.error("Error loading or filtering data:", error));
  }
  

  function drawGraph(regionData, feeBeforeData) {
    // X축 라벨 수동 생성 (1시간 간격 + 24시 포함)
    const xLabels = Array.from({ length: 25 }, (_, i) => i.toString().padStart(2, "0")); // ["00", "01", ..., "24"]
  
    // 데이터를 X축 스케일에 맞게 매핑
    feeBeforeData.forEach(d => {
      const intervalTime = d.interval_begin / 3600; // 데이터를 시간 단위로 변환 (30분 = 0.5)
      d.xValue = intervalTime; // 연속적인 시간 값 사용
    });
  
    regionData.forEach(d => {
      const intervalTime = d.interval_begin / 3600;
      d.xValue = intervalTime;
    });
  
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
  
    // 유효한 데이터만 필터링
    const validFeeBeforeData = feeBeforeData.filter(d =>
      d.xValue !== undefined && !isNaN(d.speed) && !isNaN(d.density)
    );
    const validRegionData = regionData.filter(d =>
      d.xValue !== undefined && !isNaN(d.speed) && !isNaN(d.density)
    );
  
    // 기존 SVG 제거 (초기화)
    d3.select("#speedGraph").select("svg").remove();
    d3.select("#densityGraph").select("svg").remove();
  
    // X축 및 Y축 스케일 설정
    const xScale = d3.scaleLinear()
      .domain([0, 24]) // X축 범위 (0시 ~ 24시)
      .range([50, 550]);
  
    const yScaleSpeed = d3.scaleLinear().domain([0, 30]).range([250, 50]); // 속도
    const yScaleDensity = d3.scaleLinear().domain([0, 500]).range([250, 50]); // 밀도
  
    // 범례 추가 함수
    function addLegend(svg, colors, labels, width, height) {
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 20)`);
  
      labels.forEach((label, i) => {
        legend.append("rect")
          .attr("x", 0)
          .attr("y", i * 20)
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", colors[i]);
  
        legend.append("text")
          .attr("x", 20)
          .attr("y", i * 20 + 10)
          .text(label)
          .attr("font-size", "12px")
          .attr("fill", "black");
      });
    }
  
    // 속도 그래프
    const speedSvg = d3.select("#speedGraph").append("svg").attr("width", 600).attr("height", 300);
  
    speedSvg.append("g")
      .attr("transform", "translate(0,250)")
      .call(
        d3.axisBottom(xScale)
          .tickValues(xLabels.map((_, i) => i)) // 1시간 간격으로 X축 라벨 표시
          .tickFormat((d, i) => xLabels[i]) // X축 라벨 포맷
      );
  
    speedSvg.append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(yScaleSpeed).ticks(6)); // 5 단위로 출력 (0, 5, 10, 15, 20, 25, 30)
  
    const lineSpeed = d3.line()
      .x(d => xScale(d.xValue)) // 연속적인 시간 값 사용
      .y(d => yScaleSpeed(+d.speed));
  
    // feeBeforeData 속도 선
    speedSvg.append("path")
      .datum(validFeeBeforeData)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 3)
      .attr("d", lineSpeed);
  
    // regionData 속도 선
    if (validRegionData.length > 0) {
      speedSvg.append("path")
        .datum(validRegionData)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 3)
        .attr("d", lineSpeed);
    }
  
    addLegend(speedSvg, ["blue", "orange"], ["요금 부과 후", "요금 부과 전"], 600, 300);
  
    // 밀도 그래프
    const densitySvg = d3.select("#densityGraph").append("svg").attr("width", 600).attr("height", 300);
  
    densitySvg.append("g")
      .attr("transform", "translate(0,250)")
      .call(
        d3.axisBottom(xScale)
          .tickValues(xLabels.map((_, i) => i)) // 1시간 간격으로 X축 라벨 표시
          .tickFormat((d, i) => xLabels[i]) // X축 라벨 포맷
      );
  
    densitySvg.append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(yScaleDensity));
  
    const lineDensity = d3.line()
      .x(d => xScale(d.xValue))
      .y(d => yScaleDensity(+d.density));
  
    // feeBeforeData 밀도 선
    densitySvg.append("path")
      .datum(validFeeBeforeData)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 3)
      .attr("d", lineDensity);
  
    // regionData 밀도 선
    if (validRegionData.length > 0) {
      densitySvg.append("path")
        .datum(validRegionData)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 3)
        .attr("d", lineDensity);
    }
  
    addLegend(densitySvg, ["blue", "orange"], ["요금 부과 후", "요금 부과 전"], 600, 300);
  }
  