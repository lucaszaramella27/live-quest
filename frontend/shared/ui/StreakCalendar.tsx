import type { CSSProperties } from 'react'

interface StreakCalendarProps {
  data: { date: string; count: number }[]
  className?: string
}

export function StreakCalendar({ data, className = '' }: StreakCalendarProps) {
  const weeks = 12
  const today = new Date()
  const dates: Date[] = []

  for (let i = weeks * 7 - 1; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date)
  }

  const calendarWeeks: Date[][] = []
  for (let i = 0; i < dates.length; i += 7) {
    calendarWeeks.push(dates.slice(i, i + 7))
  }

  function getActivityCount(date: Date): number {
    const dateStr = date.toISOString().split('T')[0]
    const activity = data.find((item) => item.date === dateStr)
    return activity?.count || 0
  }

  function getColor(count: number): string {
    if (count === 0) return 'activity-0'
    if (count <= 2) return 'activity-1'
    if (count <= 4) return 'activity-2'
    if (count <= 6) return 'activity-3'
    return 'activity-4'
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className={className}>
      <div className="flex gap-1.5">
        <div className="flex flex-col justify-around gap-1 pr-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="h-3" />
          {['Seg', 'Qua', 'Sex'].map((day) => (
            <div key={day} className="flex h-3 items-center">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1.5">
            {calendarWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1.5">
                <div className="h-3 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {week[0].getDate() === 1 ? months[week[0].getMonth()] : ''}
                </div>

                {week.map((date, dayIndex) => {
                  const count = getActivityCount(date)
                  const isToday = date.toDateString() === today.toDateString()

                  return (
                    <div
                      key={dayIndex}
                      className={`group relative h-3 w-3 rounded-sm ${getColor(count)} transition-all duration-200 hover:z-10 hover:scale-125 ${
                        isToday ? 'ring-2 ring-offset-1' : ''
                      }`}
                      style={
                        isToday
                          ? ({
                              '--tw-ring-color': 'var(--color-primary)',
                              '--tw-ring-offset-color': 'var(--color-background)',
                            } as CSSProperties)
                          : undefined
                      }
                      title={`${date.toLocaleDateString('pt-BR')} - ${count} ${count === 1 ? 'atividade' : 'atividades'}`}
                    >
                      <div
                        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded border px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                        style={{
                          background: 'var(--color-background-secondary)',
                          borderColor: 'rgba(148, 163, 184, 0.25)',
                          color: 'var(--color-text)',
                        }}
                      >
                        <div className="font-semibold">{date.toLocaleDateString('pt-BR')}</div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>
                          {count} {count === 1 ? 'atividade' : 'atividades'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Menos</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm activity-0" />
          <div className="h-3 w-3 rounded-sm activity-1" />
          <div className="h-3 w-3 rounded-sm activity-2" />
          <div className="h-3 w-3 rounded-sm activity-3" />
          <div className="h-3 w-3 rounded-sm activity-4" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
