let menu;
let button;

function menuout(){
    menu=document.getElementById("graphbar");
    menu.style.right="1%";
    menu.style.position="absolute"

    button=document.getElementById("button_out");
    button.style.right="-100%";
}

function menuin(){
    menu=document.getElementById("graphbar");
    menu.style.right="-1000px";
    menu.style.position="fixed"

    button=document.getElementById("button_out");
    button.style.right="0px";
}

// 선택된 도로 ID로 그래프를 생성
function onRoadSelected(roadId) {
    document.getElementById("graphbar").style.display = "block"; // 그래프 표시 영역 열기
    showGraphs(roadId); // roadId에 따라 그래프 생성
  }