import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useLanguage } from '../i18n';

const PHOTO_QUALITY = 0.92;

const cameraError = (error) => {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'cameraDenied';
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return 'cameraMissing';
  return 'cameraFailed';
};

// Laptop browsers ignore the "capture" setting on a file input and open a file picker,
// so a real camera view is needed for "take photo" to mean what it says.
export default function CameraCapture({ onCapture, onClose, onUseUpload }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const captureRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  useEffect(() => {
    let stream;
    let closed = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((opened) => {
        if (closed) {
          opened.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = opened;
        videoRef.current.srcObject = opened;
      })
      .catch((error) => {
        if (!closed) setErrorKey(cameraError(error));
      });
    return () => {
      closed = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (ready) captureRef.current?.focus();
  }, [ready]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        setErrorKey('cameraFailed');
        return;
      }
      onCapture(new File([blob], 'notice-photo.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', PHOTO_QUALITY);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t.takePhoto}>
      <div className="w-full max-w-2xl rounded-2xl bg-white overflow-hidden shadow-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-200">
          <h2 className="font-bold text-stone-900">{t.takePhoto}</h2>
          <button type="button" onClick={onClose} aria-label={t.cameraClose} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorKey ? (
          <div className="p-6 space-y-4" role="alert">
            <p className="text-stone-800">{t[errorKey]}</p>
            <button type="button" onClick={onUseUpload} className="px-4 py-3 min-h-[46px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>{t.upload}</span>
            </button>
          </div>
        ) : (
          <>
            <div className="bg-stone-900 aspect-video">
              <video ref={videoRef} autoPlay playsInline muted onLoadedData={() => setReady(true)} className="w-full h-full object-contain" />
            </div>
            <div className="p-4 space-y-3 text-center">
              <p className="text-sm text-stone-600">{ready ? t.cameraHint : t.cameraStarting}</p>
              <button
                ref={captureRef}
                type="button"
                onClick={takePhoto}
                disabled={!ready}
                className="px-6 py-3 min-h-[48px] rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold inline-flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>{t.cameraCapture}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
