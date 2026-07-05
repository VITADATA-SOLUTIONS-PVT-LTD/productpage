"use client";
import React, { useState, useMemo } from 'react';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2022 + i); // 2022 to 2032

export default function DashboardCalendar({ events = [] }) {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeEvents = useMemo(() => {
    return Array.isArray(events) ? events : [];
  }, [events]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentMonth, currentYear]);

  const prevMonthDays = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentMonth, currentYear]);

  const calendarDays = useMemo(() => {
    const days = [];

    // Prev month padding days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvents = safeEvents.filter(e => e.date === dateString);
      days.push({
        dayNumber: dayNum,
        dateString,
        isCurrentMonth: false,
        hasEvents: dayEvents.length > 0,
        events: dayEvents
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = safeEvents.filter(e => e.date === dateString);
      days.push({
        dayNumber: i,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        hasEvents: dayEvents.length > 0,
        events: dayEvents
      });
    }

    // Next month padding days to make grid multiple of 7
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = safeEvents.filter(e => e.date === dateString);
      days.push({
        dayNumber: i,
        dateString,
        isCurrentMonth: false,
        hasEvents: dayEvents.length > 0,
        events: dayEvents
      });
    }

    return days;
  }, [currentMonth, currentYear, daysInMonth, firstDayOfWeek, prevMonthDays, safeEvents]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDayClick = (day) => {
    if (day.hasEvents) {
      setSelectedDate(day);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="rounded-2xl border border-[#EEDFD7] bg-white p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="rounded-lg border border-[#E3D4CC] bg-white px-2 py-1 text-xs font-semibold text-[#3D2010] outline-none focus:border-[#D97757]"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="rounded-lg border border-[#E3D4CC] bg-white px-2 py-1 text-xs font-semibold text-[#3D2010] outline-none focus:border-[#D97757]"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg border border-[#E3D4CC] bg-white p-1.5 text-xs text-[#3D2010] hover:bg-[#FFF4EC] transition-colors"
          >
            &lt;
          </button>
          <button
            onClick={handleNextMonth}
            className="rounded-lg border border-[#E3D4CC] bg-white p-1.5 text-xs text-[#3D2010] hover:bg-[#FFF4EC] transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <span key={d} className="text-[10px] font-bold uppercase tracking-wider text-[#8B7469]">{d}</span>
        ))}
      </div>

      {/* Monthly grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => (
          <button
            key={idx}
            onClick={() => handleDayClick(day)}
            disabled={!day.hasEvents}
            className={`flex flex-col items-center justify-center h-10 w-full rounded-xl transition-all relative ${
              day.isToday
                ? 'bg-[#3D2010] cursor-pointer'
                : day.hasEvents
                ? 'hover:bg-[#FFF1E8] cursor-pointer'
                : 'cursor-default opacity-80'
            }`}
          >
            <span className={`text-xs font-bold ${
              day.isToday
                ? 'text-white'
                : day.isCurrentMonth
                ? 'text-[#3D2010]'
                : 'text-gray-400'
            }`}>
              {day.dayNumber}
            </span>
            {day.hasEvents && !day.isToday && (
              <span className="absolute bottom-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            )}
            {day.hasEvents && day.isToday && (
              <span className="absolute bottom-1 w-1.5 h-1.5 bg-[#D97757] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-2xl max-w-md w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#F3EAE5] pb-3 shrink-0">
              <h3 className="font-bold text-lg text-[#3D2010]">
                Schedule - {selectedDate.dayNumber} {MONTHS[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8B7469] hover:text-[#3D2010] font-semibold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {selectedDate.events.map((evt, idx) => (
                <div key={idx} className="border-b border-[#F3EAE5] pb-3 last:border-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded bg-[#FFF1E8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D97757]">
                      {evt.type}
                    </span>
                    <span className="text-xs font-semibold text-[#8B7469]">{evt.time}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#3D2010]">{evt.title}</h4>
                  <p className="text-xs text-[#7A655B]">{evt.details}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white py-2.5 text-sm font-semibold transition-colors shrink-0"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
