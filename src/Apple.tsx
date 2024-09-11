import React, { useState, useEffect, useRef } from "react";
import { Wheel } from "react-custom-roulette";
import {
  Box,
  Button,
  ButtonProps,
  Modal,
  Snackbar,
  Alert,
  styled,
} from "@mui/material";
import { red } from "@mui/material/colors";
import { QrReader } from "react-qr-reader";
import "./App.css";

const images = [
  '/image/banana.png',
  '/image/corn.png',
  '/image/guri.gif',
  '/image/indian.png',
  '/image/onion.png',
  '/image/potato.png',
  '/image/shirimp.gif',
  '/image/sweetpotato.png',
  '/image/yook.png'
];

// 임시 데이터베이스 배열
const qrcodesDB = ["digitaltransformation", "nongshim", "lee", "park", "yoon", "jung", "joe"];

// 상품 재고 수량 (가정)
const inventory = {
  first: 1,  // 1등 상품 수량
  second: 2, // 2등 상품 수량
  third: 5,  // 3등 상품 수량
  fourth: 10 // 4등 상품 수량
};

// 데이터 타입 정의
interface PrizeData {
  option: string;
  style: {
    backgroundColor: string;
    textColor: string;
  };
  probability: number;
  imageUrl: string;
}

// 기존 데이터 배열 5개였던 룰렛 데이터를 10개로 확장합니다.
const data: PrizeData[] = [
  {
    option: "1등",
    style: { backgroundColor: "#FFD700", textColor: "black" }, // Gold for 1st prize
    probability: inventory.first > 0 ? 3 : 0,
    imageUrl: "https://cdn.funshop.co.kr//products/0000294741/vs_image800.jpg?1725245400",
  },
  {
    option: "2등",
    style: { backgroundColor: "#FF4500", textColor: "white" }, // Bright Orange for 2nd prize
    probability: inventory.second > 0 ? 7 : 0,
    imageUrl: "https://cdn.funshop.co.kr//products/0000262710/vs_image800.jpg?1725245520",
  },
  {
    option: "3등",
    style: { backgroundColor: "#32CD32", textColor: "white" }, // Lime Green for 3rd prize
    probability: inventory.third > 0 ? 15 : 0,
    imageUrl: "https://cdn.funshop.co.kr//products/0000204053/vs_image800.jpg?1725245580",
  },
  {
    option: "4등",
    style: { backgroundColor: "#000000", textColor: "white" }, // Black for 4th prize
    probability: inventory.fourth > 0 ? 25 : 0,
    imageUrl: "https://cdn.funshop.co.kr//products/0000281263/vs_image800.jpg?1725245640",
  },
  {
    option: "꽝",
    style: { backgroundColor: "#8B0000", textColor: "white" }, // Dark Red for 'Lose'
    probability: 50,
    imageUrl: "",
  },
  // 기존의 5개 데이터 복사하여 10개로 확장
  {
    option: "1등",
    style: { backgroundColor: "#FFD700", textColor: "black" }, // Duplicate for balance
    probability: inventory.first > 0 ? 3 : 0,
    imageUrl: "https://cdn.funshop.co.kr//products/0000294741/vs_image800.jpg?1725245400",
  },
  {
    option: "2등",
    style: { backgroundColor: "#FF4500", textColor: "white" }, // Duplicate for balance
    probability: inventory.second > 0 ? 7 : 0,
    imageUrl: "https://cdn.funshop.co.kr//products/0000262710/vs_image800.jpg?1725245520",
  },
  {
    option: "3등",
    style: { backgroundColor: "#32CD32", textColor: "white" }, // Duplicate for balance
    probability: inventory.third > 0 ? 15 : 0,
    imageUrl: "https://cdn.funshop.co.kr//products/0000204053/vs_image800.jpg?1725245580",
  },
  {
    option: "4등",
    style: { backgroundColor: "#000000", textColor: "white" }, // Duplicate for balance
    probability: inventory.fourth > 0 ? 25 : 0,
    imageUrl: "https://cdn.funshop.co.kr//products/0000281263/vs_image800.jpg?1725245640",
  },
  {
    option: "꽝",
    style: { backgroundColor: "#8B0000", textColor: "white" }, // Duplicate for balance
    probability: 50,
    imageUrl: "",
  },
];

