interface TrendData {
  date: string;
  mood: number;
  energy: number;
  stress: number;
  entries: number;
}

interface MoodHeatmapProps {
  data: TrendData[];
}

export default function MoodHeatmap({ data }: MoodHeatmapProps) {
  // Get the date range
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 30);

  // Create a map of date to mood
  const moodMap = new Map(
    data.map(trend => [
      new Date(trend.date).toISOString().split('T')[0],
      trend.mood
    ])
  );

  // Generate calendar grid (last 5 weeks)
  const weeks = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Start from 35 days ago (5 weeks)
  const calendarStart = new Date(today);
  calendarStart.setDate(today.getDate() - 34);

  // Adjust to start of week (Sunday)
  const dayOfWeek = calendarStart.getDay();
  calendarStart.setDate(calendarStart.getDate() - dayOfWeek);

  for (let week = 0; week < 5; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(calendarStart);
      currentDate.setDate(calendarStart.getDate() + (week * 7) + day);

      const dateStr = currentDate.toISOString().split('T')[0];
      const mood = moodMap.get(dateStr);
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isFuture = currentDate > today;

      weekDays.push({
        date: currentDate,
        dateStr,
        mood,
        isToday,
        isFuture
      });
    }
    weeks.push(weekDays);
  }

  const getMoodColor = (mood: number | undefined, isFuture: boolean) => {
    if (isFuture) return 'bg-gray-100 border-gray-200';
    if (!mood) return 'bg-gray-200 border-gray-300';
    if (mood >= 4.5) return 'bg-green-500 border-green-600';
    if (mood >= 3.5) return 'bg-blue-400 border-blue-500';
    if (mood >= 2.5) return 'bg-yellow-400 border-yellow-500';
    if (mood >= 1.5) return 'bg-orange-400 border-orange-500';
    return 'bg-red-400 border-red-500';
  };

  const getMoodLabel = (mood: number | undefined) => {
    if (!mood) return 'No data';
    if (mood >= 4.5) return `Great (${mood.toFixed(1)})`;
    if (mood >= 3.5) return `Good (${mood.toFixed(1)})`;
    if (mood >= 2.5) return `Okay (${mood.toFixed(1)})`;
    if (mood >= 1.5) return `Bad (${mood.toFixed(1)})`;
    return `Poor (${mood.toFixed(1)})`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🗓️ Mood Calendar (Last 35 Days)
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Days of week header */}
          <div className="flex gap-2 mb-2">
            <div className="w-8"></div> {/* Spacer for alignment */}
            {daysOfWeek.map(day => (
              <div key={day} className="w-10 text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-2 mb-2">
              <div className="w-8 text-xs text-gray-500 flex items-center">
                W{weekIndex + 1}
              </div>
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 cursor-pointer ${
                    getMoodColor(day.mood, day.isFuture)
                  } ${day.isToday ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
                  title={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${getMoodLabel(day.mood)}`}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
                    {day.date.getDate()}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-600"></div>
          <span className="text-gray-600">Great</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded border-2 border-blue-500"></div>
          <span className="text-gray-600">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded border-2 border-yellow-500"></div>
          <span className="text-gray-600">Okay</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-400 rounded border-2 border-orange-500"></div>
          <span className="text-gray-600">Bad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded border-2 border-red-500"></div>
          <span className="text-gray-600">Poor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded border-2 border-gray-300"></div>
          <span className="text-gray-600">No data</span>
        </div>
      </div>
    </div>
  );
}
