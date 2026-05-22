'use client';

import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info, Trash2, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmDialogProps) {
  
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-8 h-8 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-blue-600" />;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="System Confirmation" 
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="default" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'success' ? 'success' : variant === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            isLoading={isLoading}
            className="px-6 uppercase tracking-widest text-[10px] font-black"
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 py-2">
        <div className="shrink-0 p-3 bg-slate-50 border border-slate-100 rounded-sm h-fit">
          {getIcon()}
        </div>
        <div className="space-y-2">
           <h3 className="text-base font-bold text-slate-800 leading-tight">{title}</h3>
           <p className="text-xs text-slate-500 font-medium leading-relaxed">
             {message}
           </p>
        </div>
      </div>
    </Modal>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
