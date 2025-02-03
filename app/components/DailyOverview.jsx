import { useMemo } from "react";
import {
  eachDayOfInterval,
  subYears,
  format,
  getDay,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const getColorForContributions = (count) => {
  if (count === 0) return "bg-zinc-900";
  if (count === 1) return "bg-[#533AED40]";
  if (count === 2) return "bg-[#533AED60]";
  if (count === 3) return "bg-[#533AED80]";
  if (count === 4) return "bg-[#533AEDA0]";
  return "bg-[#533AED]";
};

export default function DailyOverview({ todos }) {
  // Generate dates for the last year
  const dates = useMemo(() => {
    const today = new Date();
    const end = endOfYear(today);
    const start = startOfYear(today);

    // Get the start and end of weeks to ensure full weeks
    const startDate = startOfWeek(start);
    const endDate = endOfWeek(end);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, []);

  // Count completed todos for each day
  const completionsByDate = useMemo(() => {
    const counts = {};
    todos
      .filter((todo) => todo.completed_at)
      .forEach((todo) => {
        const dateStr = format(new Date(todo.completed_at), "yyyy-MM-dd");
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      });
    return counts;
  }, [todos]);

  // Calculate the number of weeks
  const numberOfWeeks = Math.ceil(dates.length / 7);

  return (
    <div className="p-6 bg-zinc-950 rounded-lg shadow-md w-[900px]">
      <h2 className="text-xl font-semibold mb-4 text-white">2025 Overview</h2>
      <div className="relative">
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          {months.map((month) => (
            <div key={month} className="w-[calc(100%/12)] text-center">
              {month}
            </div>
          ))}
        </div>
        <div
          className={`grid grid-cols-${numberOfWeeks} gap-1`}
          style={{ gridTemplateColumns: `repeat(${numberOfWeeks}, 1fr)` }}
        >
          <TooltipProvider>
            {dates.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const count = completionsByDate[dateStr] || 0;
              const dayOfWeek = getDay(date);

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <div
                      style={{ gridRow: dayOfWeek + 1 }}
                      className={`w-3 h-3 rounded-sm ${getColorForContributions(
                        Math.min(count, 5)
                      )}`}
                      aria-label={`${count} tasks on ${format(
                        date,
                        "MMM d, yyyy"
                      )}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">
                      {count} tasks on {format(date, "MMM d, yyyy")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end text-sm text-zinc-400">
        <span className="mr-2">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-zinc-900 rounded-sm" />
          <div className="w-3 h-3 bg-[#533AED40] rounded-sm" />
          <div className="w-3 h-3 bg-[#533AED60] rounded-sm" />
          <div className="w-3 h-3 bg-[#533AED80] rounded-sm" />
          <div className="w-3 h-3 bg-[#533AEDA0] rounded-sm" />
          <div className="w-3 h-3 bg-[#533AED] rounded-sm" />
        </div>
        <span className="ml-2">More</span>
      </div>
    </div>
  );
}
