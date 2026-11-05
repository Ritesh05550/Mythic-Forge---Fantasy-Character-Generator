import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character } from '../../types/character';
import { RunDistanceConfig, GameEnvironment } from '../../types/game';
import { 
  playCoinSound, 
  playShieldSound, 
  playShieldBreakSound, 
  playGameOverSound, 
  playXpBoostSound, 
  playLaneSwitchSound,
  playJumpSound,
  playSlideSound,
  playHeartbeatSound,
  FANTASY_TRACKS,
  switchTrack,
  startFantasyMusic,
  getCurrentTrackIndex
} from '../../utils/audio';
import { 
  Shield, 
  Coins, 
  Zap, 
  Flame, 
  MapPin, 
  Video, 
  VideoOff, 
  Hand, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles,
  AlertTriangle,
  Flag,
  ArrowUp,
  ArrowDown,
  Heart,
  Navigation,
  Download,
  Award,
  Music2,
  CheckCircle2,
  X,
  Upload,
  Camera,
  Trash2,
  User
} from 'lucide-react';

interface HorrorRunnerGameProps {
  character: Character;
  distanceConfig: RunDistanceConfig;
  isMuted: boolean;
  onExitGame: () => void;
}

interface Obstacle3D {
  id: number;
  lane: 0 | 1 | 2; // 0: Left, 1: Center, 2: Right
  z: number; // 0 (horizon) -> 100 (player impact)
  type: 'DEMON_BEHEMOTH' | 'IRON_GUILLOTINE' | 'SCREAMING_BANSHEE' | 'HELLFIRE_CHASM';
  name: string;
  isLow?: boolean; // Requires JUMP
  isHigh?: boolean; // Requires SLIDE
  cleared?: boolean;
}

interface Collectible3D {
  id: number;
  lane: 0 | 1 | 2;
  z: number;
  type: 'COIN' | 'SHIELD';
}

interface RoadsideObject3D {
  id: number;
  z: number;
  side: -1 | 1; // -1: Left curb, 1: Right curb
  type: 'STREETLAMP' | 'GARGOYLE_PILLAR' | 'GNARLED_OAK' | 'TOMBSTONE';
}

interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  decay: number;
}

