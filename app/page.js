import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Feed from "./components/Feed";

// This component is a Server Component by default (no 'use client' directive)
export default async function Home() {
  // Create a Supabase client that works on the server side
  // Using cookies to maintain authentication state
  const supabase = createServerComponentClient({ cookies });

  // Fetch todos and logs in parallel from Supabase
  // This happens on the server at request time
  const { data: todos = [], error: todosError } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: logs = [], error: logsError } = await supabase
    .from("dopamine_logs")
    .select("*")
    .order("created_at", { ascending: false });

  // Handle any potential errors during data fetching
  if (todosError || logsError) {
    console.error("Error fetching data:", { todosError, logsError });
    return <div>Error loading data</div>;
  }

  // Process and combine both todos and logs into a single array
  const initialItems = [...(todos || []), ...(logs || [])]
    // Remove any items without created_at dates
    .filter((item) => item && item.created_at)
    // Standardize the date format for each item
    .map((item) => ({
      ...item,
      created_at: item.created_at
        ? new Date(item.created_at).toISOString()
        : null,
    }))
    // Sort items by date, newest first
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Pass the processed data to the Feed component
  // This data will be available immediately on page load
  return (
    <div className="fixed flex justify-center items-center inset-0 bg-customGray">
      <div className="h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-row justify-center p-6 space-x-6">
            <Feed initialItems={initialItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
