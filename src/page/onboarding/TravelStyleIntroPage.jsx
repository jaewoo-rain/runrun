// // src/TravelStyleIntroPage.jsx
// import React from "react";

// export default function TravelStyleIntroPage({ onNext }) {
//   return (
//     <div
//       style={{
//         width: 360,
//         height: 800,
//         position: "relative",
//         background: "white",
//         overflow: "hidden",
//       }}
//     >
//       {/* 안내 텍스트 */}
//       <div
//         style={{
//           width: 360,
//           padding: 10,
//           left: 0,
//           top: 146,
//           position: "absolute",
//           display: "inline-flex",
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <div
//           style={{
//             textAlign: "center",
//             color: "black",
//             fontSize: 24,
//             fontFamily: "Pretendard",
//             fontWeight: 700,
//             lineHeight: "36px",
//             wordWrap: "break-word",
//           }}
//         >
//           여행 스타일 파악 완료!
//           <br />
//           이번엔 러너님의
//           <br />
//           러닝 스타일을 파악해볼게요
//         </div>
//       </div>

//       {/* 중앙 이미지 */}
//       <img
//         src="/emoticon.png"
//         alt="emoticon"
//         style={{
//           width: 150,
//           height: 150,
//           left: 105,
//           top: 300,
//           position: "absolute",
//         }}
//       />

//       {/* 다음 버튼 */}
//       <button
//         onClick={onNext}
//         style={{
//           width: 50,
//           height: 50,
//           left: 294,
//           top: 734,
//           position: "absolute",
//           borderRadius: 8,
//           border: "none",
//           background: "black",
//           cursor: "pointer",
//         }}
//       >
//         <div
//           style={{
//             width: 10,
//             height: 20,
//             margin: "auto",
//             borderLeft: "2px solid #FCFCFC",
//             borderBottom: "2px solid #FCFCFC",
//             transform: "rotate(-45deg)",
//           }}
//         />
//       </button>
//     </div>
//   );
// }
