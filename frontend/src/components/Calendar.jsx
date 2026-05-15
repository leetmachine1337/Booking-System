import React, { useState } from 'react';
import './Calendar.css';

const parseCalendarDate = (date) => {
    if (!date) return null;
    if (date instanceof Date) return date;

    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const Calendar = ({ selectedDate, onSelectDate, minDate, maxDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date(selectedDate || new Date().setHours(0,0,0,0)));
    const minCalendarDate = parseCalendarDate(minDate);
    const maxCalendarDate = parseCalendarDate(maxDate);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // 0 = Monday, 6 = Sunday (European week)
    };

    const prevMonth = () => {
        if (!isPrevMonthDisabled) {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        }
    };
    const nextMonth = () => {
        if (!isNextMonthDisabled) {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        }
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const currentMonthStart = new Date(year, month, 1);
    const nextMonthStart = new Date(year, month + 1, 1);
    const minMonthStart = minCalendarDate ? new Date(minCalendarDate.getFullYear(), minCalendarDate.getMonth(), 1) : null;
    const isPrevMonthDisabled = minMonthStart && currentMonthStart <= minMonthStart;
    const isNextMonthDisabled = maxCalendarDate && nextMonthStart > maxCalendarDate;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="custom-calendar">
            <div className="calendar-header">
                <button type="button" onClick={prevMonth} disabled={isPrevMonthDisabled}>&lt;</button>
                <span>{monthNames[month]} {year}</span>
                <button type="button" onClick={nextMonth} disabled={isNextMonthDisabled}>&gt;</button>
            </div>
            <div className="calendar-grid">
                {weekDays.map(d => <div key={d} className="calendar-weekday">{d}</div>)}
                {days.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="calendar-day empty"></div>;
                    
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const calendarDay = parseCalendarDate(dateStr);
                    
                    const isPast = calendarDay < new Date(new Date().setHours(0,0,0,0));
                    const isBeforeMin = minCalendarDate && calendarDay < minCalendarDate;
                    const isBeyondMax = maxCalendarDate && calendarDay > maxCalendarDate;
                    const isWeekend = [0, 6].includes(calendarDay.getDay());
                    const isDisabled = isPast || isBeforeMin || isBeyondMax;
                    const isAvailableWorkday = !isDisabled && !isWeekend;
                    const isSelected = selectedDate === dateStr;

                    return (
                        <button
                            key={dateStr}
                            type="button"
                            className={`calendar-day ${isAvailableWorkday ? 'available' : ''} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && onSelectDate(dateStr)}
                            disabled={isDisabled}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
