import React, { useEffect, useRef, useState } from 'react';
import { playTickSound, playWinSound } from '../utils/audio.js';

export interface WheelSegment {
  id: string;
  label: string;
  subLabel?: string;
  icon?: string;
  color?: string;
}

interface FortuneWheelProps {
  segmentsCount?: number;
  segments?: WheelSegment[];
  isSpinning: boolean;
  targetPrizeIndex: number | null;
  onSpinEnd: () => void;
  disabled?: boolean;
}

// Map icon names to emoji symbols for crisp canvas rendering
function getPrizeEmoji(iconName?: string): string {
  switch (iconName?.toLowerCase()) {
    case 'car':
    case 'avto':
      return '🚗';
    case 'plane':
    case 'umra':
      return '🕋';
    case 'ticket':
    case 'sanatoriy':
    case 'vaucher':
      return '🏖️';
    case 'banknote':
    case 'money':
    case 'pul':
      return '💰';
    case 'trophy':
    case 'konkurs':
      return '🏆';
    case 'smartphone':
    case 'iphone':
      return '📱';
    case 'microwave':
    case 'pech':
      return '♨️';
    default:
      return '🎁';
  }
}

// Format prize name for two-line canvas sector display
function formatPrizeTitle(title: string): { line1: string; line2: string } {
  if (!title) return { line1: 'Sovg‘a', line2: '' };

  const clean = title.replace(/\(.*?\)/g, '').trim();

  if (clean.toLowerCase().includes('nexia')) {
    return { line1: 'Nexia 3', line2: 'Avtomobili' };
  }
  if (clean.toLowerCase().includes('umra')) {
    return { line1: 'Umra Safariga', line2: 'Yo‘llanma' };
  }
  if (clean.toLowerCase().includes('sanatoriy') || clean.toLowerCase().includes('dam olish')) {
    return { line1: 'Sanatoriyga', line2: '3 Kunlik Vaucher' };
  }
  if (clean.toLowerCase().includes('pul')) {
    return { line1: 'Yirik Pul', line2: 'Mukofotlari' };
  }
  if (clean.toLowerCase().includes('konkurs')) {
    return { line1: 'Katta Konkursga', line2: 'Yo‘llanma' };
  }
  if (clean.toLowerCase().includes('iphone')) {
    return { line1: 'iPhone 16', line2: 'Pro Max' };
  }
  if (clean.toLowerCase().includes('pech') || clean.toLowerCase().includes('mikro')) {
    return { line1: 'Mikroto‘lqinli', line2: 'Pech' };
  }

  const words = clean.split(' ');
  if (words.length <= 1) {
    return { line1: words[0], line2: '' };
  }
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(' '),
    line2: words.slice(mid).join(' '),
  };
}

export const DEFAULT_7_PRIZES: WheelSegment[] = [
  {
    id: 'prize-1',
    label: 'Nexia 3 Avtomobili',
    subLabel: 'Bosh sovrin',
    icon: 'car',
    color: '#DC2626',
  },
  {
    id: 'prize-2',
    label: 'Umra Safariga Yo‘llanma',
    subLabel: 'Ziyorat',
    icon: 'plane',
    color: '#059669',
  },
  {
    id: 'prize-3',
    label: 'Sanatoriyga 3 Kunlik Vaucher',
    subLabel: 'Dam olish',
    icon: 'ticket',
    color: '#2563EB',
  },
  {
    id: 'prize-4',
    label: 'Yirik Pul Mukofotlari',
    subLabel: 'Naqd pul',
    icon: 'banknote',
    color: '#D97706',
  },
  {
    id: 'prize-5',
    label: 'Katta Konkursga Yo‘llanma',
    subLabel: 'Final bosqich',
    icon: 'trophy',
    color: '#7C3AED',
  },
  {
    id: 'prize-6',
    label: 'iPhone 16 Pro Max',
    subLabel: 'Smartfon',
    icon: 'smartphone',
    color: '#D4AF37',
  },
  {
    id: 'prize-7',
    label: 'Mikroto‘lqinli Pech',
    subLabel: 'Maishiy texnika',
    icon: 'microwave',
    color: '#0D9488',
  },
];