interface FloatingScoreText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export const HorrorRunnerGame: React.FC<HorrorRunnerGameProps> = ({
  character,
  distanceConfig,
  isMuted,
  onExitGame
}) => {
  // Game States
  const [gameState, setGameState] = useState<'PLAYING' | 'GAME_OVER' | 'VICTORY'>('PLAYING');
  const [lane, setLane] = useState<0 | 1 | 2>(1); // Target lane (0, 1, 2)
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(26);
  const [coins, setCoins] = useState(0);
  const [xp, setXp] = useState(0);

  // Personalized Victory Name Entry & Badge Download with Photo Upload
  const [playerName, setPlayerName] = useState(character.name);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [isDownloadingBadge, setIsDownloadingBadge] = useState(false);
  const [badgeDownloaded, setBadgeDownloaded] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUploadedPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setUploadedPhotoUrl(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // In-Game Music Soundtrack Selector
  const [inGameTrackIndex, setInGameTrackIndex] = useState(() => getCurrentTrackIndex());
  const [showInGameMusic, setShowInGameMusic] = useState(false);

  // Player Stance (Run, Jump, Slide)
  const [playerStance, setPlayerStance] = useState<'RUN' | 'JUMP' | 'SLIDE'>('RUN');
  const stanceTimerRef = useRef(0);

  // Stats & Health
  const startingShields = Math.max(2, 3 + Math.floor((character.armorClass - 10) / 4));
  const [shields, setShields] = useState(startingShields);
  const [currentHp, setCurrentHp] = useState(character.hp);
  const [isHitFlashing, setIsHitFlashing] = useState(false);
  const [isSpeedBoosted, setIsSpeedBoosted] = useState(false);

  // Dynamic Environment Cycling
  const [environment, setEnvironment] = useState<GameEnvironment>('CITY_STREETS');
  const [transitionNotice, setTransitionNotice] = useState<string | null>(null);

  // Gesture & Webcam state
  const [webcamActive, setWebcamActive] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<'LEFT' | 'CENTER' | 'RIGHT' | 'NONE'>('NONE');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Touch & Swipe gestures tracking
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);

  // Canvas Viewport Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Entity Simulation Refs
  const obstaclesRef = useRef<Obstacle3D[]>([]);
  const collectiblesRef = useRef<Collectible3D[]>([]);
  const roadsideObjectsRef = useRef<RoadsideObject3D[]>([]);
  const particlesRef = useRef<ParticleEffect[]>([]);
  const floatingTextsRef = useRef<FloatingScoreText[]>([]);
  const nextId = useRef(1);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const spawnTimerRef = useRef(0);
  const roadsideTimerRef = useRef(0);
  const heartbeatTimerRef = useRef(0);
  const cameraShakeRef = useRef(0);

  // Smooth Player X position (for fluid lean & lane transition physics)
  const playerXRef = useRef<number>(0.5); // 0.0 (left) to 1.0 (right)
  const targetXRef = useRef<number>(0.5);
  const runCycleRef = useRef<number>(0);
  const capeWaveRef = useRef<number>(0);

  // Lane Change with sound & smooth target calculation
  const changeLane = useCallback((targetLane: 0 | 1 | 2) => {
    if (gameState !== 'PLAYING') return;
    setLane((prev) => {
      if (prev !== targetLane) {
        playLaneSwitchSound(isMuted);
        targetXRef.current = targetLane === 0 ? 0.22 : targetLane === 1 ? 0.5 : 0.78;
        return targetLane;
      }
      return prev;
    });
  }, [gameState, isMuted]);

  // Jump Action (Vaulting over spikes/barricades)
  const triggerJump = useCallback(() => {
    if (gameState !== 'PLAYING' || playerStance !== 'RUN') return;
    setPlayerStance('JUMP');
    playJumpSound(isMuted);
    stanceTimerRef.current = 0.6;
    cameraShakeRef.current = 2.5;

    const canvas = canvasRef.current;
    if (canvas) {
      const pX = canvas.width * playerXRef.current;
      const pY = canvas.height - 40;
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({
          x: pX + (Math.random() - 0.5) * 20,
          y: pY,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 2 + 1,
          size: Math.random() * 4 + 2,
          alpha: 0.8,
          color: '#38bdf8',
          decay: 2.2
        });
      }
    }
  }, [gameState, playerStance, isMuted]);

  // Slide Action (Combat slide under hanging phantoms)
  const triggerSlide = useCallback(() => {
    if (gameState !== 'PLAYING' || playerStance !== 'RUN') return;
    setPlayerStance('SLIDE');
    playSlideSound(isMuted);
    stanceTimerRef.current = 0.68;
    cameraShakeRef.current = 2.0;

    const canvas = canvasRef.current;
    if (canvas) {
      const pX = canvas.width * playerXRef.current;
      const pY = canvas.height - 35;
      for (let i = 0; i < 10; i++) {
        particlesRef.current.push({
          x: pX + (Math.random() - 0.5) * 25,
          y: pY,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3,
          size: Math.random() * 3 + 1.5,
          alpha: 0.9,
          color: '#f59e0b',
          decay: 2.8
        });
      }
    }
  }, [gameState, playerStance, isMuted]);

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setLane((prev) => {
          const next = (prev > 0 ? prev - 1 : 0) as 0 | 1 | 2;
          changeLane(next);
          return next;
        });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setLane((prev) => {
          const next = (prev < 2 ? prev + 1 : 2) as 0 | 1 | 2;
          changeLane(next);
          return next;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') {
        e.preventDefault();
        triggerJump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        triggerSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, changeLane, triggerJump, triggerSlide]);

  // Touch Swipe Gesture Detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: performance.now()
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
    const deltaTime = performance.now() - touchStartPos.current.time;

    touchStartPos.current = null;

    if (deltaTime > 600) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > 35 && absX > absY) {
      if (deltaX > 0) {
        setLane((prev) => {
          const next = (prev < 2 ? prev + 1 : 2) as 0 | 1 | 2;
          changeLane(next);
          return next;
        });
      } else {
        setLane((prev) => {
          const next = (prev > 0 ? prev - 1 : 0) as 0 | 1 | 2;
          changeLane(next);
          return next;
        });
      }
    } else if (absY > 35 && absY > absX) {
      if (deltaY < 0) {
        triggerJump();
      } else {
        triggerSlide();
      }
    }
  };

  // Direct Mouse / Touch Drag Steering across the 3 lanes
  const handlePointerTrack = (clientX: number, targetRect: DOMRect) => {
    const relativeX = (clientX - targetRect.left) / targetRect.width;
    if (relativeX < 0.36) {
      changeLane(0);
    } else if (relativeX > 0.64) {
      changeLane(2);
    } else {
      changeLane(1);
    }
  };

  // Webcam Hand Motion Sensor
  const toggleWebcamTracking = async () => {
    if (webcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
      setDetectedGesture('NONE');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setWebcamActive(true);
        }
      } catch {
        alert('Webcam sensor could not be started. Keyboard and touch/mouse controls are active!');
        setWebcamActive(false);
      }
    }
  };

  // Webcam Motion frame processing
  useEffect(() => {
    if (!webcamActive) return;

    let cancel = false;
    let lastFrameData: Uint8ClampedArray | null = null;

    const processMotion = () => {
      if (cancel || !videoRef.current || !motionCanvasRef.current) return;
      const video = videoRef.current;
      const canvas = motionCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, 60, 45);
        const frame = ctx.getImageData(0, 0, 60, 45);
        const data = frame.data;

        if (lastFrameData) {
          let leftDiff = 0;
          let centerDiff = 0;
          let rightDiff = 0;

          for (let y = 0; y < 45; y++) {
            for (let x = 0; x < 60; x++) {
              const i = (y * 60 + x) * 4;
              const diff = Math.abs(data[i] - lastFrameData[i]);
              if (diff > 25) {
                if (x < 20) rightDiff += diff;
                else if (x < 40) centerDiff += diff;
                else leftDiff += diff;
              }
            }
          }

          const threshold = 1700;
          if (leftDiff > threshold && leftDiff > centerDiff && leftDiff > rightDiff) {
            setDetectedGesture('LEFT');
            changeLane(0);
          } else if (rightDiff > threshold && rightDiff > centerDiff && rightDiff > leftDiff) {
            setDetectedGesture('RIGHT');
            changeLane(2);
          } else if (centerDiff > threshold && centerDiff > leftDiff && centerDiff > rightDiff) {
            setDetectedGesture('CENTER');
            changeLane(1);
          }
        }

        lastFrameData = new Uint8ClampedArray(data);
      }

      requestAnimationFrame(processMotion);
    };

    const timer = setTimeout(processMotion, 250);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [webcamActive, changeLane]);

  // In-Game "XP Gain" Boosters
  const handleXpSurge = () => {
    if (gameState !== 'PLAYING') return;
    setXp((prev) => prev + 50);
    setSpeedKmh((prev) => Math.min(48, prev + 4));
    playXpBoostSound(isMuted);
    setIsSpeedBoosted(true);
    cameraShakeRef.current = 4.0;

    floatingTextsRef.current.push({
      id: nextId.current++,
      x: 0.5,
      y: 0.6,
      text: '+50 XP SURGE!',
      color: '#f59e0b',
      alpha: 1,
      vy: -0.06
    });

    setTimeout(() => setIsSpeedBoosted(false), 2600);
  };

  const handleSprintSurge = () => {
    if (gameState !== 'PLAYING') return;
    setXp((prev) => prev + 100);
    setDistanceMeters((prev) => prev + 60);
    setSpeedKmh((prev) => Math.min(54, prev + 8));
    playXpBoostSound(isMuted);
    setIsSpeedBoosted(true);
    cameraShakeRef.current = 6.0;

    floatingTextsRef.current.push({
      id: nextId.current++,
      x: 0.5,
      y: 0.55,
      text: 'OVERDRIVE SPRINT! +100 XP',
      color: '#c084fc',
      alpha: 1,
      vy: -0.07
    });

    setTimeout(() => setIsSpeedBoosted(false), 3200);
  };

  // Generate and Download Personalized Achievement Badge / Certificate with Circular Photo Frame
  const handleDownloadAchievementBadge = async () => {
    setIsDownloadingBadge(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 1200;
      const height = 800;

      // Load uploaded portrait photo (or hero fallback)
      const photoSrc = uploadedPhotoUrl || character.activePortraitUrl || character.imagePath;
      let portraitImg: HTMLImageElement | null = null;
      if (photoSrc) {
        portraitImg = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = photoSrc;
        });
      }

      // Load Founder Signature Image (User attached authentic signature of Ritesh Kumar)
      let signatureImg: HTMLImageElement | null = null;
      try {
        signatureImg = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = '/assets/aistudio/image_ea57dae4.png';
        });
      } catch {
        // Fallback handled in rendering
      }

      // 1. Deep Imperial Obsidian / Dark Parchment Background
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, 700);
      bgGrad.addColorStop(0, '#101726');
      bgGrad.addColorStop(0.6, '#080d17');
      bgGrad.addColorStop(1, '#020408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle starfield texture
      ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
      for (let x = 40; x < width - 40; x += 30) {
        for (let y = 40; y < height - 40; y += 30) {
          if ((x + y) % 60 === 0) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2. Ornate 24k Gold Double Filigree Border
      const borderGold = ctx.createLinearGradient(0, 0, width, height);
      borderGold.addColorStop(0, '#f59e0b');
      borderGold.addColorStop(0.25, '#fef08a');
      borderGold.addColorStop(0.5, '#d97706');
      borderGold.addColorStop(0.75, '#fef08a');
      borderGold.addColorStop(1, '#b45309');

      ctx.strokeStyle = borderGold;
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Inner Accent Border
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(46, 46, width - 92, height - 92);

      // Corner Knotwork Accents
      const corners = [
        { x: 46, y: 46, dx: 1, dy: 1 },
        { x: width - 46, y: 46, dx: -1, dy: 1 },
        { x: 46, y: height - 46, dx: 1, dy: -1 },
        { x: width - 46, y: height - 46, dx: -1, dy: -1 }
      ];

      corners.forEach(({ x, y, dx, dy }) => {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + dy * 35);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * 35, y);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(x + dx * 16, y);
        ctx.lineTo(x, y + dy * 16);
        ctx.lineTo(x - dx * 16, y);
        ctx.lineTo(x, y - dy * 16);
        ctx.closePath();
        ctx.fill();
      });

      // 3. Royal Guild Header
      ctx.textAlign = 'center';

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 15px "Space Mono", monospace';
      ctx.fillText('MYTHIC FORGE · IMPERIAL GUILD OF ADVENTURERS', width / 2, 95);

      ctx.font = '900 36px "Cinzel Decorative", serif';
      ctx.fillStyle = borderGold;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
      ctx.shadowBlur = 15;
      ctx.fillText('ROYAL CHARTER OF EXPEDITION CONQUEST', width / 2, 146);
      ctx.shadowBlur = 0;

      ctx.font = 'italic 16px "Cinzel", serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Commemorating Extraordinary Survival & Valor Across the Blackwood Gauntlet', width / 2, 180);

      // Divider Line with Centered Diamond
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 250, 198);
      ctx.lineTo(width / 2 + 250, 198);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(width / 2, 198, 5, 0, Math.PI * 2);
      ctx.fill();

      // 4. CIRCULAR PORTRAIT PHOTO FRAME (Positioned prominently next to User's Name and aligned above Founder's signature block)
      const portraitCenterX = 235;
      const portraitCenterY = 295;
      const portraitRadius = 60; // 120px diameter

      ctx.save();
      // Glowing gold outer frame
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = borderGold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(portraitCenterX, portraitCenterY, portraitRadius + 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(portraitCenterX, portraitCenterY, portraitRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Clip image inside circular frame
      if (portraitImg) {
        ctx.beginPath();
        ctx.arc(portraitCenterX, portraitCenterY, portraitRadius - 2, 0, Math.PI * 2);
        ctx.clip();

        const imgW = portraitImg.naturalWidth || portraitImg.width || 100;
        const imgH = portraitImg.naturalHeight || portraitImg.height || 100;
        const minDim = Math.min(imgW, imgH);
        const sx = (imgW - minDim) / 2;
        const sy = (imgH - minDim) / 2;

        ctx.drawImage(
          portraitImg,
          sx, sy, minDim, minDim,
          portraitCenterX - portraitRadius,
          portraitCenterY - portraitRadius,
          portraitRadius * 2,
          portraitRadius * 2
        );
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(portraitCenterX, portraitCenterY, portraitRadius - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️', portraitCenterX, portraitCenterY + 12);
      }
      ctx.restore();

      // Ribbon tag beneath circular portrait
      ctx.save();
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(portraitCenterX - 65, portraitCenterY + portraitRadius - 6, 130, 20);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(portraitCenterX - 65, portraitCenterY + portraitRadius - 6, 130, 20);
      ctx.font = 'bold 10px "Space Mono", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('HONORED HERO', portraitCenterX, portraitCenterY + portraitRadius + 8);
      ctx.restore();

      // Recipient Proclamation & User's Name (Placed prominently to the right of the circular portrait frame)
      ctx.textAlign = 'left';
      ctx.font = '16px "Cinzel", serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Be it witnessed and decreed across all realms that', 335, 245);

      const recipient = (playerName.trim() || character.name).toUpperCase();
      ctx.font = '900 48px "Cinzel Decorative", serif';
      const nameGrad = ctx.createLinearGradient(335, 265, 950, 315);
      nameGrad.addColorStop(0, '#fef08a');
      nameGrad.addColorStop(0.5, '#ffffff');
      nameGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = nameGrad;
      ctx.shadowColor = 'rgba(254, 240, 138, 0.6)';
      ctx.shadowBlur = 20;
      ctx.fillText(recipient, 335, 302);
      ctx.shadowBlur = 0;

      ctx.font = 'bold 18px "Cinzel", serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(
        `Heroic ${character.characterClass} of the Realm · Victorious Expeditionist`,
        335,
        340
      );

      // 5. THREE STAT BADGE CARDS
      const cardY = 388;
      const cardW = 310;
      const cardH = 152;
      const cards = [
        {
          label: 'DISTANCE CONQUERED',
          value: `${distanceConfig.targetMeters.toLocaleString()} METERS`,
          detail: `${distanceConfig.name} Completed`,
          color: '#f59e0b',
          x: width / 2 - 340
        },
        {
          label: 'TOTAL XP ACCUMULATED',
          value: `+${xp} XP`,
          detail: 'Heroic Experience Gained',
          color: '#c084fc',
          x: width / 2
        },
        {
          label: 'GUILD COINS PLUNDERED',
          value: `${coins} COINS`,
          detail: 'Imperial Wealth Claimed',
          color: '#38bdf8',
          x: width / 2 + 340
        }
      ];

      cards.forEach((card) => {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = card.color;
        ctx.lineWidth = 1.5;
        ctx.fillRect(card.x - cardW / 2, cardY, cardW, cardH);
        ctx.strokeRect(card.x - cardW / 2, cardY, cardW, cardH);

        ctx.font = 'bold 12px "Space Mono", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(card.label, card.x, cardY + 36);

        ctx.font = '900 28px "Space Mono", monospace';
        ctx.fillStyle = card.color;
        ctx.fillText(card.value, card.x, cardY + 84);

        ctx.font = '13px "Cinzel", serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(card.detail, card.x, cardY + 122);
      });

      // 6. EXPEDITION TELEMETRY DETAILS
      const detailY = 585;
      ctx.font = '14px "Space Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = Math.floor(timeElapsed % 60);
      const timeStr = `${minutes}m ${seconds}s`;
      ctx.fillText(
        `Survival Time: ${timeStr}   ·   Average Pace: ${speedKmh} km/h   ·   Shields: ${shields} Remaining   ·   Vitals: ${currentHp}/${character.hp} HP`,
        width / 2,
        detailY
      );

      // 7. FOUNDER'S SIGNATURE BLOCK & ROYAL WAX SEAL
      // Founder's Signature Block on Bottom Left (prominently beneath and aligned with the portrait)
      ctx.save();
      ctx.textAlign = 'left';

      // "FOUNDER SIGNATURE" header label
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('OFFICIAL FOUNDER SIGNATURE & SEAL:', 110, height - 158);

      // Render authentic handwritten signature of Founder Ritesh Kumar from user attachment
      if (signatureImg) {
        try {
          const sigCanvas = document.createElement('canvas');
          const sW = signatureImg.naturalWidth || signatureImg.width || 400;
          const sH = signatureImg.naturalHeight || signatureImg.height || 250;
          sigCanvas.width = sW;
          sigCanvas.height = sH;
          const sCtx = sigCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(signatureImg, 0, 0, sW, sH);
            const imgData = sCtx.getImageData(0, 0, sW, sH);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i];
              const g = d[i + 1];
              const b = d[i + 2];
              const brightness = (r + g + b) / 3;
              // Extract ink: paper is bright (>180), ink is dark (<130)
              const inkAlpha = Math.max(0, Math.min(255, (215 - brightness) * 2.8));
              d[i] = 254;     // Gold R (#fef08a)
              d[i + 1] = 240; // Gold G
              d[i + 2] = 138; // Gold B
              d[i + 3] = Math.round(inkAlpha);
            }
            sCtx.putImageData(imgData, 0, 0);

            // Draw processed authentic gold signature above the line
            ctx.shadowColor = 'rgba(254, 240, 138, 0.7)';
            ctx.shadowBlur = 10;
            ctx.drawImage(sigCanvas, 110, height - 195, 175, 75);
            ctx.shadowBlur = 0;
          }
        } catch {
          ctx.font = 'italic 34px "Brush Script MT", "Cinzel Decorative", cursive, serif';
          ctx.fillStyle = '#fef08a';
          ctx.fillText('Ritesh Kumar', 115, height - 128);
        }
      } else {
        ctx.font = 'italic 34px "Brush Script MT", "Cinzel Decorative", cursive, serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText('Ritesh Kumar', 115, height - 128);
      }

      // Golden Signature Rule with flourish
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(110, height - 120);
      ctx.lineTo(460, height - 120);
      ctx.stroke();

      // Delicate signature ink loop underline
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(320, height - 120);
      ctx.quadraticCurveTo(390, height - 110, 460, height - 124);
      ctx.stroke();

      // Prominent Founder Printed Name: RITESH KUMAR
      ctx.font = '900 17px "Cinzel Decorative", serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('RITESH KUMAR', 110, height - 97);

      // Founder & Grand Chancellor Title
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('FOUNDER & GRAND CHANCELLOR OF THE MYTHIC FORGE', 110, height - 79);

      // Imperial Certification Subtitle & Date
      ctx.font = '10px "Space Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Imperial Charter Certification & Seal of Valorous Merit', 110, height - 63);

      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      ctx.fillText(`CONFERRED THIS DAY: ${dateStr.toUpperCase()}`, 110, height - 48);
      ctx.restore();

      // Wax Seal on Bottom Right
      const sealX = width - 175;
      const sealY = height - 125;
      const sealRad = 48;

      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(sealX - 18, sealY + 20);
      ctx.lineTo(sealX - 28, sealY + 75);
      ctx.lineTo(sealX - 14, sealY + 65);
      ctx.lineTo(sealX, sealY + 75);
      ctx.lineTo(sealX - 6, sealY + 20);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sealX + 6, sealY + 20);
      ctx.lineTo(sealX, sealY + 75);
      ctx.lineTo(sealX + 14, sealY + 65);
      ctx.lineTo(sealX + 28, sealY + 75);
      ctx.lineTo(sealX + 18, sealY + 20);
      ctx.closePath();
      ctx.fill();

      const waxGrad = ctx.createRadialGradient(sealX - 10, sealY - 10, 5, sealX, sealY, sealRad);
      waxGrad.addColorStop(0, '#dc2626');
      waxGrad.addColorStop(0.7, '#991b1b');
      waxGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = waxGrad;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealRad, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealRad - 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 20px serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚔️', sealX, sealY + 2);

      ctx.font = 'bold 8px "Space Mono", monospace';
      ctx.fillText('RITESH KUMAR', sealX, sealY + 20);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      const cleanName = (playerName.trim() || character.name).replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadAnchor.download = `Mythic_Forge_Conqueror_${cleanName}.png`;
      downloadAnchor.href = dataUrl;
      downloadAnchor.click();

      setBadgeDownloaded(true);
      setTimeout(() => setBadgeDownloaded(false), 4500);
    } catch (err) {
      console.error('Badge generation error:', err);
    } finally {
      setIsDownloadingBadge(false);
    }
  };

  // MAIN LIVE 3D CANVAS RUNNING ENGINE
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let roadOffset = 0;

    const loop = (currentTime: number) => {
      const deltaSec = Math.min(0.08, (currentTime - lastTimeRef.current) / 1000);
      lastTimeRef.current = currentTime;

      const width = (canvas.width = canvas.parentElement?.clientWidth || 820);
      const height = (canvas.height = 540);

      // Camera Shake decay
      let shakeX = 0;
      let shakeY = 0;
      if (cameraShakeRef.current > 0.05) {
        shakeX = (Math.random() - 0.5) * cameraShakeRef.current * 4;
        shakeY = (Math.random() - 0.5) * cameraShakeRef.current * 4;
        cameraShakeRef.current *= 0.88;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Stance duration timer (Jump/Slide)
      if (playerStance !== 'RUN') {
        stanceTimerRef.current -= deltaSec;
        if (stanceTimerRef.current <= 0) {
          setPlayerStance('RUN');
        }
      }

      // Smooth horizontal lane interpolation (banking physics)
      const diffX = targetXRef.current - playerXRef.current;
      playerXRef.current += diffX * Math.min(1, deltaSec * 15);
      const bankAngle = diffX * 0.45;

      runCycleRef.current += deltaSec * (speedKmh * 0.42);
      capeWaveRef.current += deltaSec * (speedKmh * 0.6);

      // Periodic tense heartbeat
      heartbeatTimerRef.current += deltaSec;
      if (heartbeatTimerRef.current > Math.max(0.5, 1.8 - speedKmh * 0.024)) {
        heartbeatTimerRef.current = 0;
        playHeartbeatSound(isMuted);
      }

      // Distance advancement
      const advanceMeters = (speedKmh * 1000 / 3600) * deltaSec * 4.4;
      setDistanceMeters((prev) => {
        const next = prev + advanceMeters;
        if (next >= distanceConfig.targetMeters) {
          setGameState('VICTORY');
          return distanceConfig.targetMeters;
        }

        // Environment Stage Switch (every 450m for 1K, every 1,200m for longer runs)
        const switchInterval = distanceConfig.targetMeters <= 1000 ? 450 : 1200;
        const stageIndex = Math.floor(next / switchInterval) % 2;
        const targetEnv: GameEnvironment = stageIndex === 0 ? 'CITY_STREETS' : 'HORROR_FOREST';

        setEnvironment((currEnv) => {
          if (currEnv !== targetEnv) {
            setTransitionNotice(
              targetEnv === 'HORROR_FOREST'
                ? 'ENTERING THE HAUNTED DEEP BLACKWOOD'
                : 'SURVIVED: RETURNING TO GOTHIC CITY COBBLES'
            );
            setTimeout(() => setTransitionNotice(null), 3500);
            return targetEnv;
          }
          return currEnv;
        });

        return next;
      });

      setTimeElapsed((prev) => prev + deltaSec);

      // Spawn Roadside Scenery (Streetlamps, Gargoyles, Gnarled Trees)
      roadsideTimerRef.current += deltaSec;
      if (roadsideTimerRef.current > Math.max(0.35, 0.7 - speedKmh * 0.008)) {
        roadsideTimerRef.current = 0;
        const side = Math.random() < 0.5 ? -1 : 1;
        const isCity = environment === 'CITY_STREETS';
        const type = isCity 
          ? (Math.random() < 0.65 ? 'STREETLAMP' : 'GARGOYLE_PILLAR')
          : (Math.random() < 0.75 ? 'GNARLED_OAK' : 'TOMBSTONE');

        roadsideObjectsRef.current.push({
          id: nextId.current++,
          z: 0,
          side,
          type
        });
      }

      // Spawn Obstacles & Collectibles
      spawnTimerRef.current += deltaSec;
      if (spawnTimerRef.current > Math.max(0.68, 1.25 - speedKmh * 0.014)) {
        spawnTimerRef.current = 0;
        const spawnLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;

        if (Math.random() > 0.32) {
          const types: Array<'DEMON_BEHEMOTH' | 'IRON_GUILLOTINE' | 'SCREAMING_BANSHEE' | 'HELLFIRE_CHASM'> = [
            'DEMON_BEHEMOTH', 'IRON_GUILLOTINE', 'SCREAMING_BANSHEE', 'HELLFIRE_CHASM'
          ];
          const type = types[Math.floor(Math.random() * types.length)];
          const names = {
            DEMON_BEHEMOTH: 'Stalking Shadow Fiend',
            IRON_GUILLOTINE: 'Spiked Guillotine Barricade',
            SCREAMING_BANSHEE: 'Screaming Banshee Shroud',
            HELLFIRE_CHASM: 'Abyssal Hellfire Pit'
          };

          obstaclesRef.current.push({
            id: nextId.current++,
            lane: spawnLane,
            z: 0,
            type,
            name: names[type],
            isLow: type === 'IRON_GUILLOTINE',
            isHigh: type === 'SCREAMING_BANSHEE'
          });
        } else {
          collectiblesRef.current.push({
            id: nextId.current++,
            lane: spawnLane,
            z: 0,
            type: Math.random() < 0.2 ? 'SHIELD' : 'COIN'
          });
        }
      }

      // 1. SKY & HORIZON ATMOSPHERE
      const isCity = environment === 'CITY_STREETS';
      const horizonY = height * 0.42;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      if (isCity) {
        skyGrad.addColorStop(0, '#04060c');
        skyGrad.addColorStop(0.6, '#0f172a');
        skyGrad.addColorStop(1, '#1e293b');
      } else {
        skyGrad.addColorStop(0, '#020704');
        skyGrad.addColorStop(0.6, '#062013');
        skyGrad.addColorStop(1, '#0e3a24');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      // Moon in sky
      const moonX = width * 0.72;
      const moonY = horizonY * 0.45;
      const moonRad = 32;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 70);
      moonGlow.addColorStop(0, isCity ? 'rgba(251, 146, 60, 0.95)' : 'rgba(52, 211, 153, 0.9)');
      moonGlow.addColorStop(0.5, isCity ? 'rgba(234, 88, 12, 0.35)' : 'rgba(16, 185, 129, 0.25)');
      moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isCity ? '#fed7aa' : '#a7f3d0';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRad, 0, Math.PI * 2);
      ctx.fill();

      // Distant gothic silhouettes
      ctx.fillStyle = isCity ? '#020617' : '#010f08';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= width; x += 35) {
        const h = isCity 
          ? (Math.sin(x * 0.04) * 22 + (x % 70 === 0 ? 45 : 12)) 
          : (Math.sin(x * 0.05) * 25 + Math.cos(x * 0.08) * 18);
        ctx.lineTo(x, horizonY - h);
      }
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      // 2. 3D PERSPECTIVE RUNNING ROAD & SPEED COBBLESTONES
      const roadTopW = width * 0.24;
      const roadBotW = width * 0.95;

      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      if (isCity) {
        roadGrad.addColorStop(0, '#0a0d14');
        roadGrad.addColorStop(0.4, '#131926');
        roadGrad.addColorStop(1, '#1e2433');
      } else {
        roadGrad.addColorStop(0, '#030805');
        roadGrad.addColorStop(0.4, '#091c12');
        roadGrad.addColorStop(1, '#112e1f');
      }

      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo((width - roadTopW) / 2, horizonY);
      ctx.lineTo((width + roadTopW) / 2, horizonY);
      ctx.lineTo((width + roadBotW) / 2, height);
      ctx.lineTo((width - roadBotW) / 2, height);
      ctx.closePath();
      ctx.fill();

      // Roadside grass / mud flanks
      ctx.fillStyle = isCity ? '#090d16' : '#03120a';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo((width - roadTopW) / 2, horizonY);
      ctx.lineTo((width - roadBotW) / 2, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo((width + roadTopW) / 2, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.lineTo(width, height);
      ctx.lineTo((width + roadBotW) / 2, height);
      ctx.closePath();
      ctx.fill();

      // Scrolling Cobblestones & High-Speed Depth Lines
      roadOffset = (roadOffset + (speedKmh * 0.92)) % 100;
      ctx.strokeStyle = isCity ? 'rgba(245, 158, 11, 0.22)' : 'rgba(52, 211, 153, 0.2)';
      ctx.lineWidth = 2;

      for (let z = 0; z < 100; z += 10) {
        const lineZ = (z + roadOffset) % 100;
        const pZ = lineZ / 100;
        const y = horizonY + (height - horizonY) * Math.pow(pZ, 2.1);
        const w = roadTopW + (roadBotW - roadTopW) * pZ;
        ctx.beginPath();
        ctx.moveTo((width - w) / 2, y);
        ctx.lineTo((width + w) / 2, y);
        ctx.stroke();

        const curbLeftX = (width - w) / 2;
        const curbRightX = (width + w) / 2;
        ctx.fillStyle = isCity ? 'rgba(239, 68, 68, 0.65)' : 'rgba(16, 185, 129, 0.7)';
        ctx.fillRect(curbLeftX - 4 * pZ, y - 2 * pZ, 8 * pZ, 4 * pZ);
        ctx.fillRect(curbRightX - 4 * pZ, y - 2 * pZ, 8 * pZ, 4 * pZ);
      }

      // 3 Lanes Dividers
      const lane0TopX = width * 0.5 - roadTopW * 0.28;
      const lane0BotX = width * 0.5 - roadBotW * 0.28;
      const lane2TopX = width * 0.5 + roadTopW * 0.28;
      const lane2BotX = width * 0.5 + roadBotW * 0.28;

      ctx.strokeStyle = isCity ? 'rgba(251, 191, 36, 0.5)' : 'rgba(110, 231, 183, 0.45)';
      ctx.setLineDash([16, 20]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lane0TopX, horizonY);
      ctx.lineTo(lane0BotX, height);
      ctx.moveTo(lane2TopX, horizonY);
      ctx.lineTo(lane2BotX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. ADVANCE & DRAW ROADSIDE 3D OBJECTS
      const roadSpeed = 28 + speedKmh * 0.88;
      for (let i = roadsideObjectsRef.current.length - 1; i >= 0; i--) {
        const obj = roadsideObjectsRef.current[i];
        obj.z += roadSpeed * deltaSec;

        const pZ = obj.z / 100;
        const curY = horizonY + (height - horizonY) * Math.pow(pZ, 2.0);
        const curRoadW = roadTopW + (roadBotW - roadTopW) * pZ;
        const curbX = width * 0.5 + obj.side * (curRoadW * 0.55);
        const scale = 0.15 + pZ * 1.35;

        ctx.save();
        ctx.translate(curbX, curY);
        ctx.scale(scale, scale);

        if (obj.type === 'STREETLAMP') {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -90);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(obj.side * -8, -85, 12, 0, Math.PI);
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(obj.side * -14 - 8, -98, 16, 20);
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 18;
          ctx.fillRect(obj.side * -14 - 6, -95, 12, 14);
          ctx.shadowBlur = 0;
        } else if (obj.type === 'GARGOYLE_PILLAR') {
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.fillRect(-14, -70, 28, 70);
          ctx.strokeRect(-14, -70, 28, 70);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, -82, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-6, -85, 3, 3);
          ctx.fillRect(3, -85, 3, 3);
        } else {
          ctx.strokeStyle = '#142018';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(obj.side * 10, -50);
          ctx.lineTo(obj.side * -15, -95);
          ctx.stroke();
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(obj.side * 10, -50);
          ctx.lineTo(obj.side * 35, -75);
          ctx.moveTo(obj.side * -15, -95);
          ctx.lineTo(obj.side * -40, -125);
          ctx.stroke();
          ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
          ctx.beginPath();
          ctx.arc(obj.side * 10, -50, 8, 0, Math.PI * 2);
          ctx.arc(obj.side * -15, -95, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (obj.z > 110) {
          roadsideObjectsRef.current.splice(i, 1);
        }
      }

      // 4. ADVANCE & DRAW 3D HORROR HAZARDS
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.z += roadSpeed * deltaSec;

        const pZ = obs.z / 100;
        const curY = horizonY + (height - horizonY) * Math.pow(pZ, 2.0);
        const curRoadW = roadTopW + (roadBotW - roadTopW) * pZ;
        const laneCenterX = width * 0.5 + (obs.lane - 1) * (curRoadW * 0.32);
        const scale = 0.2 + pZ * 1.25;

        ctx.save();
        ctx.translate(laneCenterX, curY);
        ctx.scale(scale, scale);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 6, 32, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        if (obs.type === 'DEMON_BEHEMOTH') {
          ctx.save();
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 24 * pZ;

          ctx.fillStyle = '#050508';
          ctx.beginPath();
          ctx.moveTo(-25, 0);
          ctx.lineTo(-35, -45);
          ctx.lineTo(-45, -75);
          ctx.lineTo(-28, -95);
          ctx.lineTo(-14, -115);
          ctx.lineTo(14, -115);
          ctx.lineTo(28, -95);
          ctx.lineTo(45, -75);
          ctx.lineTo(35, -45);
          ctx.lineTo(25, 0);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-12, -110);
          ctx.quadraticCurveTo(-35, -130, -28, -145);
          ctx.moveTo(12, -110);
          ctx.quadraticCurveTo(35, -130, 28, -145);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.ellipse(-7, -105, 4, 2, -0.2, 0, Math.PI * 2);
          ctx.ellipse(7, -105, 4, 2, 0.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-45, -75);
          ctx.lineTo(-58, -60);
          ctx.lineTo(-55, -45);
          ctx.moveTo(45, -75);
          ctx.lineTo(58, -60);
          ctx.lineTo(55, -45);
          ctx.stroke();

          ctx.restore();

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('DEMON FIEND', 0, -125);
        } else if (obs.type === 'IRON_GUILLOTINE') {
          ctx.fillStyle = '#1c1917';
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          ctx.moveTo(-40, 0);
          ctx.lineTo(-30, -35);
          ctx.lineTo(-20, 0);
          ctx.lineTo(-10, -42);
          ctx.lineTo(0, 0);
          ctx.lineTo(10, -42);
          ctx.lineTo(20, 0);
          ctx.lineTo(30, -35);
          ctx.lineTo(40, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#451a03';
          ctx.fillRect(-38, -6, 76, 8);

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('VAULT JUMP [W]', 0, -48);
        } else if (obs.type === 'SCREAMING_BANSHEE') {
          ctx.save();
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 20 * pZ;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-35, -80);
          ctx.quadraticCurveTo(0, -98, 35, -80);
          ctx.lineTo(30, -45);
          ctx.lineTo(18, -60);
          ctx.lineTo(0, -42);
          ctx.lineTo(-18, -60);
          ctx.lineTo(-30, -45);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.arc(0, -75, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#581c87';
          ctx.beginPath();
          ctx.arc(-4, -77, 2.5, 0, Math.PI * 2);
          ctx.arc(4, -77, 2.5, 0, Math.PI * 2);
          ctx.ellipse(0, -70, 3, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          ctx.fillStyle = '#d8b4fe';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('POWER SLIDE [S]', 0, -100);
        } else {
          ctx.fillStyle = '#7f1d1d';
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 38, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('HELLFIRE PIT', 0, -22);
        }

        ctx.restore();

        if (obs.z >= 84 && obs.z <= 97 && obs.lane === lane && !obs.cleared) {
          const avoidedByJump = obs.isLow && playerStance === 'JUMP';
          const avoidedBySlide = obs.isHigh && playerStance === 'SLIDE';

          if (avoidedByJump) {
            obs.cleared = true;
            setXp((x) => x + 50);
            floatingTextsRef.current.push({
              id: nextId.current++,
              x: playerXRef.current,
              y: 0.65,
              text: 'CLEAN VAULT! +50 XP',
              color: '#38bdf8',
              alpha: 1,
              vy: -0.06
            });
          } else if (avoidedBySlide) {
            obs.cleared = true;
            setXp((x) => x + 50);
            floatingTextsRef.current.push({
              id: nextId.current++,
              x: playerXRef.current,
              y: 0.65,
              text: 'SLIDE DODGE! +50 XP',
              color: '#c084fc',
              alpha: 1,
              vy: -0.06
            });
          } else {
            obs.cleared = true;
            obstaclesRef.current.splice(i, 1);
            setIsHitFlashing(true);
            cameraShakeRef.current = 10.0;
            setTimeout(() => setIsHitFlashing(false), 300);

            setShields((s) => {
              if (s > 0) {
                playShieldBreakSound(isMuted);
                floatingTextsRef.current.push({
                  id: nextId.current++,
                  x: playerXRef.current,
                  y: 0.6,
                  text: 'AEGIS BARRIER ABSORB!',
                  color: '#06b6d4',
                  alpha: 1,
                  vy: -0.06
                });
                return s - 1;
              } else {
                playGameOverSound(isMuted);
                setCurrentHp(0);
                setGameState('GAME_OVER');
                return 0;
              }
            });
            continue;
          }
        }

        if (obs.z > 105) {
          if (!obs.cleared) {
            setXp((x) => x + 20);
          }
          obstaclesRef.current.splice(i, 1);
        }
      }

      // 5. DRAW COLLECTIBLES
      for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
        const col = collectiblesRef.current[i];
        col.z += roadSpeed * deltaSec;

        const pZ = col.z / 100;
        const curY = horizonY + (height - horizonY) * Math.pow(pZ, 2.0);
        const curRoadW = roadTopW + (roadBotW - roadTopW) * pZ;
        const laneCenterX = width * 0.5 + (col.lane - 1) * (curRoadW * 0.32);
        const colScale = 0.3 + pZ * 0.95;

        ctx.save();
        ctx.translate(laneCenterX, curY - 22 * colScale);
        ctx.scale(colScale, colScale);

        if (col.type === 'COIN') {
          const spin = Math.sin(runCycleRef.current * 4);
          ctx.save();
          ctx.scale(spin, 1);
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 18;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('$', 0, 5);
          ctx.restore();
        } else {
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 22;
          ctx.fillStyle = '#0891b2';
          ctx.beginPath();
          ctx.moveTo(0, -18);
          ctx.lineTo(16, -6);
          ctx.lineTo(12, 16);
          ctx.lineTo(0, 22);
          ctx.lineTo(-12, 16);
          ctx.lineTo(-16, -6);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#a5f3fc';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🛡️', 0, 5);
        }
        ctx.restore();

        if (col.z >= 82 && col.z <= 98 && col.lane === lane) {
          if (col.type === 'COIN') {
            setCoins((c) => c + 1);
            setXp((x) => x + 25);
            playCoinSound(isMuted);
            floatingTextsRef.current.push({
              id: nextId.current++,
              x: playerXRef.current,
              y: 0.7,
              text: '+25 COIN',
              color: '#fbbf24',
              alpha: 1,
              vy: -0.05
            });
          } else {
            setShields((s) => s + 1);
            playShieldSound(isMuted);
            floatingTextsRef.current.push({
              id: nextId.current++,
              x: playerXRef.current,
              y: 0.68,
              text: 'AEGIS SHIELD RECHARGED!',
              color: '#22d3ee',
              alpha: 1,
              vy: -0.06
            });
          }
          collectiblesRef.current.splice(i, 1);
          continue;
        }

        if (col.z > 105) {
          collectiblesRef.current.splice(i, 1);
        }
      }

      // 6. PROCEDURAL ATHLETIC 3D RUNNER HERO
      const currentRoadWAtPlayer = roadTopW + (roadBotW - roadTopW) * 0.94;
      const playerCenterX = width * 0.5 + (playerXRef.current - 0.5) * currentRoadWAtPlayer * 0.72;
      const playerBaseY = height - 38;

      let stanceYOffset = 0;
      let runnerLean = bankAngle;
      let legCycle = runCycleRef.current * 4.2;

      if (playerStance === 'JUMP') {
        const jumpProgress = Math.sin((1 - stanceTimerRef.current / 0.6) * Math.PI);
        stanceYOffset = -jumpProgress * 85;
        runnerLean = bankAngle * 0.3;
      } else if (playerStance === 'SLIDE') {
        stanceYOffset = 16;
        runnerLean = bankAngle * 0.5;
      } else {
        stanceYOffset = -Math.abs(Math.sin(legCycle)) * 7.5;
      }

      const shadowScale = playerStance === 'JUMP' ? 0.6 : 1.0;
      const shadowAlpha = playerStance === 'JUMP' ? 0.35 : 0.7;
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(playerCenterX, playerBaseY, 34 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      if (playerStance === 'RUN' && Math.random() < 0.6) {
        particlesRef.current.push({
          x: playerCenterX + (Math.random() - 0.5) * 22,
          y: playerBaseY + 4,
          vx: (Math.random() - 0.5) * 1.8,
          vy: -Math.random() * 2.2,
          size: Math.random() * 3.5 + 1.5,
          alpha: 0.75,
          color: isCity ? '#475569' : '#15803d',
          decay: 2.2
        });
      }

      ctx.save();
      ctx.translate(playerCenterX, playerBaseY + stanceYOffset);
      ctx.rotate(runnerLean);

      if (shields > 0) {
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 24;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -48, 48, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -48, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const classColorMap: Record<string, { armor: string; trim: string; cape: string; glow: string }> = {
        Warrior: { armor: '#334155', trim: '#f59e0b', cape: '#dc2626', glow: '#ef4444' },
        Mage: { armor: '#1e1b4b', trim: '#06b6d4', cape: '#7c3aed', glow: '#a855f7' },
        Rogue: { armor: '#0f172a', trim: '#10b981', cape: '#1e293b', glow: '#34d399' },
        Ranger: { armor: '#14532d', trim: '#d97706', cape: '#166534', glow: '#22c55e' },
        Paladin: { armor: '#475569', trim: '#fbbf24', cape: '#f59e0b', glow: '#fde047' },
        Cleric: { armor: '#334155', trim: '#38bdf8', cape: '#0284c7', glow: '#67e8f9' },
        Druid: { armor: '#3f2e1a', trim: '#22c55e', cape: '#15803d', glow: '#4ade80' },
        Warlock: { armor: '#2e1065', trim: '#10b981', cape: '#581c87', glow: '#a855f7' }
      };

      const cTheme = classColorMap[character.characterClass] || classColorMap.Warrior;

      const capeWave1 = Math.sin(capeWaveRef.current) * 8;
      const capeWave2 = Math.sin(capeWaveRef.current - 0.5) * 14;
      const capeWave3 = Math.sin(capeWaveRef.current - 1.0) * 20;

      ctx.fillStyle = cTheme.cape;
      ctx.beginPath();
      ctx.moveTo(-16, -68);
      ctx.lineTo(16, -68);
      ctx.quadraticCurveTo(18 + capeWave1, -45, 14 + capeWave2, -22);
      ctx.lineTo(2 + capeWave3, 4);
      ctx.lineTo(-2 + capeWave3, 4);
      ctx.quadraticCurveTo(-14 + capeWave2, -22, -18 + capeWave1, -45);
      ctx.closePath();
      ctx.fill();

      if (playerStance === 'SLIDE') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-14, -14, 28, 12);
        ctx.fillRect(-28, -8, 22, 8);

        ctx.fillStyle = cTheme.armor;
        ctx.fillRect(-18, -42, 36, 30);
        ctx.strokeStyle = cTheme.trim;
        ctx.lineWidth = 2;
        ctx.strokeRect(-18, -42, 36, 30);

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, -52, 11, 0, Math.PI * 2);
        ctx.fill();

        for (let sp = 0; sp < 3; sp++) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(10 + Math.random() * 12, -4 + Math.random() * 6, 3, 3);
        }
      } else if (playerStance === 'JUMP') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(-10, -22, 9, 14, -0.4, 0, Math.PI * 2);
        ctx.ellipse(10, -22, 9, 14, 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.fillRect(-16, -15, 12, 10);
        ctx.fillRect(4, -15, 12, 10);

        ctx.fillStyle = cTheme.armor;
        ctx.fillRect(-18, -62, 36, 38);
        ctx.strokeStyle = cTheme.trim;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-18, -62, 36, 38);

        ctx.fillStyle = cTheme.armor;
        ctx.fillRect(-28, -60, 10, 24);
        ctx.fillRect(18, -60, 10, 24);

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, -74, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const leftLegSwing = Math.sin(legCycle);
        const rightLegSwing = Math.sin(legCycle + Math.PI);

        ctx.save();
        ctx.translate(-9, -28);
        ctx.rotate(leftLegSwing * 0.55);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-5, 0, 10, 18);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6, 16, 12, 16);
        ctx.restore();

        ctx.save();
        ctx.translate(9, -28);
        ctx.rotate(rightLegSwing * 0.55);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-5, 0, 10, 18);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6, 16, 12, 16);
        ctx.restore();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-16, -34, 32, 10);
        ctx.fillStyle = cTheme.trim;
        ctx.fillRect(-6, -33, 12, 8);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-14, -32, 4, 6);

        ctx.fillStyle = cTheme.armor;
        ctx.fillRect(-18, -65, 36, 32);
        ctx.strokeStyle = cTheme.trim;
        ctx.lineWidth = 2;
        ctx.strokeRect(-18, -65, 36, 32);

        ctx.fillStyle = cTheme.glow;
        ctx.beginPath();
        ctx.moveTo(0, -60);
        ctx.lineTo(6, -50);
        ctx.lineTo(0, -42);
        ctx.lineTo(-6, -50);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.translate(-20, -60);
        ctx.rotate(-leftLegSwing * 0.45);
        ctx.fillStyle = cTheme.armor;
        ctx.fillRect(-4, 0, 8, 22);
        ctx.fillStyle = cTheme.trim;
        ctx.fillRect(-5, 18, 10, 8);
        ctx.restore();

        ctx.save();
        ctx.translate(20, -60);
        ctx.rotate(-rightLegSwing * 0.45);
        ctx.fillStyle = cTheme.armor;
        ctx.fillRect(-4, 0, 8, 22);
        ctx.fillStyle = cTheme.trim;
        ctx.fillRect(-5, 18, 10, 8);
        ctx.restore();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-18, -35);
        ctx.lineTo(18, -78);
        ctx.stroke();
        ctx.fillStyle = cTheme.glow;
        ctx.beginPath();
        ctx.arc(18, -78, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, -76, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = cTheme.glow;
        ctx.fillRect(-6, -78, 12, 3);
      }

      ctx.restore();

      // 7. PARTICLES UPDATE & DRAW
      for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
        const pt = particlesRef.current[pIdx];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= deltaSec * pt.decay;
        if (pt.alpha <= 0) {
          particlesRef.current.splice(pIdx, 1);
          continue;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 8. FLOATING COMBAT TEXT
      for (let fIdx = floatingTextsRef.current.length - 1; fIdx >= 0; fIdx--) {
        const ft = floatingTextsRef.current[fIdx];
        ft.y += ft.vy * deltaSec;
        ft.alpha -= deltaSec * 0.9;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(fIdx, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 15px "Cinzel Decorative", serif, monospace';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, width * ft.x, height * ft.y);
        ctx.restore();
      }

      // 9. HIGH SPEED TUNNEL VISION & SPEED LINES
      if (speedKmh > 28 || isSpeedBoosted) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        for (let s = 0; s < 6; s++) {
          const startX = Math.random() < 0.5 ? Math.random() * (width * 0.2) : width - Math.random() * (width * 0.2);
          const startY = Math.random() * height;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + (startX < width / 2 ? -40 : 40), startY + 50);
          ctx.stroke();
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, lane, speedKmh, playerStance, environment, distanceConfig.targetMeters, isMuted, isSpeedBoosted, character.characterClass]);

  // Restart Handler
  const handleRestart = () => {
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    roadsideObjectsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    setDistanceMeters(0);
    setTimeElapsed(0);
    setCoins(0);
    setXp(0);
    setShields(startingShields);
    setCurrentHp(character.hp);
    setLane(1);
    targetXRef.current = 0.5;
    playerXRef.current = 0.5;
    setPlayerStance('RUN');
    setSpeedKmh(26);
    setEnvironment('CITY_STREETS');
    setGameState('PLAYING');
    setBadgeDownloaded(false);
    lastTimeRef.current = performance.now();
  };

  const progressPercent = Math.min(100, Math.floor((distanceMeters / distanceConfig.targetMeters) * 100));

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 shadow-2xl select-none flex flex-col items-center">
      {/* Hit Terror Red Flash */}
      {isHitFlashing && (
        <div className="absolute inset-0 bg-rose-700/45 z-40 pointer-events-none animate-pulse" />
      )}

      {/* Dynamic Environment Transition Banner */}
      {transitionNotice && (
        <div className="absolute top-16 inset-x-0 z-30 flex justify-center pointer-events-none">
          <div className="px-6 py-2.5 rounded-full bg-slate-950/95 border-2 border-amber-500 text-amber-300 font-cinzel text-sm font-bold shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-2 animate-bounce">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{transitionNotice}</span>
          </div>
        </div>
      )}

      {/* TOP HUD: Live Telemetry, Vitals, Distance, Shields, XP, Music Jukebox */}
      <div className="w-full z-20 bg-slate-950/90 backdrop-blur-md border-b border-amber-500/30 px-4 py-3 flex items-center justify-between gap-3 flex-wrap relative">
        {/* Hero RPG Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExitGame}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-amber-300 hover:border-slate-500 transition-colors cursor-pointer"
            title="Exit to Forge"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-base font-bold text-amber-200 truncate max-w-[150px] sm:max-w-[220px]">
                {character.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {character.characterClass}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
              <span>HP: {currentHp}/{character.hp}</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">AC: {character.armorClass}</span>
              <span aria-hidden="true">·</span>
              <span className="text-rose-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" />
                <span>{75 + Math.floor(speedKmh * 1.5)} BPM</span>
              </span>
            </div>
          </div>
        </div>

        {/* Central Distance & Live Speed */}
        <div className="text-center">
          <div className="font-mono text-lg sm:text-xl font-bold text-amber-300 tabular-nums">
            {Math.floor(distanceMeters).toLocaleString()} / {distanceConfig.targetMeters.toLocaleString()} m
          </div>
          <div className="text-[11px] font-mono text-slate-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <span className="text-amber-400 font-bold">{progressPercent}%</span>
            <span>·</span>
            <span className="text-cyan-300">{speedKmh} km/h</span>
            <span>·</span>
            <span className={environment === 'CITY_STREETS' ? 'text-amber-300' : 'text-emerald-400'}>
              {environment === 'CITY_STREETS' ? 'Shadowed City' : 'Deep Blackwood'}
            </span>
          </div>
        </div>

        {/* Right Counters: Shields, Coins, XP, In-Game Music & Webcam */}
        <div className="flex items-center gap-2">
          {/* Shields Counter */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold ${
              shields > 0 
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400 animate-pulse'
            }`}
            title="Aegis Shields - Absorbs lethal collisions"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>x{shields}</span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-xs font-bold">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{coins}</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 font-mono text-xs font-bold">
            <Flame className="w-4 h-4 text-purple-400" />
            <span>{xp} XP</span>
          </div>

          {/* In-Game Jukebox / Music Switcher */}
          <button
            onClick={() => setShowInGameMusic((prev) => !prev)}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              showInGameMusic 
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-300'
            }`}
            title="Choose soundtrack to play while running"
          >
            <Music2 className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] hidden xl:inline font-mono">
              Track {inGameTrackIndex + 1}
            </span>
          </button>

          {/* Camera Hand Motion Sensor */}
          <button
            onClick={toggleWebcamTracking}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              webcamActive 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={webcamActive ? 'Disable Camera Tracking' : 'Enable Webcam Physical Hand Motion Sensor'}
          >
            {webcamActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            <span className="text-[10px] hidden md:inline font-mono">
              {webcamActive ? 'Hand: On' : 'Hand: Off'}
            </span>
          </button>
        </div>

        {/* Floating In-Game Jukebox Song Picker Drawer */}
        {showInGameMusic && (
          <div className="absolute top-full right-4 mt-2 z-40 p-3 rounded-xl bg-slate-950/95 border border-amber-500/50 shadow-2xl backdrop-blur-md w-72 sm:w-80 flex flex-col gap-1.5 animate-fadeIn">
            <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-800 text-xs font-mono text-amber-300">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Select Music Track:</span>
              </span>
              <button 
                onClick={() => setShowInGameMusic(false)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {FANTASY_TRACKS.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => {
                  setInGameTrackIndex(idx);
                  switchTrack(idx);
                  if (!isMuted) {
                    startFantasyMusic(idx);
                  }
                }}
                className={`p-2 rounded-lg text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                  idx === inGameTrackIndex 
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-200 font-bold'
                    : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="truncate font-semibold flex items-center gap-1">
                    <span>{idx + 1}. {t.title}</span>
                    {t.isFeatured && <span className="text-[9px] text-amber-400">⭐</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                    <span>{t.mood}</span>
                    {t.isFeatured && <span className="text-amber-300 font-bold text-[8px] px-1 rounded bg-amber-500/20">Featured</span>}
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 font-mono">
                  {t.tempoBpm} BPM
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MAIN 3D HORROR CANVAS VIEWPORT */}
      <div 
        className="relative w-full h-[390px] xs:h-[450px] sm:h-[520px] md:h-[560px] overflow-hidden flex items-center justify-center cursor-ew-resize bg-black touch-none"
        onMouseMove={(e) => handlePointerTrack(e.clientX, e.currentTarget.getBoundingClientRect())}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={(e) => {
          if (e.touches[0]) {
            handlePointerTrack(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
          }
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Real-time In-Game "XP Gain" & Sprint Surge Floating Buttons */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-25 flex flex-col gap-2">
          <button
            onClick={handleXpSurge}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-amber-500/50 bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 text-[10px] sm:text-xs font-cinzel font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-xl active:scale-95 cursor-pointer backdrop-blur-md touch-manipulation"
            title="Claim bonus XP and surge running speed"
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>+50 XP Gain</span>
          </button>

          <button
            onClick={handleSprintSurge}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-purple-500/50 bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 text-[10px] sm:text-xs font-cinzel font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-xl active:scale-95 cursor-pointer backdrop-blur-md touch-manipulation"
            title="Accelerate velocity and gain +100 XP"
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            <span>Sprint Surge</span>
          </button>
        </div>

        {/* Live Webcam PIP Sensor Box */}
        {webcamActive && (
          <div className="absolute bottom-20 sm:bottom-24 left-3 sm:left-4 z-30 p-2 rounded-xl bg-slate-950/90 border border-emerald-500/60 shadow-2xl flex flex-col items-center pointer-events-none">
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mb-1">
              <Hand className="w-3.5 h-3.5" />
              <span>Gesture: {detectedGesture}</span>
            </div>
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-24 sm:w-28 h-18 sm:h-20 rounded-lg object-cover transform -scale-x-100 border border-slate-700"
            />
            <canvas ref={motionCanvasRef} className="hidden" width={60} height={45} />
          </div>
        )}

        {/* Interactive Tactical Action Bar: DODGE LEFT, VAULT JUMP, POWER SLIDE, DODGE RIGHT */}
        <div className="absolute bottom-3 sm:bottom-4 inset-x-2 sm:inset-x-4 z-25 flex items-center justify-between gap-1.5 sm:gap-2 max-w-xl mx-auto pointer-events-auto">
          <button
            onClick={() => changeLane(0)}
            className="flex-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 active:border-amber-400 text-slate-100 text-[10px] sm:text-xs font-mono font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-md touch-manipulation"
          >
            <span>← LEFT</span>
          </button>

          <button
            onClick={triggerJump}
            className="flex-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 active:bg-amber-500/40 text-amber-200 text-[10px] sm:text-xs font-mono font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-md touch-manipulation"
          >
            <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>VAULT</span>
          </button>

          <button
            onClick={triggerSlide}
            className="flex-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/60 active:bg-purple-500/40 text-purple-200 text-[10px] sm:text-xs font-mono font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-md touch-manipulation"
          >
            <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            <span>SLIDE</span>
          </button>

          <button
            onClick={() => changeLane(2)}
            className="flex-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 active:border-amber-400 text-slate-100 text-[10px] sm:text-xs font-mono font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-md touch-manipulation"
          >
            <span>RIGHT →</span>
          </button>
        </div>

        {/* Game Over Screen */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 z-50 bg-black/92 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/80 flex items-center justify-center mb-3 text-rose-500 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="font-cinzel text-3xl sm:text-5xl font-black text-rose-500 tracking-wider">
              SLAIN BY HORRORS
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md">
              The darkness overtook {character.name} in the {environment === 'CITY_STREETS' ? 'shadowed city alleys' : 'ancient haunted blackwood'}.
            </p>

            <div className="grid grid-cols-3 gap-3 my-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono w-full max-w-md">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Distance Survived</div>
                <div className="text-lg font-bold text-amber-300">{Math.floor(distanceMeters)} m</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Coins Collected</div>
                <div className="text-lg font-bold text-amber-400">{coins}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">XP Gained</div>
                <div className="text-lg font-bold text-purple-400">{xp} XP</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRestart}
                className="py-3 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-cinzel font-bold text-sm flex items-center gap-2 transition-all shadow-2xl cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
              <button
                onClick={onExitGame}
                className="py-3 px-6 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-cinzel text-sm transition-colors cursor-pointer"
              >
                Return to Forge
              </button>
            </div>
          </div>
        )}

        {/* REFINED REWARDING VICTORY SCREEN: PHOTO UPLOAD, NAME ENTRY, ACHIEVEMENT BADGE & DOWNLOAD */}
        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto animate-fadeIn">
            {/* Victory Header */}
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/80 flex items-center justify-center mt-2 mb-2 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] shrink-0 animate-bounce">
              <Award className="w-7 h-7" />
            </div>

            <h2 className="font-cinzel text-2xl sm:text-4xl font-black text-amber-300 tracking-wider text-center">
              EXPEDITION CONQUERED!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg text-center">
              You braved the shadowed city and terrifying deep forest to triumphantly claim the {distanceConfig.name} sanctuary!
            </p>

            {/* Customization Card: Photo Upload & Full Name Entry */}
            <div className="w-full max-w-2xl mx-auto my-4 p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-amber-500/50 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Personalize Your Imperial Honors Certificate</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Step 1: Photo & Name</span>
              </div>

              {/* Photo Upload & Name Input Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Photo Upload Area */}
                <div className="sm:col-span-5 flex flex-col items-center sm:items-start gap-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Portrait Photo:</span>
                  </label>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {uploadedPhotoUrl ? (
                    <div className="flex items-center gap-3 w-full bg-slate-950/80 p-2 rounded-lg border border-amber-500/40">
                      <div className="w-12 h-12 rounded-full border-2 border-amber-400 overflow-hidden shadow-md shrink-0">
                        <img
                          src={uploadedPhotoUrl}
                          alt="Uploaded Portrait"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-emerald-400 truncate">Photo Loaded</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 text-[10px] font-mono cursor-pointer transition-colors"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] cursor-pointer transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-lg border border-dashed border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs font-mono font-medium flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Upload Your Photo</span>
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 italic">
                    Rendered in circular gold frame on badge
                  </span>
                </div>

                {/* Full Name Entry */}
                <div className="sm:col-span-7 flex flex-col gap-2">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Conferred Full Name:</span>
                  </label>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="e.g., Sir Ritesh or Adventurer Name"
                      className="flex-1 bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-lg px-3.5 py-2.5 text-amber-100 font-cinzel text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                      maxLength={40}
                    />
                    <button
                      onClick={handleDownloadAchievementBadge}
                      disabled={isDownloadingBadge}
                      className="py-3 sm:py-2.5 px-5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-cinzel font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-transform active:scale-95 shrink-0 disabled:opacity-50 min-h-[44px] touch-manipulation"
                      title="Download high-resolution achievement badge image"
                    >
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>{isDownloadingBadge ? 'Saving...' : 'Download Badge'}</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">
                    Name printed across the imperial conquest charter
                  </span>
                </div>
              </div>

              {badgeDownloaded && (
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Achievement Badge PNG successfully generated and downloaded to your device!</span>
                </div>
              )}
            </div>

            {/* Live Interactive Achievement Certificate / Badge Preview Card */}
            <div className="w-full max-w-2xl mx-auto rounded-xl p-5 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/70 shadow-[0_0_35px_rgba(245,158,11,0.3)] relative text-center mb-5">
              {/* Corner Knotwork Accents */}
              <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

              <div className="text-[10px] sm:text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">
                Mythic Forge · Imperial Guild of Adventurers
              </div>
              <h3 className="font-cinzel text-lg sm:text-2xl font-bold text-amber-200 mt-1">
                Royal Charter of Expedition Conquest
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 italic mt-0.5">
                Awarded for Supreme Valor & Survival Across the Blackwood Gauntlet
              </p>

              {/* Dynamic Circular Framed Portrait Photo & Name Proclamation */}
              <div className="my-4 p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
                {/* CIRCULAR PHOTO FRAME */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-400 bg-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] overflow-hidden relative ring-2 ring-amber-600/70 flex items-center justify-center">
                    {uploadedPhotoUrl ? (
                      <img
                        src={uploadedPhotoUrl}
                        alt="Hero Uploaded Portrait"
                        className="w-full h-full object-cover"
                      />
                    ) : character.activePortraitUrl || character.imagePath ? (
                      <img
                        src={character.activePortraitUrl || character.imagePath}
                        alt="Hero Class Portrait"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-amber-400 p-2 text-center">
                        <Shield className="w-8 h-8 mb-1 text-amber-400" />
                        <span className="text-[9px] font-mono">HERO</span>
                      </div>
                    )}
                  </div>

                  {/* Ribbon Tag below portrait */}
                  <div className="-mt-2.5 z-10 px-3 py-0.5 rounded-full bg-red-900 border border-amber-400/90 shadow-md">
                    <span className="text-[9px] font-mono font-bold text-amber-200 uppercase tracking-wider">
                      Honored Hero
                    </span>
                  </div>
                </div>

                {/* Recipient Details prominently next to the circular photo */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    Conferred Upon the Victorious:
                  </div>
                  <div className="font-cinzel text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 tracking-wide mt-1 truncate">
                    {playerName.trim() || character.name}
                  </div>
                  <div className="text-xs sm:text-sm text-cyan-300 font-mono mt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <span>{character.characterClass} of the Realm</span>
                    <span>·</span>
                    <span className="text-purple-300">{character.race}</span>
                    <span>·</span>
                    <span className="text-amber-400">AC {character.armorClass}</span>
                  </div>
                  {!uploadedPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center justify-center sm:justify-start gap-1 cursor-pointer underline"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Upload your photo to this circular frame</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Metrics Badges */}
              <div className="grid grid-cols-3 gap-2.5 my-3">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/40">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">Distance Conquered</div>
                  <div className="font-mono text-sm sm:text-base font-bold text-amber-300 mt-0.5">
                    {distanceConfig.targetMeters.toLocaleString()}m
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{distanceConfig.name}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-purple-500/40">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">XP Accumulated</div>
                  <div className="font-mono text-sm sm:text-base font-bold text-purple-300 mt-0.5">
                    +{xp} XP
                  </div>
                  <div className="text-[10px] text-purple-400/80">Imperial Prestige</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/40">
                  <div className="text-[9px] text-slate-400 font-mono uppercase">Guild Coins</div>
                  <div className="font-mono text-sm sm:text-base font-bold text-cyan-300 mt-0.5">
                    {coins}
                  </div>
                  <div className="text-[10px] text-cyan-400/80">Plundered Spoils</div>
                </div>
              </div>

              {/* Survival Telemetry Bar */}
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 py-1.5 border-t border-slate-800 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                <span>⏱️ Time: {Math.floor(timeElapsed / 60)}m {Math.floor(timeElapsed % 60)}s</span>
                <span>⚡ Avg Pace: {speedKmh} km/h</span>
                <span>🛡️ Shields Left: {shields}</span>
                <span>❤️ Vitals: {currentHp}/{character.hp} HP</span>
              </div>

              {/* Founder's Signature Block & Wax Seal Footer */}
              <div className="pt-3 mt-2 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                {/* Founder's Signature Block */}
                <div className="flex flex-col text-center sm:text-left">
                  <div className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-semibold flex items-center justify-center sm:justify-start gap-1">
                    <span>⚔️</span>
                    <span>Founder Signature & Seal:</span>
                  </div>

                  {/* Authentic Handwritten Signature of Founder Ritesh Kumar */}
                  <div className="relative inline-flex items-center justify-center sm:justify-start my-1 h-14 sm:h-16">
                    <img
                      src="/assets/aistudio/image_ea57dae4.png"
                      alt="Founder Ritesh Kumar Signature"
                      className="h-full w-auto max-w-[210px] object-contain filter invert hue-rotate-[190deg] brightness-[1.8] contrast-[1.8] mix-blend-screen drop-shadow-[0_0_10px_rgba(254,240,138,0.7)]"
                    />
                  </div>

                  <div className="w-52 sm:w-64 h-[1.5px] bg-gradient-to-r from-amber-400 via-yellow-200 to-transparent my-0.5 mx-auto sm:mx-0" />

                  {/* Prominent Printed Founder Name */}
                  <div className="font-cinzel text-xs sm:text-sm font-black text-amber-300 tracking-wider mt-0.5">
                    RITESH KUMAR
                  </div>
                  <div className="text-[9px] font-mono text-amber-400/90 font-bold uppercase tracking-wider">
                    Founder & Grand Chancellor of the Mythic Forge
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">
                    Imperial Charter Certification & Seal of Valorous Merit
                  </div>
                </div>

                {/* Wax Seal & Verification Badge */}
                <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                  <div className="px-3.5 py-1.5 rounded-full bg-red-950/90 border border-amber-500/80 text-amber-300 text-[10px] font-mono flex items-center gap-1.5 shadow-md">
                    <span>⚔️</span>
                    <span className="font-bold">Affixed by Founder Ritesh Kumar</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pb-4 flex-wrap justify-center">
              <button
                onClick={handleDownloadAchievementBadge}
                disabled={isDownloadingBadge}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs flex items-center gap-2 shadow-xl cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>{isDownloadingBadge ? 'Generating Badge...' : 'Download Badge PNG'}</span>
              </button>

              <button
                onClick={handleRestart}
                className="py-3 px-6 rounded-xl bg-slate-900 border border-amber-500/50 hover:bg-slate-800 text-amber-200 font-cinzel font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Next Run</span>
              </button>

              <button
                onClick={onExitGame}
                className="py-3 px-5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-cinzel text-xs transition-colors cursor-pointer"
              >
                Return to Forge
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LIVE MINIMAP & DISTANCE TELEMETRY BAR AT BOTTOM */}
      <div className="w-full bg-slate-950 border-t border-amber-500/30 p-3 sm:p-4 flex flex-col gap-2 z-20">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-amber-300">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Live Route Minimap</span>
          </div>
          <div>
            <span className="text-slate-200 font-bold">{Math.floor(distanceMeters)}m</span> / {distanceConfig.targetMeters}m ({progressPercent}%)
          </div>
        </div>

        {/* Progress Route Bar with Hero Runner Pin */}
        <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-visible border border-slate-700">
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-40">
            <div className="w-1/4 h-full border-r border-slate-600" />
            <div className="w-1/4 h-full border-r border-slate-600" />
            <div className="w-1/4 h-full border-r border-slate-600" />
          </div>

          <div 
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-400 transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />

          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
            style={{ left: `${Math.min(99, Math.max(1, progressPercent))}%` }}
          >
            <div className="w-6 h-6 rounded-full border border-amber-300 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,1)] flex items-center justify-center text-slate-950">
              <Navigation className="w-3.5 h-3.5 fill-slate-950 text-slate-950 transform rotate-45" />
            </div>
          </div>
        </div>

        {/* Dynamic Checkpoint Labels */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Start (0m)</span>
          <span className="text-slate-400">
            {distanceConfig.targetMeters <= 1000 
              ? 'Old Alleys (350m)' 
              : `Blackwood (${Math.round(distanceConfig.targetMeters * 0.35)}m)`}
          </span>
          <span className="text-slate-400">
            {distanceConfig.targetMeters <= 1000 
              ? 'Catacomb Pass (700m)' 
              : `Catacombs (${Math.round(distanceConfig.targetMeters * 0.7)}m)`}
          </span>
          <span className="text-amber-400 font-semibold">
            Sanctuary ({distanceConfig.targetMeters >= 1000 ? `${(distanceConfig.targetMeters / 1000).toFixed(distanceConfig.targetMeters % 1000 === 0 ? 0 : 1)}km` : `${distanceConfig.targetMeters}m`})
          </span>
        </div>
      </div>
    </div>
  );
};
