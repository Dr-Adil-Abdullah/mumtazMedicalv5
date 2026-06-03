import { useMemo, useRef, useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

function chooseDefaultCamera(cameras) {
  const backCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label));
  return backCamera?.id ?? cameras[0]?.id ?? '';
}

function getSupportedFormats(module) {
  const formats = module.Html5QrcodeSupportedFormats;
  return [
    formats.CODE_128,
    formats.CODE_39,
    formats.CODE_93,
    formats.CODABAR,
    formats.EAN_13,
    formats.EAN_8,
    formats.UPC_A,
    formats.UPC_E,
    formats.ITF,
    formats.QR_CODE
  ];
}

export default function CameraScannerModal({
  open,
  onClose,
  onDetected,
  title = 'Camera barcode scanner',
  description = 'Point your camera at a barcode and hold steady.'
}) {
  const scannerRef = useRef(null);
  const scannerModuleRef = useRef(null);
  const regionId = useMemo(() => `camera-scanner-${Math.random().toString(36).slice(2, 10)}`, []);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [status, setStatus] = useState('Waiting to start camera...');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function loadScannerModule() {
    if (scannerModuleRef.current) return scannerModuleRef.current;
    const module = await import('html5-qrcode');
    scannerModuleRef.current = module;
    return module;
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch {
      // ignore cleanup errors
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }

  async function startScanner(cameraId) {
    if (!cameraId || starting) return;

    setError('');
    setStarting(true);
    setStatus('Starting camera...');

    try {
      const scannerModule = await loadScannerModule();
      await stopScanner();
      const scanner = new scannerModule.Html5Qrcode(regionId);
      scannerRef.current = scanner;

      await scanner.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          rememberLastUsedCamera: true,
          formatsToSupport: getSupportedFormats(scannerModule),
          aspectRatio: 1.7778
        },
        async (decodedText) => {
          setStatus(`Detected: ${decodedText}`);
          await stopScanner();
          const detectionResult = await onDetected?.(decodedText);

          if (detectionResult === false) {
            setError(`No matching result for: ${decodedText}`);
            window.setTimeout(() => startScanner(cameraId), 200);
            return;
          }

          onClose?.();
        },
        () => {
          // ignore decode misses for cleaner UX
        }
      );

      setScanning(true);
      setStatus('Camera live. Scan a barcode now.');
    } catch (err) {
      setError(err?.message || 'Camera could not start.');
      setStatus('Camera not running.');
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (!open) {
      stopScanner();
      setError('');
      setStatus('Waiting to start camera...');
      return undefined;
    }

    let active = true;

    async function prepare() {
      try {
        setStatus('Loading scanner library...');
        const scannerModule = await loadScannerModule();
        const available = await scannerModule.Html5Qrcode.getCameras();
        if (!active) return;
        setCameras(available);
        const defaultCameraId = chooseDefaultCamera(available);
        setSelectedCameraId(defaultCameraId);

        if (!available.length) {
          setError('No camera devices were found on this system.');
          setStatus('No camera available.');
          return;
        }

        await startScanner(defaultCameraId);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Camera permission or device access failed.');
        setStatus('Camera not available.');
      }
    }

    prepare();

    return () => {
      active = false;
      stopScanner();
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
          <div className="font-semibold text-white">{description}</div>
          <div className="mt-2 text-slate-400">{status}</div>
          {error ? <div className="mt-2 text-rose-300">{error}</div> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Camera</span>
            <select
              value={selectedCameraId}
              onChange={(event) => setSelectedCameraId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${camera.id}`}
                </option>
              ))}
            </select>
          </label>

          <Button type="button" variant="secondary" disabled={!selectedCameraId || starting} onClick={() => startScanner(selectedCameraId)}>
            {starting ? 'Starting...' : scanning ? 'Restart camera' : 'Start camera'}
          </Button>

          <Button type="button" variant="ghost" onClick={() => stopScanner()}>
            Stop
          </Button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black p-3">
          <div id={regionId} className="min-h-[320px] w-full rounded-2xl bg-slate-950" />
        </div>
      </div>
    </Modal>
  );
}
