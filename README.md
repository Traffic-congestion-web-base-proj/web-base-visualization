# Gangnam Traffic Visualization

## 프로젝트 개요

강남 혼잡 통행료 효과를 분석하기 위해 개발된 웹 기반 대시보드입니다. 사용자는 Mapbox를 활용한 시각화 지도에서 특정 구역을 선택하고, D3.js를 이용해 교통 속도 및 밀도 그래프를 확인할 수 있습니다. 프로젝트는 Python의 `http.server`를 이용해 로컬 서버에서 실행됩니다.

## 프로젝트 구조

project/  
│  
├── css/ # css 폴더  
│ └── styles.css # 프로젝트 전체의 CSS  
│  
├── data/ # 데이터 파일 폴더  
│ ├── data_feeBefore.csv # 요금 부과 전 데이터  
│ ├── data_Cheongdam.csv # 청담 지역 데이터  
│ ├── data_Daechi.csv # 대치 지역 데이터  
│ ├── data_Dogok.csv # 도곡 지역 데이터  
│ ├── data_Apgujeong.csv # 압구정 지역 데이터  
│ ├── data_Nonhyeon.csv # 논현 지역 데이터  
│ ├── data_Samseong.csv # 삼성 지역 데이터  
│ ├── data_Sinsa.csv # 신사 지역 데이터  
│ ├── data_Yeoksam.csv # 역삼 지역 데이터  
│ ├── divide.geojson # 지도에 사용되는 GeoJSON 데이터  
│ ├── gangnam_edge.csv # 강남 도로 정보 데이터  
│ └── gangnam_node.csv # 강남 노드 데이터(도로별 위도, 경도 데이터)  
│  
├── js/ # 자바스크립트 파일 폴더  
│ ├── graph.js # 그래프 관련 기능 구현  
│ ├── map.js # 지도 시각화 및 관련 로직  
│ ├── menu.js # 메뉴 동작 및 이벤트 처리리  
│ ├── Section.js # 특정 섹션 기능 처리  
│ └── Street.js # 도로 데이터 로직  
│  
└── index.html 프로젝트 메인 HTML 파일

## 주요 기능

1. **Mapbox 지도 시각화**:

   - 강남 지역의 교통 데이터를 기반으로 지도 표시.
   - 구역(Region) 선택 및 색상으로 상태 표시.

2. **교통 그래프 표시**:

   - 특정 도로를 클릭하면 D3.js로 속도와 밀도 데이터를 그래프로 시각화.

3. **시간대 필터링**:

   - 시간 슬라이더를 통해 특정 시간대 데이터를 필터링하여 지도 및 그래프 갱신.

4. **인터랙티브 UI**:
   - 사이드바, 그래프 바의 확장/축소 기능.
   - 도로 클릭 시 팝업 및 그래프 표시.

## 설치 및 실행 방법

### 1. Git에서 프로젝트 클론

Git을 사용하여 로컬 환경에 프로젝트를 복제합니다:

```bash
git clone https://github.com/Traffic-congestion-web-base-proj/web-base-visualization.git
```

### 2. 설치

**Python 및 pip** 설치:

- Python 3.7 이상이 설치되어 있어야 합니다.

### 3. 데이터 파일 준비

`/data` 폴더에 필요한 CSV 및 GeoJSON 데이터를 저장합니다.

- **데이터 파일**:
  - `gangnam_edge.csv` & `gangnam_node.csv`: 도로 경로 정보
  - `data_feeBefore.csv`: 통행료 부과 전 데이터
  - `data_RegionName.csv`: 구역 통행료 부과 후 데이터
  - `divide.geojson`: 구역 경계 데이터

### 4. 로컬 서버 실행

프로젝트 루트 디렉토리에서 아래 명령어를 실행합니다:

```bash
python -m http.server
```

### 5. 브라우저에서 접근

웹 브라우저에서 다음 주소를 열어 대시보드에 접근합니다:

