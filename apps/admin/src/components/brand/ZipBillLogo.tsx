import React from 'react';

interface ZipBillLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'badge';
  invert?: boolean;
  businessType?: string;
}

const BUSINESS_TYPE_DISPLAY: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  BAKERY: 'Bakery',
  FAST_FOOD: 'Fast Food',
  CLOUD_KITCHEN: 'Cloud Kitchen',
  FOOD_COURT: 'Food Court',
  BAR: 'Bar & Lounge',
  HOTEL_RESTAURANT: 'Hotel',
  HOTEL: 'Hotel',
};

export function ZipBillLogo({
  className = '',
  size = 'md',
  variant = 'full',
  invert = false,
  businessType,
}: ZipBillLogoProps) {
  const [activeType, setActiveType] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (businessType) {
      setActiveType(businessType);
      return;
    }
    if (typeof window !== 'undefined') {
      const savedBType = localStorage.getItem('saas_active_business_type');
      if (savedBType) {
        setActiveType(savedBType);
        return;
      }
      try {
        const pendingReg = localStorage.getItem('saas_pending_registration');
        if (pendingReg) {
          const parsed = JSON.parse(pendingReg);
          if (parsed.businessType) {
            setActiveType(parsed.businessType);
            return;
          }
        }
        const profileStr = localStorage.getItem('saas_active_profile');
        if (profileStr) {
          const p = JSON.parse(profileStr);
          if (p.businessType) {
            setActiveType(p.businessType);
            return;
          }
        }
        const tenantStr = localStorage.getItem('saas_active_tenant');
        if (tenantStr) {
          const t = JSON.parse(tenantStr);
          if (t.businessType) {
            setActiveType(t.businessType);
            return;
          }
        }
      } catch (e) {}
    }
  }, [businessType]);

  const resolvedType = businessType || activeType;
  const subtitleText = resolvedType
    ? (BUSINESS_TYPE_DISPLAY[resolvedType.toUpperCase()] || resolvedType.replace(/_/g, ' '))
    : 'Restaurant';
  const sizeMap = {
    sm: {
      fontSize: 'text-lg',
      subSize: 'text-[7.5px]',
      subMt: 'mt-1',
      speedTopW: 'w-[9px]',
      speedMiddleW: 'w-[18px]',
      speedBottomW: 'w-[9px]',
      speedH: 'h-[2.5px]',
      speedGap: 'gap-[2.5px]',
      speedOffset: '-translate-y-0.5',
      leafW: 'w-[7px] h-[7px]',
      leafTop: '-top-[1px] left-[1px]',
      swooshW: 'w-[64px] h-[8px]',
      swooshLeft: 'left-[32px]',
      swooshBottom: '-bottom-[5px]',
      iconW: 32,
      iconH: 20,
    },
    md: {
      fontSize: 'text-2xl',
      subSize: 'text-[9.5px]',
      subMt: 'mt-1.5',
      speedTopW: 'w-[12px]',
      speedMiddleW: 'w-[24px]',
      speedBottomW: 'w-[12px]',
      speedH: 'h-[3.2px]',
      speedGap: 'gap-[3.2px]',
      speedOffset: '-translate-y-0.5',
      leafW: 'w-[9px] h-[9px]',
      leafTop: '-top-[2px] left-[1.5px]',
      swooshW: 'w-[86px] h-[10px]',
      swooshLeft: 'left-[42px]',
      swooshBottom: '-bottom-[7px]',
      iconW: 42,
      iconH: 26,
    },
    lg: {
      fontSize: 'text-3xl',
      subSize: 'text-[11.5px]',
      subMt: 'mt-2',
      speedTopW: 'w-[15px]',
      speedMiddleW: 'w-[30px]',
      speedBottomW: 'w-[15px]',
      speedH: 'h-[4px]',
      speedGap: 'gap-[4px]',
      speedOffset: '-translate-y-1',
      leafW: 'w-[12px] h-[12px]',
      leafTop: '-top-[3px] left-[2px]',
      swooshW: 'w-[110px] h-[13px]',
      swooshLeft: 'left-[54px]',
      swooshBottom: '-bottom-[9px]',
      iconW: 52,
      iconH: 32,
    },
    xl: {
      fontSize: 'text-5xl',
      subSize: 'text-[14px]',
      subMt: 'mt-2.5',
      speedTopW: 'w-[22px]',
      speedMiddleW: 'w-[44px]',
      speedBottomW: 'w-[22px]',
      speedH: 'h-[5.5px]',
      speedGap: 'gap-[5.5px]',
      speedOffset: '-translate-y-1.5',
      leafW: 'w-[17px] h-[17px]',
      leafTop: '-top-[4px] left-[3px]',
      swooshW: 'w-[165px] h-[18px]',
      swooshLeft: 'left-[80px]',
      swooshBottom: '-bottom-[12px]',
      iconW: 70,
      iconH: 42,
    },
  };

  const currentSize = sizeMap[size];

  // Standalone Brand Icon matching official logomark exactly (3 speed streaks + Z with leaf accent)
  const BrandIcon = ({ className: customClass = '' }: { className?: string }) => (
    <svg
      viewBox="0 18 160 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${customClass}`}
      style={{ width: currentSize.iconW, height: currentSize.iconH }}
      aria-hidden="true"
    >
      {/* 3 Speed streaks: top & bottom identical (w=37), middle extends 2x to the left (w=75) */}
      <rect x="33" y="47" width="37" height="12" rx="6" fill="#EA580C" />
      <rect x="0" y="70" width="75" height="12" rx="6" fill="#EA580C" />
      <rect x="33" y="94" width="37" height="12" rx="6" fill="#EA580C" />
      {/* Z lettermark */}
      <path
        d="M94 42H149V56L115 96H151V109H91V96L126 56H94V42Z"
        fill={invert ? '#FFFFFF' : '#1C1917'}
      />
      {/* Leaf accent */}
      <path
        d="M141 23C148 27 151 32 147 38C143 43 133 46 124 46C124 40 126 31 133 26C136 24 139 23 141 23Z"
        fill="#EA580C"
      />
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] border border-amber-500/30 p-2 shadow-sm ${className}`}
      >
        <BrandIcon className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="flex items-baseline relative leading-none">
        {/* Speed lines on left: 3 streaks matching logomark (middle extends 2x to left, top/bottom equal) */}
        <div
          className={`flex flex-col items-end ${currentSize.speedGap} mr-2.5 ${currentSize.speedOffset} shrink-0`}
        >
          <div
            className={`${currentSize.speedTopW} ${currentSize.speedH} bg-[#EA580C] rounded-full`}
          />
          <div
            className={`${currentSize.speedMiddleW} ${currentSize.speedH} bg-[#EA580C] rounded-full`}
          />
          <div
            className={`${currentSize.speedBottomW} ${currentSize.speedH} bg-[#EA580C] rounded-full`}
          />
        </div>

        {/* Wordmark: ZipBill */}
        <div
          className={`flex items-baseline font-black tracking-tight ${currentSize.fontSize} leading-none`}
        >
          {/* Zip with Leaf Dot */}
          <span
            className={`${
              invert ? 'text-white' : 'text-[#1C1917]'
            } tracking-tight font-sans`}
            style={{ letterSpacing: '-0.03em' }}
          >
            Z
          </span>
          <span
            className={`relative inline-block ${
              invert ? 'text-white' : 'text-[#1C1917]'
            } font-sans`}
          >
            ı
            {/* Orange leaf replacing standard dot */}
            <svg
              className={`absolute ${currentSize.leafTop} ${currentSize.leafW} rotate-[15deg] pointer-events-none`}
              viewBox="0 0 24 24"
              fill="#EA580C"
              aria-hidden="true"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
          </span>
          <span
            className={`${
              invert ? 'text-white' : 'text-[#1C1917]'
            } tracking-tight font-sans`}
            style={{ letterSpacing: '-0.03em' }}
          >
            p
          </span>

          {/* Bill (slanted italic orange) */}
          <span
            className="text-[#EA580C] italic font-black ml-0.5 font-sans"
            style={{ letterSpacing: '-0.02em' }}
          >
            Bill
          </span>
        </div>

        {/* Orange curved swoosh underline */}
        <svg
          className={`absolute ${currentSize.swooshBottom} ${currentSize.swooshLeft} ${currentSize.swooshW} pointer-events-none`}
          viewBox="0 0 100 14"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 3C25 11 65 14 98 2C70 12 35 11 2 3Z" fill="#EA580C" />
        </svg>
      </div>

      {/* Subtitle tag */}
      {variant === 'full' && (
        <div
          className={`${currentSize.subSize} tracking-[0.24em] font-bold uppercase ${currentSize.subMt} ${
            invert ? 'text-stone-300' : 'text-[#78716C]'
          } pl-0.5`}
          style={{ letterSpacing: '0.24em' }}
        >
          {subtitleText}
        </div>
      )}
    </div>
  );
}

export default ZipBillLogo;
