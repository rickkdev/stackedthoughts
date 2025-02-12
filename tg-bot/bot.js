require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");

// Check environment variables
const requiredEnvVars = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
};

Object.entries(requiredEnvVars).forEach(([name, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Add this after Supabase initialization to test connection
console.log("Testing Supabase connection...");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY exists:", !!process.env.SUPABASE_ANON_KEY);

supabase
  .from("todos")
  .select("*", { count: "exact" })
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error("❌ Supabase connection test failed:", error);
    } else {
      console.log(
        "✅ Supabase connection test successful, found",
        data.length,
        "rows"
      );
    }
  });

// Initialize bot with polling disabled for webhook mode
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Set webhook URL (add this after bot initialization)
const webhookUrl = process.env.WEBHOOK_URL;
bot.setWebHook(webhookUrl);

// Store impact scores in memory
let impactScores = {};

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

// Handle incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

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

async function handleTaskSubmit(chatId, content, categories) {
  console.log("📝 Starting handleTaskSubmit with:", {
    chatId,
    content,
    categories,
  });

  const taskData = {
    text: content,
    categories,
    is_completed: false,
    created_at: new Date().toISOString(),
  };

  console.log("Attempting to insert task:", taskData);

  try {
    const { data, error } = await supabase
      .from("todos")
      .insert([taskData])
      .select();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      throw error;
    }

    console.log("✅ Task inserted successfully:", data);

    // Emit an event to signal message processing is complete
    bot.emit("message_processed");

    await bot.sendMessage(chatId, "✅ Task added successfully!");
  } catch (error) {
    console.error("❌ Error in handleTaskSubmit:", error);
    throw error;
  }
}

async function handleDopamineSubmit(chatId, content, categories) {
  console.log("Starting handleDopamineSubmit:", {
    chatId,
    content,
    categories,
  });

  try {
    const { data, error } = await supabase
      .from("dopamine_logs")
      .insert([
        {
          activity: content,
          categories,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("❌ Dopamine log insert error:", error);
      throw error;
    }

    console.log("✅ Dopamine log inserted successfully:", data);

    try {
      await bot.sendMessage(chatId, "✅ Dopamine log added successfully!");
    } catch (telegramError) {
      console.warn(
        "⚠️ Could not send Telegram message:",
        telegramError.message
      );
    }

    return data;
  } catch (error) {
    console.error("❌ Error in handleDopamineSubmit:", error);
    throw error;
  }
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

// Initialize pending scores object
const pendingScores = {};

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

// Modify the webhook handler
const webhookHandler = async (event) => {
  try {
    console.log("Event received:", JSON.stringify(event, null, 2));
    const body = JSON.parse(event.body);
    console.log("Parsed body:", JSON.stringify(body, null, 2));

    const message = body.message;
    if (message && message.text) {
      try {
        const text = message.text;
        const chatId = message.chat.id;

        // Extract hashtags
        const hashtags = text.match(/#[\w-]+/g) || [];
        const categories = hashtags.map((tag) => tag.slice(1));

        if (text.startsWith("/task")) {
          const taskContent = text.slice(6).trim(); // Remove "/task "
          console.log("Processing task:", { chatId, taskContent, categories });
          await handleTaskSubmit(chatId, taskContent, categories);
        } else if (text.startsWith("/dopamine")) {
          const dopamineContent = text.slice(9).trim(); // Remove "/dopamine "
          console.log("Processing dopamine log:", {
            chatId,
            dopamineContent,
            categories,
          });
          await handleDopamineSubmit(chatId, dopamineContent, categories);
        }

        console.log("✅ Message processing completed");
      } catch (error) {
        console.error("❌ Error processing message:", error);
        throw error;
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Success" }),
    };
  } catch (error) {
    console.error("❌ Error in webhook handler:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Export both the bot and webhookHandler
module.exports = {
  bot,
  webhookHandler,
};
