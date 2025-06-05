import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "@/components_css/board/BoardWrite.css";
import KakaoMapComponent from "./KakaoMapComponent.jsx";

export default function BoardWrite() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 수정 모드 기존 게시글
  const existing = location.state?.board || null;

  // 폼 상태
  const [boardType, setBoardType] = useState(existing?.boardType || "general");
  const [title, setTitle] = useState(existing?.boardTitle || "");
  const [hashtags, setHashtags] = useState((existing?.tags || []).join(","));
  const [content, setContent] = useState(existing?.boardContent || "");
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ← 추가: 위치 선택 정보 상태
  const [selectedLocation, setSelectedLocation] = useState({
    lat: existing?.boardLat || null,
    lng: existing?.boardLng || null,
    address: existing?.boardAddressName || "",
    name: existing?.placeName || "",
    kakaoId: existing?.placeKakaoId || ""
  });

  // 텍스트 스타일 도구 상태
  const [fontColor, setFontColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontFamily, setFontFamily] = useState("inherit");
  const [textAlign, setTextAlign] = useState("left");
  const [showStickers, setShowStickers] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // 스타일 적용
  const applyStyle = () => {
    const style = {};
    if (isBold) style.fontWeight = "bold";
    if (isItalic) style.fontStyle = "italic";
    if (isUnderline) style.textDecoration = "underline";
    style.color = fontColor;
    style.fontFamily = fontFamily;
    style.textAlign = textAlign;
    return style;
  };

  // 수정 모드 초기 로드
  useEffect(() => {
    if (boardId && !existing) {
      axios
        .get(`http://localhost:8080/api/board/detail/${boardId}`, {
          withCredentials: true,
        })
        .then((res) => {
          const data = res.data;
          setBoardType(data.boardType);
          setTitle(data.boardTitle);
          setHashtags((data.tags || []).join(","));
          setContent(data.boardContent);
          setSelectedLocation({
            lat: data.boardLat,
            lng: data.boardLng,
            address: data.boardAddressName,
            name: data.placeName || "",
            kakaoId: data.placeKakaoId || ""
          });
        })
        .catch((err) => console.error("게시글 불러오기 실패:", err));
    }
  }, [boardId, existing]);

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  // 저장(등록/수정) 핸들러
  const handleSave = async (e) => {
    e.preventDefault();

    // 게시판이 선택되지 않았으면 알림 후 저장 중단
    if (boardType === "general") {
      alert("게시판을 선택해주세요.");
      return;
    }

    const payload = {
      boardType,
      boardTitle: title,
      boardContent: content,
      tags: hashtags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      boardLat: selectedLocation.lat,
      boardLng: selectedLocation.lng,
      roadAddressName: selectedLocation.address,
      placeName: selectedLocation.name,
      placeKakaoId: selectedLocation.kakaoId,
    };

    try {
      const formData = new FormData();
      formData.append(
        "board",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      selectedFiles.forEach((f) => formData.append("pics", f));

      const url = boardId
        ? `http://localhost:8080/api/board/pics/update/${boardId}`
        : `http://localhost:8080/api/board/pics/write`;

      const method = boardId ? "put" : "post";

      const res = await axios({
        method,
        url,
        data: formData,
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newId = boardId ?? res.data;
      navigate(`/board/detail/${newId}`);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // 기타 핸들러
  const toggleBold = () => setIsBold((b) => !b);
  const toggleItalic = () => setIsItalic((i) => !i);
  const toggleUnderline = () => setIsUnderline((u) => !u);
  const handleQuote = () => setContent((c) => c + "\n> 인용문\n");
  const handleSchedule = () => setContent((c) => c + "\n📅 일정: YYYY-MM-DD\n");
  const handleStickerToggle = () => setShowStickers((s) => !s);
  const handleMapToggle = () => setShowMap((m) => !m);

  return (
    <form className="editor-container" onSubmit={handleSave}>
      {/* 게시판 분류 */}
      <select
        className="editor-select"
        value={boardType}
        onChange={(e) => setBoardType(e.target.value)}
      >
        <option value="general">게시판 선택</option>
        <option value="notice">공지사항</option>
        <option value="free">자유</option>
        <option value="food">맛집</option>
        <option value="hobby">취미</option>
        <option value="play">놀거리</option>
        <option value="sell">거래</option>
      </select>

      {/* 제목 & 해시태그 */}
      <input
        className="editor-title input-fix"
        type="text"
        placeholder="제목을 입력하세요..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="editor-hashtag input-fix"
        type="text"
        placeholder="#해시태그 입력"
        value={hashtags}
        onChange={(e) => setHashtags(e.target.value)}
      />

      {/* 툴바 */}
      <div className="editor-toolbar">
        <button type="button" onClick={toggleBold}>
          <b>B</b>
        </button>
        <button type="button" onClick={toggleItalic}>
          <i>I</i>
        </button>
        <button type="button" onClick={toggleUnderline}>
          <u>U</u>
        </button>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          <option value="inherit">폰트</option>
          <option value="Nanum Gothic">나눔고딕</option>
          <option value="Dotum">돋움</option>
        </select>
        <input
          type="color"
          value={fontColor}
          onChange={(e) => setFontColor(e.target.value)}
        />
        <select
          value={textAlign}
          onChange={(e) => setTextAlign(e.target.value)}
        >
          <option value="left">왼쪽 정렬</option>
          <option value="center">가운데 정렬</option>
          <option value="right">오른쪽 정렬</option>
        </select>
        <button type="button" onClick={handleQuote}>
          인용구
        </button>
        <button type="button" onClick={handleStickerToggle}>
          😊 스티커
        </button>
        <button type="button" onClick={handleSchedule}>
          📅 일정
        </button>

        {/* 파일 업로드 */}
        <input type="file" multiple onChange={handleFileChange} />

        <button type="button" onClick={handleMapToggle}>
          📍 지도
        </button>
      </div>

      {/* 스티커 */}
      {showStickers && (
        <div className="sticker-popup">
          {["😊", "🔥", "🎉", "❤️"].map((s) => (
            <span key={s} onClick={() => setContent((c) => c + s)}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* 지도 */}
      {showMap && (
        <KakaoMapComponent
          onSelect={({ lat, lng, address, name, kakaoId }) =>
            setSelectedLocation({ lat, lng, address, name, kakaoId })
          }
        />
      )}

      {/* 본문 에디터 */}
      <textarea
        className="editor-textarea input-fix"
        style={applyStyle()}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요..."
        rows={10}
      />

      {/* 저장/수정 버튼 */}
      <button type="submit" className="editor-save">
        {boardId ? "수정 완료" : "저장"}
      </button>
    </form>
  );
}
