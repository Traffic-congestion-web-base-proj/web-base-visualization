function menuin_out(){
    const menu=document.getElementById("graphbar");
    const button=document.getElementById("menu_button");

    if (menu.style.right == "5px") {
        menu.style.right="-510px";
        button.style.right="0px";
        button.textContent="<"
    }
    else {
        menu.style.right="5px";
        button.style.right="515px";
        button.textContent=">"
    }
}

// function menuin(){
//     menu=document.getElementById("graphbar");
//     menu.style.right="-510px";

//     button=document.getElementById("button_out");
//     button.style.right="0px";
// }

// 선택된 도로 ID로 그래프를 생성
function onRoadSelected(roadId) {
    document.getElementById("graphbar").style.display = "block"; // 그래프 표시 영역 열기
    showGraphs(roadId); // roadId에 따라 그래프 생성
  }