[http://localhost:8000](http://localhost:8000)

## 시스템 평가 ( 기준 : 100 , 평가 : 96)

### 1. 데이터 분석의 정확성과 깊이 (기준 : 22 , 평가 : 20)

- 혼잡 통행료의 의미와 부과 방식
  혼잡통행료의 부과를 통해 혼잡한 도로에 대한 혼잡도를 낮추기 위한 정책으로 우회도로를 이용하게 하는 방법으로 사용됨.
- 통행료 부과 방식
  대한민국 평균 임금에 대한 1원당 시간만큼을 도로길이에 effort로 추가함으로서 effort가 추가된 도로를 사용하지 않고 다른 도로를 이용하게끔 하는 방식으로 simulation 통행량 데이터를 추출
- sumo simulation tool을 이용한 통행량 분석
  sumo의 특징 중 각 차량 마다의 경로를 도로에 설정 할 수 있음.
  따라서 도로에 너무 많은 차량이 존재하면 기존에 설정되었던 경로가 transport되어 다른 경로로 강제 이동하게 됨.
  topis에서 얻은 실제 도로별 통행량 정보를 가지고 simulation 하였을 때 sumo는 실제 통행량을 적용하기에는 적합하지 않은 simulation tool임을 확인 하였음. 따라서 통행량을 정확히 simulation 했다고 특정하기에는 어렵다고 판단하지만, 지역구별로 부과후 시각화된 map을 확인하였을 때 유의미한 변화가 있다는 것을 확인할 수 있었기에 도로에 대한 분석을 하는데는 의미가 있다고 평가함.

### 2. 시각화의 효과성 (기준 : 22 , 평가 : 22)

- 시간 별 도로상황에 대한 직관적 판단이 가능.
- 혼잡통행료 부과 효과에 대한 유의미한 변화를 관찰 할 수 있었던 지역별 부과 방식을 통해 전체 도로에 대한 상황 변화를 확인 할 수 있음.
- 혼잡통행료 부과 전,후 예상했던 도로에 대한 정확한 지표를 판단하기 위해 시간 별 속도, 밀도를 직선 그래프로 표현 함으로써 어느 시간에 도로의 변화가 있었는지 확인 가능.
- 도로에 진입 차량 수를 heat map으로 표현 함으로써 어느 시간에 진입이 가장 많은지에 대한 확인 가능.

### 3. 예측 모델의 성능 (기준 : 0, 평가 : x )

- sumo simualtion tool을 이용한 대한 데이터를 사용하였고 시스템을 사용하는 User 입장에서 이미 simulation 된 데이터를 보고 해당 도로에 어떠한 변화가 있는지에 대한 즉각 판단 또는 예측이 가능하기 때문에 모델 사용이 불필요 하였음. 따라서 평가 대상에서 제외함.

### 4. 시스템의 사용 편의성 (기준 : 12, 평가 : 12)

- 직관적 판단을 위한 map 전체의 도로 상황을 색을 통해 구분
- 도로별 정확한 실제 데이터를 확인하기 위한 팝업 표현
- 통행료를 부과할 지역구 선택을 위한 buttom tap 구현
- 지역구별 통행료 부과 전,후의 명확한 이해를 위한 시간, 밀도 graph
- 선택한 도로에 대한 시간 별 진입 차량수를 확인하기 위한 heat map
-

### 5. 프로젝트 결과물의 실용성 (기준 : 12, 평가 : 12)

- 통행료 부과에 대한 주요 도로들의 통행량 변화 폭을 살펴볼 수 있기 때문에 문제 해결에 기여할 수
  있을 것이라 생각.
- 강남 지역에 대해서는 통행량 변화 등을 살펴볼 수 있지만 SUMO simulation의 결과가 시스템에 바로
  적용되도록 만들지 않았기 때문에 확장성이 좋다고 볼수는 없음.
- 데이터 양에 따라 시스템 로딩시간의 차이가 크기 때문에 시스템 최적화에 대한 보완이 이루어져야
  필요가 있음.

### 6. 정책 결정에 대한 기여도 (기준 : 27, 평가 : 25)

- 이전 항목에서 언급했듯이 이 프로젝트에서 SUMO simulation은 현실의 통행량을 반영할 수 없었지만
  특정 지역 통행료 부과에 따른 도로의 통행량의 변화는 확인할 수 있기 때문에 강남 지역의 통행료
  부과 후보군을 선정하는데 기여할 수 있을 것이라 기대.
- 시스템을 활용해 통행료 부과 지역을 선정 후 혼잡통행료를 부과하여 자가용 승용차 이용을 줄이고
  대중교통 이용을 활성화하는데 기여할 수 있을 것이라 생각.

cf) 모델 사용제외에 따른 평가 기준점수를 다른 평가에 분배함.
