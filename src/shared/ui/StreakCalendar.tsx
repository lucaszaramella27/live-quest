interface StreakCalendarProps {
  data: { date: string; count: number }[]
  className?: string
}

export function StreakCalendar({ data, className = '' }: StreakCalendarProps) {
  // Generate last 12 weeks worth of dates
  const weeks = 12
  const today = new Date()
  const dates: Date[] = []
  
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date)
  }

  // Group dates by week
  const calendarWeeks: Date[][] = []
  for (let i = 0; i < dates.length; i += 7) {
    calendarWeeks.push(dates.slice(i, i + 7))
  }

  // Get activity count for a specific date
  function getActivityCount(date: Date): number {
    const dateStr = date.toISOString().split('T')[0]
    const activity = data.find(d => d.date === dateStr)
    return activity?.count || 0
  }

  // Get color based on activity level - uses theme colors via CSS variables
  function getColor(count: number): string {
    if (count === 0) return 'activity-0'
    if (count <= 2) return 'activity-1'
    if (count <= 4) return 'activity-2'
    if (count <= 6) return 'activity-3'
    return 'activity-4'
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className={`${className}`}>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 text-xs text-gray-500 justify-around pr-2">
          <div className="h-3"></div>
          {['Seg', 'Qua', 'Sex'].map(day => (
            <div key={day} className="h-3 flex items-center">{day}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1">
            {calendarWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {/* Month label for first day of month */}
                <div className="h-3 text-[10px] text-gray-500">
                  {week[0].getDate() === 1 ? months[week[0].getMonth()] : ''}
                </div>
                
                {week.map((date, dayIndex) => {
                  const count = getActivityCount(date)
                  const isToday = date.toDateString() === today.toDateString()
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`group relative w-3 h-3 rounded-sm ${getColor(count)} transition-all duration-200 hover:scale-125 hover:z-10 ${
                        isToday ? 'ring-2 ring-offset-1 ring-offset-brand-dark' : ''
                      }`}
                      style={isToday ? { '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties : undefined}
                      title={`${date.toLocaleDateString('pt-BR')} - ${count} ${count === 1 ? 'atividade' : 'atividades'}`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-brand-dark-secondary border border-white/10 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        <div className="font-semibold">{date.toLocaleDateString('pt-BR')}</div>
                        <div className="text-gray-400">{count} {count === 1 ? 'atividade' : 'atividades'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <span>Menos</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm activity-0" />
          <div className="w-3 h-3 rounded-sm activity-1" />
          <div className="w-3 h-3 rounded-sm activity-2" />
          <div className="w-3 h-3 rounded-sm activity-3" />
          <div className="w-3 h-3 rounded-sm activity-4" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
