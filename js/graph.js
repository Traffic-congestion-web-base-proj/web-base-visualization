function showGraphs(roadId) {
    Promise.all([
        d3.csv("./data/data_Apgujeong.csv"),
        d3.csv("./data/data_feeBefore.csv")
    ])
    .then(([apgujungData, feeBeforeData]) => {
        // ID로 필터링
        const filteredApgujung = apgujungData.filter(row => String(row.id) === String(roadId));
        const filteredFeeBefore = feeBeforeData.filter(row => String(row.id) === String(roadId));

        if (filteredApgujung.length === 0 || filteredFeeBefore.length === 0) {
            console.error(`No data found for roadId: ${roadId}`);
            return;
        }

        // 기존 그래프 삭제
        d3.select("#speedGraph").selectAll("*").remove();
        d3.select("#densityGraph").selectAll("*").remove();

        // 새로운 그래프 생성
        drawGraph(filteredApgujung, filteredFeeBefore);
    })
    .catch(error => console.error("Error loading or filtering data:", error));
}


  
function drawGraph(apgujungData, feeBeforeData) {
    // 초를 HH:MM 형식으로 변환하는 유틸리티 함수
    function secondsToHHMM(seconds) {
        const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
        return `${h}:${m}`;
    }

    // 시간 변환 (interval_begin -> HH:MM)
    apgujungData.forEach(d => d.startTime = secondsToHHMM(+d.interval_begin));
    feeBeforeData.forEach(d => d.startTime = secondsToHHMM(+d.interval_begin)); // 필요 없으면 생략 가능

    // 기존 SVG 제거 (초기화)
    d3.select("#speedGraph").select("svg").remove();
    d3.select("#densityGraph").select("svg").remove();

    // 변환된 시간을 기준으로 Tick Values 생성
    const tickValues = [...new Set(apgujungData.map(d => d.startTime))];

    // 확인: Tick Values 출력
    console.log("Tick Values:", tickValues);

    // X축 스케일
    const xScale = d3.scalePoint()
        .domain(tickValues) // 변환된 HH:MM 값
        .range([50, 550]);

    // Y축 스케일 (속도: 0 ~ 20)
    const yScaleSpeed = d3.scaleLinear()
        .domain([0, 20]) // 속도 범위 고정
        .range([250, 50]);

    // Y축 스케일 (밀도: 0 ~ 500)
    const yScaleDensity = d3.scaleLinear()
        .domain([0, 500]) // 밀도 범위 고정
        .range([250, 50]);

    // 속도 그래프
    const speedSvg = d3.select("#speedGraph").append("svg").attr("width", 600).attr("height", 300);
    speedSvg.append("g")
        .attr("transform", "translate(0,250)")
        .call(
            d3.axisBottom(xScale)
                .tickValues(tickValues) // 변환된 시간을 X축에 표시
                .tickFormat(d => d) // 그대로 표시
        );
    speedSvg.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScaleSpeed));

    // 속도 선 그래프
    const lineSpeed = d3.line()
        .x(d => xScale(d.startTime))
        .y(d => yScaleSpeed(+d.speed));

    speedSvg.append("path")
        .datum(apgujungData)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("d", lineSpeed);

    speedSvg.append("path")
        .datum(feeBeforeData)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", lineSpeed);

    // 밀도 그래프
    const densitySvg = d3.select("#densityGraph").append("svg").attr("width", 600).attr("height", 300);
    densitySvg.append("g")
        .attr("transform", "translate(0,250)")
        .call(
            d3.axisBottom(xScale)
                .tickValues(tickValues)
                .tickFormat(d => d) // 그대로 표시
        );
    densitySvg.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScaleDensity));

    // 밀도 선 그래프
    const lineDensity = d3.line()
        .x(d => xScale(d.startTime))
        .y(d => yScaleDensity(+d.density));

    densitySvg.append("path")
        .datum(apgujungData)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("d", lineDensity);

    densitySvg.append("path")
        .datum(feeBeforeData)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", lineDensity);
}
