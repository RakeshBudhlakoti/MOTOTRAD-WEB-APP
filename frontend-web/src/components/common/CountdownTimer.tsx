'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: string | Date;
  variant?: 'compact' | 'large';
}

export default function CountdownTimer({ endTime, variant = 'compact' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  useEffect(() => {
    const targetDate = new Date(endTime).getTime();
    let interval: any;

    const updateTimer = () => {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        if (interval) clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      });
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [endTime]);

  if (variant === 'large') {
    return (
      <div className="flex justify-center gap-6 lg:gap-8">
        {[
          { val: timeLeft.days, lbl: 'DAYS' },
          { val: timeLeft.hours, lbl: 'HOURS' },
          { val: timeLeft.minutes, lbl: 'MINS' },
          { val: timeLeft.seconds, lbl: 'SECS' }
        ].map((unit, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[2rem] lg:text-[2.8rem] font-extrabold text-[#111] leading-none mb-1">{unit.val}</span>
            <span className="text-[0.6rem] lg:text-[0.65rem] text-[#888] font-bold uppercase tracking-[1px]">{unit.lbl}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full px-5 py-2 flex items-center gap-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.12)] w-[92%] justify-center z-20">
      <div className="flex flex-col items-center">
        <span className="text-[0.95rem] font-bold text-[#111] leading-none mb-0.5">{timeLeft.days}</span>
        <span className="text-[0.5rem] text-[#888] font-bold uppercase tracking-wider">Days</span>
      </div>
      <span className="text-[#DDD] font-light text-lg pb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[0.95rem] font-bold text-[#111] leading-none mb-0.5">{timeLeft.hours}</span>
        <span className="text-[0.5rem] text-[#888] font-bold uppercase tracking-wider">Hrs</span>
      </div>
      <span className="text-[#DDD] font-light text-lg pb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[0.95rem] font-bold text-[#111] leading-none mb-0.5">{timeLeft.minutes}</span>
        <span className="text-[0.5rem] text-[#888] font-bold uppercase tracking-wider">Min</span>
      </div>
      <span className="text-[#DDD] font-light text-lg pb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-[0.95rem] font-bold text-[#111] leading-none mb-0.5">{timeLeft.seconds}</span>
        <span className="text-[0.5rem] text-[#888] font-bold uppercase tracking-wider">Sec</span>
      </div>
    </div>
  );
}
