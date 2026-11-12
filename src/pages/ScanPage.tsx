import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  SwitchCamera,
  VideoOff,
  QrCode,
  Play,
} from 'lucide-react';
import jsQR from 'jsqr';
import { parseUpiUri, parseEmvCoQr, isValidVpa } from '../lib/upi';
import { api } from '../lib/api';
import { RiskAnalysis } from '../lib/types';
import { RiskCard } from '../components/RiskCard';
import { ReceiverInfoCard } from '../components/ReceiverInfoCard';
import { useAccessibility } from '../context/AccessibilityContext';

interface ScanPageProps {
  onNavigate: (page: any, params?: any) => void;
}

export function ScanPage({ onNavigate }: ScanPageProps) {
  const { t } = useAccessibility();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    vpa: string;
    name?: string;
    amount?: number;
    note?: string;
  } | null>(null);

  const [enteredAmount, setEnteredAmount] = useState<string>('');
  const [enteredNote, setEnteredNote] = useState<string>('');

  const [manualVpa, setManualVpa] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {}
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = canvasRef.current;
    if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleQrDecoded(code.data);
            return; // stop scanning once decoded
          }
        } catch (e) {
          console.warn('QR scan frame error:', e);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, []);

  const startCamera = useCallback(async (facingOverride?: 'environment' | 'user') => {
    const targetFacing = facingOverride || cameraFacing;
    setCameraError(null);
    setCameraLoading(true);

    // Cancel any active animation frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Stop and release any existing media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {}
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access (getUserMedia) is not supported in this browser or environment.');
      setCameraLoading(false);
      setCameraActive(false);
      return;
    }

    // Check device enumeration to detect missing camera hardware early
    try {
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        if (devices.length > 0 && videoInputs.length === 0) {
          setCameraError('No camera hardware detected on your device. You can test with a sample QR or upload an image.');
          setCameraLoading(false);
          setCameraActive(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Device enumeration check caught:', e);
    }

    // Tiered constraints: try ideal facingMode first, then graceful fallbacks
    const constraintAttempts: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: targetFacing },
        },
        audio: false,
      },
      {
        video: {
          facingMode: targetFacing === 'environment' ? 'user' : 'environment',
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let stream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraints of constraintAttempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err: any) {
        lastError = err;
        console.warn('Constraint attempt failed:', constraints, err);
        // If permission was explicitly denied by the user, stop attempting
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          break;
        }
      }
    }

    if (!stream) {
      console.warn('All camera constraint attempts failed:', lastError);
      let errMsg = 'Unable to start camera. Please verify camera permissions or upload a QR image.';
      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was not granted. Please click "Grant Camera Permission" below or allow access in your browser settings.';
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        errMsg = 'No camera hardware found on this device. You can upload an image or scan a sample QR below.';
      } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
        errMsg = 'Camera is currently in use by another application or tab. Please close it and retry.';
      } else if (lastError?.message) {
        errMsg = `Camera error: ${lastError.message}`;
      }
      setCameraError(errMsg);
      setCameraLoading(false);
      setCameraActive(false);
      return;
    }

    streamRef.current = stream;

    // Attach stream to the video element
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      video.srcObject = stream;

      // Listen for unexpected track closures
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopCamera();
        };
      }

      // Wait until metadata/frames are loaded before activating viewfinder
      try {
        await new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              resolve();
            }
          };

          if (video.readyState >= 2) {
            finish();
          } else {
            video.onloadedmetadata = finish;
            video.oncanplay = finish;
            setTimeout(finish, 800); // safety fallback timeout
          }
        });

        await video.play();
      } catch (playErr: any) {
        console.warn('Video play attempt error:', playErr);
      }

      setCameraActive(true);
      setCameraLoading(false);
      setCameraError(null);

      // Start continuous scanning loop
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } else {
      setCameraActive(true);
      setCameraLoading(false);
    }
  }, [cameraFacing, scanFrame, stopCamera]);

  useEffect(() => {
    startCamera();

    // Monitor permission changes if supported
    if (navigator?.permissions?.query) {
      try {
        navigator.permissions.query({ name: 'camera' as any }).then((perm) => {
          perm.onchange = () => {
            if (perm.state === 'granted') {
              startCamera();
            } else if (perm.state === 'denied') {
              setCameraError('Camera permission is blocked in browser settings. Please allow access and retry.');
              stopCamera();
            }
          };
        }).catch(() => {});
      } catch {}
    }

    return () => {
      stopCamera();
    };
  }, []);

  function toggleCameraFacing() {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  }

  async function handleQrDecoded(raw: string) {
    stopCamera();
    playBeep();

    const parsed = parseUpiUri(raw) || parseEmvCoQr(raw);
    if (parsed && parsed.pa) {
      const result = {
        vpa: parsed.pa,
        name: parsed.pn,
        amount: parsed.am ? Number(parsed.am) : undefined,
        note: parsed.tn,
      };
      setScannedResult(result);
      const initialAmt = result.amount ? String(result.amount) : '';
      const initialNote = result.note || '';
      setEnteredAmount(initialAmt);
      setEnteredNote(initialNote);
      evaluateRiskForPayee(result.vpa, result.name, result.amount, result.note);
    } else if (isValidVpa(raw.trim())) {
      const result = { vpa: raw.trim() };
      setScannedResult(result);
      setEnteredAmount('');
      setEnteredNote('');
      evaluateRiskForPayee(result.vpa);
    } else {
      setCameraError(`Decoded QR code is not a valid UPI format: "${raw.slice(0, 60)}"`);
    }
  }

  function playBeep() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleQrDecoded(code.data);
          } else {
            setCameraError('No QR code could be detected in this uploaded image.');
          }
        }
      };
    };
    reader.readAsDataURL(file);
  }

  async function evaluateRiskForPayee(
    vpa: string,
    name?: string,
    amount?: number,
    note?: string
  ) {
    setEvaluating(true);
    setRiskAnalysis(null);
    try {
      const analysis = await api.evaluateRisk({
        payeeVpa: vpa,
        payeeName: name,
        amount,
        note,
      });
      setRiskAnalysis(analysis);
    } catch (err: any) {
      console.error(err);
      setCameraError(err.message || 'Risk evaluation error');
    } finally {
      setEvaluating(false);
    }
  }

  function handleManualCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidVpa(manualVpa)) {
      setCameraError('Please enter a valid UPI ID (e.g. merchant@okhdfcbank)');
      return;
    }
    const numAmt = manualAmount ? Number(manualAmount) : undefined;
    const noteVal = manualNote.trim() || undefined;
    const result = {
      vpa: manualVpa.trim().toLowerCase(),
      amount: numAmt,
      note: noteVal,
    };
    setScannedResult(result);
    setEnteredAmount(manualAmount || '');
    setEnteredNote(manualNote || '');
    evaluateRiskForPayee(result.vpa, undefined, numAmt, noteVal);
  }

  function selectDemoTarget(vpa: string, name: string, amount: number, note: string) {
    const result = { vpa, name, amount, note };
    setScannedResult(result);
    setEnteredAmount(amount ? String(amount) : '');
    setEnteredNote(note || '');
    evaluateRiskForPayee(vpa, name, amount, note);
  }

  function handleAmountChange(newAmountStr: string) {
    setEnteredAmount(newAmountStr);
    const numAmt = Number(newAmountStr) || undefined;
    if (scannedResult) {
      evaluateRiskForPayee(scannedResult.vpa, scannedResult.name, numAmt, enteredNote || undefined);
    }
  }

  function handleQuickAddAmount(addVal: number) {
    const current = Number(enteredAmount) || 0;
    const nextVal = current + addVal;
    const nextStr = String(nextVal);
    setEnteredAmount(nextStr);
    if (scannedResult) {
      evaluateRiskForPayee(scannedResult.vpa, scannedResult.name, nextVal, enteredNote || undefined);
    }
  }

  function handleNoteChange(newNote: string) {
    setEnteredNote(newNote);
    const numAmt = Number(enteredAmount) || undefined;
    if (scannedResult) {
      evaluateRiskForPayee(scannedResult.vpa, scannedResult.name, numAmt, newNote || undefined);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Rich Earth Brown Header Banner Box */}
      <div className="rounded-3xl bg-[#8D6E63] text-white p-6 sm:p-7 space-y-2 shadow-xl border border-[#795B50]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A1887F]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F5F5F5] border border-white/20">
          <Camera className="h-3.5 w-3.5 text-[#EFEBE9]" /> UPI Scanner & Risk Screening
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
          {t('scanPageTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-[#F5F5F5]/90 max-w-xl leading-relaxed">
          {t('scanPageSubtitle')}
        </p>
      </div>

      {/* Main Scanner Card */}
      {!scannedResult ? (
        <div className="glass overflow-hidden rounded-3xl border border-glass-border p-6 space-y-6">
          {/* Camera Viewfinder */}
          <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl bg-black border border-border/80 shadow-2xl flex items-center justify-center">
            {/* Always-mounted video to preserve hardware pipe and DOM layout */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none -z-10'
              } ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {cameraActive ? (
              <>
                {/* Laser scan line animation */}
                <div className="absolute inset-x-8 h-0.5 bg-secondary shadow-sm animate-scan pointer-events-none" />

                {/* Target bounding box */}
                <div className="absolute inset-10 border-2 border-secondary/60 rounded-2xl pointer-events-none">
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-secondary" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-secondary" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-secondary" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-secondary" />
                </div>

                {/* Active HUD overlay controls */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-xs border border-white/10">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Scanner ({cameraFacing === 'environment' ? 'Back' : 'Front'})
                  </span>

                  <button
                    onClick={toggleCameraFacing}
                    title="Switch between front and back camera"
                    className="inline-flex items-center gap-1 rounded-full bg-black/60 hover:bg-black/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
                  >
                    <SwitchCamera className="h-3 w-3" /> Flip
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-3 z-10 max-w-xs">
                {cameraLoading ? (
                  <>
                    <RefreshCw className="mx-auto h-10 w-10 text-primary animate-spin" />
                    <p className="text-xs font-semibold text-foreground">Starting Camera...</p>
                    <p className="text-[11px] text-muted-foreground">Requesting camera permissions</p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cameraError || 'Camera is currently paused. Click below to start live UPI scanning.'}
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        onClick={() => startCamera()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {cameraError ? 'Grant Camera Permission' : 'Start Camera'}
                      </button>
                      <button
                        onClick={() =>
                          handleQrDecoded('upi://pay?pa=merchant.safe@hdfcbank&pn=Bharat%20Store&am=500&cu=INR&tn=Store%20Purchase')
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/80 px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <QrCode className="h-3.5 w-3.5 text-primary" /> Test Scan Sample QR
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Upload QR Image & Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-2xs">
              <Upload className="h-4 w-4" />
              Upload QR Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {cameraActive ? (
              <>
                <button
                  onClick={toggleCameraFacing}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <SwitchCamera className="h-3.5 w-3.5" />
                  Switch Lens
                </button>
                <button
                  onClick={stopCamera}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <VideoOff className="h-3.5 w-3.5" />
                  Pause Camera
                </button>
              </>
            ) : (
              <button
                onClick={() => startCamera()}
                className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5" />
                Resume Camera
              </button>
            )}
          </div>

          {/* Quick Demo QR Presets */}
          <div className="pt-2 border-t border-border/40 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
              Or test with preset simulated UPI addresses:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() =>
                  selectDemoTarget(
                    'swiggy.food@icici',
                    'Swiggy Online Food Pvt Ltd',
                    450,
                    'Dinner delivery'
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-safe/40 bg-safe/10 p-2.5 text-left text-xs hover:bg-safe/20 transition-colors shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-safe shrink-0" />
                <div className="truncate">
                  <span className="font-semibold block truncate">Swiggy Official</span>
                  <span className="text-[10px] text-muted-foreground">Safe Merchant</span>
                </div>
              </button>

              <button
                onClick={() =>
                  selectDemoTarget(
                    'friend.rahul@okaxis',
                    'Rahul Verma',
                    1200,
                    'Weekend split'
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-left text-xs hover:bg-primary/10 text-foreground transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <div className="truncate">
                  <span className="font-semibold block truncate">Rahul Verma</span>
                  <span className="text-[10px] text-muted-foreground">Verified Peer</span>
                </div>
              </button>

              <button
                onClick={() =>
                  selectDemoTarget(
                    'lottery.win99@ybl',
                    'Fast Prize Dispatch',
                    2500,
                    'KYC refund fee'
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-high/40 bg-high/10 p-2.5 text-left text-xs hover:bg-high/20 transition-colors shadow-xs cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4 text-high shrink-0" />
                <div className="truncate">
                  <span className="font-semibold block truncate">Prize Dispatch KYC</span>
                  <span className="text-[10px] text-high font-medium">Scam Detected</span>
                </div>
              </button>
            </div>
          </div>

          {/* Manual Input Form */}
          <div className="pt-2 border-t border-border/40">
            <details className="group">
              <summary className="text-xs font-semibold text-primary cursor-pointer hover:underline">
                Enter UPI ID manually instead →
              </summary>
              <form onSubmit={handleManualCheck} className="mt-3 space-y-3">
                <input
                  type="text"
                  placeholder="payee@bank (e.g. merchant@okhdfcbank)"
                  value={manualVpa}
                  onChange={(e) => setManualVpa(e.target.value)}
                  className="w-full rounded-xl border border-input bg-[#EFEBE9] px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="rounded-xl border border-input bg-[#EFEBE9] px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                  <input
                    type="text"
                    placeholder="Payment note"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="rounded-xl border border-input bg-[#EFEBE9] px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
                >
                  Analyze Risk
                </button>
              </form>
            </details>
          </div>
        </div>
      ) : (
        /* Scanned Result & Live Pre-Transfer Risk Evaluation */
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 border border-glass-border space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-safe" /> QR Code Scanned & Verified
              </span>
              <button
                onClick={() => {
                  setScannedResult(null);
                  setRiskAnalysis(null);
                  setEnteredAmount('');
                  setEnteredNote('');
                  startCamera();
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Rescan QR
              </button>
            </div>

            <ReceiverInfoCard
              vpa={scannedResult.vpa}
              name={scannedResult.name}
              amount={Number(enteredAmount) || undefined}
            />

            {/* Enter Payment Amount Section Immediately After Scan */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Enter Payment Amount
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Risk score updates live
                </span>
              </div>

              {/* Amount Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold font-mono text-foreground/70">
                  ₹
                </span>
                <input
                  type="number"
                  autoFocus
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={enteredAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-[#EFEBE9] pl-9 pr-4 py-3 text-2xl font-bold font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs"
                />
              </div>

              {/* Quick Increment Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Quick Amount Chips:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(100)}
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    +₹100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(500)}
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    +₹500
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(1000)}
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    +₹1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(2000)}
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    +₹2,000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddAmount(5000)}
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    +₹5,000
                  </button>
                  {enteredAmount && (
                    <button
                      type="button"
                      onClick={() => handleAmountChange('')}
                      className="rounded-xl border border-border/60 bg-muted/50 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Note Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Payment Purpose / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dinner split, grocery, bill payment"
                  value={enteredNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  className="w-full rounded-xl border border-input bg-[#EFEBE9] px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Evaluating Indicator */}
          {evaluating && (
            <div className="glass rounded-3xl p-8 text-center space-y-3">
              <RefreshCw className="mx-auto h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-semibold">Running FraudShield Risk Analysis...</p>
              <p className="text-xs text-muted-foreground">
                Checking crowdsourced blacklist, social engineering keywords, velocity anomalies & NPCI switch history
              </p>
            </div>
          )}

          {/* Risk Card Result */}
          {riskAnalysis && (
            <RiskCard
              analysis={riskAnalysis}
              proceedLabel="Proceed to Pay in UPI App"
              onProceed={() => {
                const finalAmt = Number(enteredAmount) || scannedResult.amount || 0;
                const finalNote = enteredNote || scannedResult.note || '';
                onNavigate('pay', {
                  payeeVpa: scannedResult.vpa,
                  payeeName: scannedResult.name,
                  amount: finalAmt,
                  note: finalNote,
                  riskScore: riskAnalysis.score,
                  riskTier: riskAnalysis.tier,
                });
              }}
              onCancel={() => {
                setScannedResult(null);
                setRiskAnalysis(null);
                setEnteredAmount('');
                setEnteredNote('');
                startCamera();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