const StartButton = styled(Button)<ButtonProps>(({ theme }) => ({
  marginTop: "20px",
  marginBottom: "50px", // 버튼과 GIF가 겹치지 않도록 추가
  width: "200px",
  fontSize: 20,
  color: "#fff",
  backgroundColor: red[500],
  padding: "10px",
  borderRadius: "10px",
  "&:hover": {
    backgroundColor: red[700],
    color: "#fff",
  },
}));


function App() {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [isResultShow, setIsResultShow] = useState<boolean>(false);
  const [noti, setNoti] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showGif, setShowGif] = useState(false);
  const [result, setResult] = useState<{ date: string; result: string; qrcode?: string }>({
    date: "",
    result: "",
  });
  const [lastGameTime, setLastGameTime] = useState<number | null>(null); // 최근 게임 시간 기록
  const [showSlotMachine, setShowSlotMachine] = useState(false);

  const currentAudio = useRef<HTMLAudioElement | null>(null); // 현재 재생 중인 오디오 트래킹

  const handleSlotMachineOpen = () => {
    setShowSlotMachine(true);
  };

  useEffect(() => {
    async function checkCameraPermission() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        console.log("Camera permission granted");
      } catch (err) {
        console.error("Camera permission error:", err);
        setCameraError("카메라 권한을 허용해주세요.");
      }
    }
    checkCameraPermission();
  }, []);

  // 오디오 재생 중단 함수
  const stopCurrentAudio = () => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
    }
  };

  const playAudio = (filePath: string, onEndedCallback?: () => void, interruptible: boolean = true) => {
    // 특정 파일(예: 룰렛 소리)은 중단되지 않도록 처리
    if (interruptible) {
      stopCurrentAudio(); // 새로운 오디오가 시작되면 기존 오디오 중지
    }

    try {
      const audio = new Audio(filePath);
      currentAudio.current = audio; // 현재 재생 중인 오디오 업데이트
      if (onEndedCallback) {
        audio.onended = onEndedCallback;
      }
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    } catch (error) {
      console.log("Audio file not found or could not be played:", filePath);
    }
  };

  // 최근 5분 내에 게임이 시작되었는지 체크
  const isRecentGameStarted = () => {
    if (!lastGameTime) return false;
    const now = Date.now();
    const fiveMinutesInMillis = 5 * 60 * 1000;
    return now - lastGameTime < fiveMinutesInMillis;
  };

  const handleScan = (result: any) => {
    if (result) {
      const scannedText = result.text;
      setUser(scannedText);
      console.log("Scanned QR URL:", scannedText);

      // DB 검증 로직
      stopCurrentAudio(); // QR 스캔 시 기존 오디오 중단
      if (qrcodesDB.includes(scannedText)) {
        setResult(prev => ({
          ...prev,
          date: new Date().toISOString(),
          qrcode: scannedText,
        }));
        setShowQR(false);
        playAudio('/asset/verify.mp3'); // QR 인증 성공 시 음성 재생
        handleAuthenticationSuccess();
      } else {
        playAudio('/asset/retry.mp3'); // 불일치 피드백
        setNoti({ type: "error", message: "없는 정보입니다" });
        setShowQR(false);
      }
    } else if (result === null) {
      console.log("No QR code found");
    } else if (result instanceof Error) {
      console.error("QR Reader error:", result);
      setCameraError('QR 스캐너 오류: ${result.message}');
      setShowQR(false);
    }
  };

  const startSpeechRecognition = () => {
    if (isRecentGameStarted()) {
      console.log("최근 5분 내에 게임이 시작되었습니다. 음성 인식을 생략합니다.");
      handleSpinClick(); // 음성 인식 없이 바로 게임 진행
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript.trim();
      console.log("Speech recognition result:", speechResult);

      if (speechResult.includes("게임시작") || speechResult.includes("시작")) {
        playAudio('/asset/intro.mp3'); // 게임 시작 안내 음성
        handleSpinClick();
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      playAudio('/asset/intro.mp3'); // 게임 시작 안내 음성
      handleSpinClick();
    };

    recognition.start();
  };

  const handleSpinClick = () => {
    if (mustSpin || showQR) return;
    setShowQR(true);
  };

  const handleAuthenticationSuccess = () => {
    setNoti({ type: "success", message: "인증이 완료되었습니다" });
    setTimeout(() => {
      setNoti(null);
      startRoulette();
    }, 1000);
  };

  const startRoulette = () => {
    const probabilities = data.map((item) => item.probability);
    const totalProbability = probabilities.reduce((acc, curr) => acc + curr, 0);
    const random = Math.random() * totalProbability;

    let cumulativeProbability = 0;
    let selectedIndex = 0;

    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProbability += probabilities[i];
      if (random < cumulativeProbability) {
        selectedIndex = i;
        break;
      }
    }

    setPrizeNumber(selectedIndex);
    playAudio('/asset/wheel.mp3', undefined, false); // 룰렛 소리 파일: interruptible=false로 중단되지 않음
    setMustSpin(true);
    setLastGameTime(Date.now()); // 게임 시작 시간을 현재로 기록
  };

  const saveResult = () => {
    const resultData = {
      ...result,
      result: data[prizeNumber]?.option || "Unknown",
    };

    console.log("Result:", resultData);

    // 당첨에 따른 음성 재생
    const prizeOption = data[prizeNumber]?.option;
    if (prizeOption) {
      if (prizeOption === "꽝") {
        // 꽝: fail1을 3초만 재생 후 fail 재생
        playAudio('/asset/fail1.mp3', () => playAudio('/asset/fail.mp3'));
      } else {
        // 당첨: win1을 3초만 재생 후 win 재생
        playAudio('/asset/win1.mp3', () => playAudio('/asset/win.mp3'));
      }
    }

    // 1등, 2등, 3등, 4등일 경우 슬롯머신 팝업을 표시
    if (["1등", "2등", "3등", "4등"].includes(prizeOption)) {
      setShowSlotMachine(true);  // 슬롯머신 팝업 띄움
    }

    if (prizeOption === "1등") {
      // 1등 당첨 시 GIF 애니메이션 표시
      setShowGif(true);
      setTimeout(() => {
        setShowGif(false);
        setIsResultShow(true);
      }, 2000); // 2초간 GIF 표시 후 숨김
    } else {
      setIsResultShow(true);
    }
  };

  const getResultMessage = () => {
    switch (data[prizeNumber].option) {
      case "1등":
        return "🥇1등 당첨🎉";
      case "2등":
        return "🥈2등 당첨🎁";
      case "3등":
        return "🥉3등 당첨👏";
      case "4등":
        return "📦4등 당첨😉";
      case "꽝":
        return "🧨꽝💥";
      default:
        return "";
    }
  };

  return (
    <>
      <div className="roulette-layout">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',  // 세로로 정렬
          justifyContent: 'center', 
          alignItems: 'center', 
          position: 'relative', 
          width: '100%', 
          height: 'auto',
        }}>
          <img 
            src="/image/wheel.png" 
            alt="Wheel Background" 
            style={{ 
              position: 'absolute', 
              zIndex: 1, 
              width: '48%', 
              top: '45%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)' 
            }} 
          />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <Wheel
              mustStartSpinning={mustSpin}
              data={data.map((item) => ({
                option: item.option,
                style: item.style,
              }))}
              prizeNumber={prizeNumber}
              outerBorderWidth={2}
              innerBorderWidth={2}
              radiusLineWidth={3}
              innerRadius={0}
              fontSize={20}
              onStopSpinning={() => {
                setMustSpin(false);
                saveResult();
              }}
              spinDuration={1}
              backgroundColors={data.map((item) => item.style.backgroundColor)}
              textColors={data.map((item) => item.style.textColor)}
            />
          </div>
          <StartButton
            variant="outlined"
            size="large"
            onClick={startSpeechRecognition}
            style={{
              zIndex: 3,
              marginTop: '20px', // 버튼이 룰렛 아래로 배치되도록 여백 추가
            }}
          >
            Start
          </StartButton>
        </div>
      </div>


      <div style={{ 
        position: "absolute", 
        bottom: 0, 
        left: "50%", 
        transform: "translate(-50%, 0)", // translateY는 0으로 설정하여 Y축 이동을 막습니다.
        display: "flex", // 플렉스 박스 사용
        justifyContent: "center", // 수평 중앙 정렬
        width: "100%"
      }}>
        <img 
          src="https://media.tenor.com/WUWygJ0Fwz8AAAAM/jago33-slot-machine.gif" 
          alt="Slot Machine GIF" 
          style={{ width: "150px" }} 
        />
      </div>

    
      
      <Modal
        open={showQR}
        onClose={() => {
          setShowQR(false);
        }}
        style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Box
          style={{
            width: "300px", // 가로 크기 조정
            height: "300px", // 세로 크기 조정
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          {cameraError ? (
            <div>{cameraError}</div>
          ) : (
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              containerStyle={{ width: "100%", height: "100%" }}
              videoStyle={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          <Button
            onClick={() => setShowQR(false)}
            style={{
              marginTop: "10px",
              position: "absolute",
              bottom: "10px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            닫기
          </Button>
        </Box>
      </Modal>

      {showGif && (
        <Modal
          open={true}
          style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <img
            src="https://i.namu.wiki/i/aEaRClFwgm0hl2PFb7-j20_WC99GnPFUkg6njz_IckIXXx_UZDELGldWijSZw-IqYOFXeUJNF41HESd380w0Og.gif"
            alt="1등 당첨 축하 GIF"
            style={{ width: "100vw", height: "100vh", objectFit: "cover" }}
          />
        </Modal>
      )}

      <Modal
        open={isResultShow}
        onClose={() => {
          setIsResultShow(false);
        }}
        style={{ cursor: "pointer" }}
        onClick={() => {
          setIsResultShow(false);
        }}
      >
        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            backgroundColor: "rgba(255, 255, 255, 0.9)", // 투명도 10% (0.9)
            width: "640px", // 크기 조정
            height: "360px", // 크기 조정
            maxWidth: "100vw",
            maxHeight: "100vh",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            overflowY: "auto",
          }}
        >
          {data[prizeNumber].imageUrl && (
            <img
              src={data[prizeNumber].imageUrl}
              alt={data[prizeNumber].option}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0.5,
                objectFit: "cover",
              }}
            />
          )}
          <span
            style={{
              fontSize: "60px",
              color: "black",
              zIndex: 2,
            }}
          >
            {getResultMessage()}
          </span>
        </Box>
      </Modal>

      <Modal
        open={showSlotMachine}
        onClose={() => setShowSlotMachine(false)}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Box style={{ width: '50vw', height: '50vh', backgroundColor: 'white' }}>
          <iframe 
            src="/slot-machine.html"             
            sandbox="allow-same-origin allow-scripts" 
            style={{ width: '100%', height: '100%' }} 
          />
        </Box>
      </Modal>



      <Snackbar
        open={!!noti}
        onClose={() => {
          setNoti(null);
        }}
        autoHideDuration={3000}
      >
        <Alert severity={noti?.type} variant="filled" sx={{ width: "100%" }}>
          {noti?.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
