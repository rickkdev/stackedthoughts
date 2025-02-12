require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize bot with polling for development
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Store impact scores in memory
let impactScores = {};

// Initialize pending scores object
const pendingScores = {};

// Fetch impact scores
async function fetchImpactScores() {
  try {
    const { data, error } = await supabase
      .from("dopamine_impact_scores")
      .select("*");

    if (error) throw error;

    const scoresMap = {};
    data.forEach((score) => {
      scoresMap[score.category] = score.impact_score;
    });
    impactScores = scoresMap;
  } catch (error) {
    console.error("Error fetching impact scores:", error);
  }
}

async function handleTaskSubmit(chatId, content, categories) {
  const { error } = await supabase.from("todos").insert([
    {
      text: content,
      categories,
      is_completed: false,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;
  bot.sendMessage(chatId, "✅ Task added successfully!");
}

async function handleDopamineSubmit(chatId, content, categories) {
  // Check for new categories
  const newCategories = categories.filter(
    (tag) => !impactScores.hasOwnProperty(tag)
  );

  if (newCategories.length > 0) {
    // Handle new category score input
    await requestImpactScore(chatId, newCategories[0], content, categories);
    return;
  }

  const { error } = await supabase.from("dopamine_logs").insert([
    {
      activity: content,
      categories,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) throw error;
  bot.sendMessage(chatId, "✅ Dopamine log added successfully!");
}

// Handle impact score for new categories
async function requestImpactScore(chatId, category, content, categories) {
  bot.sendMessage(
    chatId,
    `New category detected: #${category}\nPlease rate the dopamine impact (0-10):`,
    {
      reply_markup: {
        force_reply: true,
        selective: true,
      },
    }
  );

  // Store the context for later use
  pendingScores[chatId] = {
    category,
    content,
    categories,
  };
}

// Handle incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  if (!text.startsWith("/task") && !text.startsWith("/dopamine")) {
    bot.sendMessage(
      chatId,
      "Please start your message with /task or /dopamine"
    );
    return;
  }

  const command = text.split(" ")[0];
  const content = text.slice(command.length).trim();

  if (!content) {
    bot.sendMessage(chatId, "Please provide content after the command");
    return;
  }

  try {
    const hashtags = content.match(/#[\w-]+/g) || [];
    const categories = hashtags.map((tag) => tag.slice(1));

    if (command === "/task") {
      await handleTaskSubmit(chatId, content, categories);
    } else if (command === "/dopamine") {
      await handleDopamineSubmit(chatId, content, categories);
    }
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// Handle score replies
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const pendingScore = pendingScores[chatId];

  if (!pendingScore) return;

  const score = parseInt(msg.text);
  if (isNaN(score) || score < 0 || score > 10) {
    bot.sendMessage(chatId, "Please provide a valid score between 0 and 10");
    return;
  }

  try {
    // Save the impact score
    await supabase.from("dopamine_impact_scores").insert([
      {
        category: pendingScore.category,
        impact_score: score,
      },
    ]);

    // Update local impact scores
    await fetchImpactScores();

    // Submit the original dopamine log
    await handleDopamineSubmit(
      chatId,
      pendingScore.content,
      pendingScore.categories
    );

    // Clear pending score
    delete pendingScores[chatId];
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// Initial fetch of impact scores
fetchImpactScores();

console.log("Bot is running in development mode...");
