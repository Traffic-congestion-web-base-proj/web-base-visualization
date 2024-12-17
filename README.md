# Gangnam Traffic Visualization

## 프로젝트 개요
강남 혼잡 통행료 효과를 분석하기 위해 개발된 웹 기반 대시보드입니다. 사용자는 Mapbox를 활용한 시각화 지도에서 특정 구역을 선택하고, D3.js를 이용해 교통 속도 및 밀도 그래프를 확인할 수 있습니다. 프로젝트는 Python의 `http.server`를 이용해 로컬 서버에서 실행됩니다.

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

