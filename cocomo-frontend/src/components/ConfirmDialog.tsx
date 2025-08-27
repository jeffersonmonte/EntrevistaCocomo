import { useEffect } from 'react';

type Props = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
};

export default function ConfirmDialog({
  title, message, confirmText = 'Confirmar', cancelText = 'Cancelar',
  onConfirm, onCancel, open
}: Props) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onCancel(); }
    if (open) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
      display:'grid', placeItems:'center', zIndex:1000
    }}>
      <div className="card" style={{width:480, maxWidth:'95%'}}>
        <h3 style={{marginTop:0}}>{title}</h3>
        {message && <p style={{opacity:.9}}>{message}</p>}
        <div className="row" style={{justifyContent:'flex-end', gap:8}}>
          <button className="button secondary" onClick={onCancel}>{cancelText}</button>
          <button className="button danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