export const FortuneWheel: React.FC<FortuneWheelProps> = ({
  segmentsCount,
  segments = [],
  isSpinning,
  targetPrizeIndex,
  onSpinEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickSegmentRef = useRef<number>(-1);
  const [size, setSize] = useState<number>(380);

  // Resize listener for responsive mobile-friendly canvas
  useEffect(() => {
    const handleResize = () => {
      const containerWidth = window.innerWidth;
      if (containerWidth < 360) {
        setSize(280);
      } else if (containerWidth < 640) {
        setSize(310);
      } else {
        setSize(360);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeSegments = segments && segments.length > 0 ? segments : DEFAULT_7_PRIZES;
  const totalSegments = activeSegments.length;
  const segmentAngle = 360 / totalSegments;

  // Distinct luxury sector color scheme
  const defaultColors = [
    '#B45309', // Warm Bronze Gold
    '#1E3A8A', // Deep Royal Blue
    '#0284C7', // Vivid Sky Blue
    '#92400E', // Amber Bronze
    '#065F46', // Emerald Forest
    '#4C1D95', // Royal Purple
    '#0F172A', // Midnight Slate
    '#B91C1C', // Ruby Crimson
  ];

  // Render Wheel on Canvas with Real 5 Prizes
  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = size;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    ctx.scale(dpr, dpr);

    const centerX = displaySize / 2;
    const centerY = displaySize / 2;
    const outerRadius = displaySize / 2 - 14;
    const innerRadius = 46;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // 1. Draw outer decorative gold ring with glowing lights
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius + 8, 0, 2 * Math.PI);
    const outerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      outerRadius - 10,
      centerX,
      centerY,
      outerRadius + 12
    );
    outerGradient.addColorStop(0, '#B45309');
    outerGradient.addColorStop(0.5, '#F59E0B');
    outerGradient.addColorStop(0.8, '#FCD34D');
    outerGradient.addColorStop(1, '#78350F');
    ctx.fillStyle = outerGradient;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
    ctx.shadowBlur = 18;
    ctx.fill();

    // Dark inset bezel
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#02140C';
    ctx.fill();
    ctx.restore();

    // 2. Draw rotating wheel segments
    ctx.save();
    ctx.translate(centerX, centerY);
    // Convert degrees to radians
    ctx.rotate((rotationAngle * Math.PI) / 180);

    for (let i = 0; i < totalSegments; i++) {
      const seg = activeSegments[i];
      const startAngle = (i * segmentAngle * Math.PI) / 180;
      const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;

      // Segment wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, outerRadius - 2, startAngle, endAngle);
      ctx.closePath();

      // Background color
      const segColor = seg?.color || defaultColors[i % defaultColors.length];
      ctx.fillStyle = segColor;
      ctx.fill();

      // Subtle radial dark gradient for 3D depth
      const wedgeGrad = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
      wedgeGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
      wedgeGrad.addColorStop(0.7, 'rgba(0,0,0,0.05)');
      wedgeGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = wedgeGrad;
      ctx.fill();

      // Golden border line between segments
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Sector Content (Prize Name & Icon)
      ctx.save();
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      ctx.rotate(midAngle);

      // Translate along the radial direction towards the middle of the segment
      const textRadius = outerRadius * 0.62;
      ctx.translate(textRadius, 0);
      ctx.rotate(Math.PI / 2);

      const isSmall = displaySize < 350;

      // Draw Prize Emoji / Icon
      const emoji = getPrizeEmoji(seg?.icon);
      ctx.font = `${isSmall ? '16px' : '20px'} sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 4;
      ctx.fillText(emoji, 0, isSmall ? -24 : -28);

      // Draw Prize Title lines
      const prizeName = seg?.label || `Sovg‘a №${i + 1}`;
      const { line1, line2 } = formatPrizeTitle(prizeName);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${isSmall ? '10px' : '12px'} 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 5;

      if (line2) {
        ctx.fillText(line1, 0, isSmall ? -8 : -10);
        ctx.fillStyle = '#FEF08A';
        ctx.font = `700 ${isSmall ? '9px' : '11px'} 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(line2, 0, isSmall ? 6 : 7);
      } else {
        ctx.fillText(line1, 0, 0);
      }

      // Draw Sector Number
      ctx.fillStyle = '#FCD34D';
      ctx.font = `600 ${isSmall ? '8px' : '9px'} sans-serif`;
      ctx.fillText(`★ № ${i + 1} ★`, 0, isSmall ? 20 : 24);

      ctx.restore();
    }

    // Outer decorative studs / glowing bulbs on the rim
    const studCount = totalSegments * 3;
    for (let s = 0; s < studCount; s++) {
      const angle = (s * (360 / studCount) * Math.PI) / 180;
      const sx = Math.cos(angle) * (outerRadius - 6);
      const sy = Math.sin(angle) * (outerRadius - 6);

      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = s % 2 === 0 ? '#FEF08A' : '#F59E0B';
      ctx.fill();
    }

    ctx.restore(); // restore wheel rotation

    // 3. Draw Center Metallic Gold Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(
      centerX - 10,
      centerY - 10,
      4,
      centerX,
      centerY,
      innerRadius
    );
    centerGrad.addColorStop(0, '#FEF08A');
    centerGrad.addColorStop(0.3, '#F59E0B');
    centerGrad.addColorStop(0.8, '#B45309');
    centerGrad.addColorStop(1, '#78350F');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Center Gold Ring
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center Emblem
    ctx.fillStyle = '#02140C';
    ctx.font = `800 ${displaySize < 350 ? '10px' : '12px'} 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUMMAYA', centerX, centerY - 2);

    ctx.fillStyle = '#78350F';
    ctx.font = '700 7px sans-serif';
    ctx.fillText('★ SALOMATLIK ★', centerX, centerY + 11);

    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [size, totalSegments, segments]);

  // Handle Spinning Animation (stops precisely at server-dictated targetPrizeIndex)
  useEffect(() => {
    if (!isSpinning || targetPrizeIndex === null) return;

    // Pointer is fixed at top: 12 o'clock (270 degrees in standard canvas coords)
    const pointerAngle = 270;
    const targetCenter = targetPrizeIndex * segmentAngle + segmentAngle / 2;

    const targetNormalizedRotation = (pointerAngle - targetCenter + 360) % 360;
    const startRotation = currentRotationRef.current;
    const fullSpins = 6 + Math.floor(Math.random() * 2); // 6 to 7 full revolutions
    const targetTotalRotation =
      startRotation + (360 - (startRotation % 360)) + fullSpins * 360 + targetNormalizedRotation;

    const spinDuration = 5200; // 5.2 seconds
    const startTime = performance.now();

    // Quintic ease-out for physical heavy-wheel feel
    const easeOutQuint = (t: number): number => {
      return 1 - Math.pow(1 - t, 5);
    };

    lastTickSegmentRef.current = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / spinDuration);
      const easedProgress = easeOutQuint(progress);

      const currentAngle = startRotation + (targetTotalRotation - startRotation) * easedProgress;
      currentRotationRef.current = currentAngle;

      // Realistic click sound on each segment crossing
      const currentPointerSegment =
        Math.floor(((pointerAngle - (currentAngle % 360) + 360) % 360) / segmentAngle);

      if (currentPointerSegment !== lastTickSegmentRef.current) {
        lastTickSegmentRef.current = currentPointerSegment;
        playTickSound();
      }

      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentRotationRef.current = targetTotalRotation % 360;
        drawWheel(currentRotationRef.current);
        playWinSound();
        setTimeout(() => {
          onSpinEnd();
        }, 300);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpinning, targetPrizeIndex, totalSegments, segmentAngle]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      {/* Outer Halo Glow */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700"
        style={{
          width: `${size + 24}px`,
          height: `${size + 24}px`,
          background:
            'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(30, 58, 138, 0.18) 50%, transparent 75%)',
          filter: 'blur(12px)',
        }}
      />

      {/* Top Gold Pointer Indicator */}
      <div
        className="relative z-20 -mb-5 flex flex-col items-center pointer-events-none drop-shadow-xl"
        style={{ width: '48px' }}
      >
        <div className="w-9 h-11 relative flex items-center justify-center">
          <svg
            viewBox="0 0 40 48"
            className="w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
          >
            <defs>
              <linearGradient id="pointerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            <path
              d="M 20 46 L 5 14 C 3 9, 7 3, 20 3 C 33 3, 37 9, 35 14 Z"
              fill="url(#pointerGoldGrad)"
              stroke="#FFFBEB"
              strokeWidth="1.5"
            />
            <circle cx="20" cy="14" r="5" fill="#DC2626" stroke="#FEF08A" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Main Wheel Canvas */}
      <div
        className="relative rounded-full p-1 bg-gradient-to-b from-amber-400/40 via-amber-600/20 to-blue-900/40 shadow-2xl"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="rounded-full shadow-[inset_0_4px_16px_rgba(0,0,0,0.7)]"
        />
      </div>
    </div>
  );
};
