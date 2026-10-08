import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * PhonePe Official Style Icon
 */
export function PhonePeIcon({ className = 'w-5 h-5', size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect width="40" height="40" rx="10" fill="#5F259F" />
      {/* Top Matra Accent */}
      <path
        d="M24.8 9.2c-.4-.4-1.2-.4-1.6 0l-3.8 3.8h-7.8c-.7 0-1.2.5-1.2 1.2 0 .7.5 1.2 1.2 1.2h2.2v14.4c0 .7.5 1.2 1.2 1.2h2.8c.7 0 1.2-.5 1.2-1.2v-6.2h3.4c5.2 0 8.8-3.4 8.8-8.4 0-3.8-2.5-6-6.2-6zm-.6 10.4h-6.4v-5.6h6.4c2.8 0 4.4 1.4 4.4 3.6s-1.6 3.6-4.4 3.6z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Google Pay (GPay) Official 4-Color Icon
 */
export function GooglePayIcon({ className = 'w-5 h-5', size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect width="40" height="40" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      <path
        d="M28.4 20.3c0-.8-.1-1.5-.2-2.2H20v4.2h4.7c-.2 1.1-.9 2.1-1.9 2.8v2.3h3.1c1.8-1.7 2.8-4.2 2.8-7.1z"
        fill="#4285F4"
      />
      <path
        d="M20 28.8c2.4 0 4.4-.8 5.8-2.2l-3.1-2.3c-.8.5-1.8.8-2.7.8-2.1 0-3.9-1.4-4.5-3.3h-3.2v2.4c1.6 3.1 4.7 4.6 7.7 4.6z"
        fill="#34A853"
      />
      <path
        d="M15.5 21.8c-.2-.5-.3-1.1-.3-1.8s.1-1.3.3-1.8v-2.4h-3.2c-.7 1.3-1 2.7-1 4.2s.3 2.9 1 4.2l3.2-2.4z"
        fill="#FBBC05"
      />
      <path
        d="M20 14.6c1.3 0 2.5.4 3.4 1.3l2.6-2.6c-1.6-1.5-3.6-2.4-6-2.4-3 0-6.1 1.5-7.7 4.6l3.2 2.4c.6-1.9 2.4-3.3 4.5-3.3z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Paytm Official 2-Tone Icon (Navy & Cyan)
 */
export function PaytmIcon({ className = 'w-5 h-5', size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 52 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size * 1.3, height: size } : undefined}
    >
      <rect width="52" height="40" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* 'Pay' in Navy Blue #002970 */}
      <path
        d="M8 13.5h5.4c2.4 0 3.8 1.2 3.8 3.1 0 2-1.4 3.2-3.8 3.2h-2.6v6.7H8V13.5zm2.8 4.3h2.6c.9 0 1.4-.4 1.4-1.2 0-.8-.5-1.1-1.4-1.1h-2.6v2.3z"
        fill="#002970"
      />
      <path
        d="M18 21.2c0-1.8 1.4-2.8 3.6-2.8.9 0 1.8.2 2.3.5v-.4c0-.9-.6-1.4-1.6-1.4-.8 0-1.5.3-2.1.6l-.7-1.4c.9-.5 2-.9 3.2-.9 2.1 0 3.4 1.1 3.4 3.1v7.6h-2.1v-1.1c-.6.7-1.5 1.3-2.6 1.3-1.8 0-3.4-1.1-3.4-2.9zm5.9.3v-.8c-.4-.2-1.1-.4-1.8-.4-1.2 0-1.9.5-1.9 1.3 0 .8.6 1.3 1.6 1.3.9 0 1.6-.5 2.1-1.4z"
        fill="#002970"
      />
      <path
        d="M28.4 18.6h2.4l1.8 5.6 1.8-5.6h2.3l-3.3 8.8c-.7 1.8-1.6 2.6-3.2 2.6-.5 0-1-.1-1.3-.2l.3-1.6c.2.1.6.2.9.2.9 0 1.4-.4 1.8-1.5l.3-.8-3.5-7.5z"
        fill="#002970"
      />
      {/* 'tm' in Bright Cyan #00BAF2 */}
      <path
        d="M38.2 15.2h2.2v3.4h2v1.8h-2v4.4c0 .7.3 1 1 1h1v1.8h-1.6c-1.8 0-2.6-.9-2.6-2.8V20.4h-1.4v-1.8h1.4v-3.4z"
        fill="#00BAF2"
      />
      <path
        d="M43.8 18.6H46v1.4c.6-.9 1.6-1.6 2.8-1.6 1.3 0 2.2.6 2.6 1.6.7-1 1.7-1.6 3-1.6 2 0 3.2 1.3 3.2 3.6v5.9h-2.2v-5.4c0-1.2-.6-1.8-1.5-1.8-.9 0-1.6.6-1.9 1.7v5.5h-2.2v-5.4c0-1.2-.6-1.8-1.5-1.8-.9 0-1.6.6-1.9 1.7v5.5h-2.2v-7.9z"
        fill="#00BAF2"
      />
    </svg>
  );
}

/**
 * BHIM / UPI Official Dual-Triangle Arrow Logo
 */
export function BhimUpiIcon({ className = 'w-5 h-5', size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect width="40" height="40" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      {/* UPI Green Arrow */}
      <path d="M22.5 8.5l6.5 11.5-6.5 11.5h-5.4l6.5-11.5-6.5-11.5h5.4z" fill="#097F5D" />
      {/* UPI Orange Arrow */}
      <path d="M16.5 8.5l6.5 11.5-6.5 11.5h-5.4l6.5-11.5-6.5-11.5h5.4z" fill="#F37021" />
    </svg>
  );
}

/**
 * Row badge of all popular Indian UPI apps
 */
export function PaymentAppsBadgeRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 flex-wrap ${className}`}>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 shadow-2xs">
        <PhonePeIcon className="w-4 h-4" />
        <span className="text-[11px] font-bold text-purple-900">PhonePe</span>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 shadow-2xs">
        <GooglePayIcon className="w-4 h-4" />
        <span className="text-[11px] font-bold text-blue-900">Google Pay</span>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 shadow-2xs">
        <PaytmIcon className="w-5 h-4" />
        <span className="text-[11px] font-bold text-sky-900">Paytm</span>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
        <BhimUpiIcon className="w-4 h-4" />
        <span className="text-[11px] font-bold text-emerald-900">BHIM UPI</span>
      </div>
    </div>
  );
}
