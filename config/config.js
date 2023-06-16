/* =======================================
* server config variable
* ======================================== */
var config = {};

config.classInfo = {
	// 수업 개설시 고정	
	code: null,
	// room: null, //수업 check를 위한 이름=> 현재 name(수업명)으로 사용
	name: null, // 수업명
	teacher: null, // 교사명

	// 문서 및 canvas data
	// shareData = {
	// 		pdfNum
	//     numPage             : pdfVar.totalPdfDoc_file.length, //total page 수
	//     fileBuffer          : pdfVar.fileBuffer, //여러 pdf가 포함된 경우 편의상 일단 전체를 다시 보냄...
	//     loadedDate          : pdfVar.loadedDate, //문서별 변환 시간
	//     pagePerFileBuffer   : pdfVar.pagePerFileBuffer, //문서별 page 수 => 현재 미사용
	//     drawingEventSet     : pdfVar.drawingEventSet
	// }
	shareData: [], 
	shareDrawData:[],
	//학생 list.
	studentList : [], //학생 관련 정보

	// monitoring mode.
	monitoring : false,

    // 시험 관련 정보 (문제수/보기수)
	exam: null,

	// 공유 URL
	sharedUrl: null
}

config.webRTCInfo = {
	sessions : {},
	candidatesQueue : {},
	username: null,
	roomname:null,
	bandwidth:null,
	meeting_disconnect: null,
}

module.exports = config;