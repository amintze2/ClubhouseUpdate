import { convertToModelMessages, streamText, UIMessage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a setup assistant helping a baseball clubhouse manager build their recurring task schedule.

Your goal is to learn their daily routine through natural conversation, then generate a structured task list.

## How to conduct the conversation

Open with: "Let's build your task schedule. Walk me through a typical game day — from when you arrive to when you leave, what do you do?"

Then ask about:
- Off days / non-game days (what still needs to happen?)
- Any responsibilities they haven't mentioned yet

Guidelines:
- Keep it conversational and warm, not clinical
- Ask open-ended questions, not checklists
- One or two follow-up questions per turn — don't interrogate
- If they mention something briefly, ask them to elaborate
- Aim to wrap up in 3–5 turns total
- Once you have enough to build a solid schedule, call finalize_setup

## Task schema reference (for finalize_setup)

Categories: sanitation | laundry | food | equipment | field | admin | medical | general
Visibility: game_day | off_day | all
Game day periods (only when visibility is "game_day"): morning | pre_game | post_game

Typical mappings:
- "I clean up after the game" → post_game, sanitation or laundry
- "Set up before BP" → morning, field or equipment
- "Pre-game snacks" → pre_game, food
- "Start laundry after the game" → post_game, laundry
- "Fold and put out uniforms" → morning, laundry
- "Deep clean on off days" → off_day, sanitation
- "Restock supplies" → off_day, general or admin
- "Check first aid" → off_day, medical
- "Review the day's schedule" → all, admin

Use "all" visibility for tasks that happen regardless of game schedule.
Use default_time in HH:MM (24h) format based on context clues (e.g. "after the game" → 22:00, "first thing in the morning" → 08:00). Null if unknown.

Always generate at least 8 tasks. Fill in sensible baseball clubhouse defaults for anything the manager didn't mention — every clubhouse needs sanitation, laundry, and admin tasks.`;

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { messages: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = streamText({
    model: openrouter("google/gemini-2.0-flash-001"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(body.messages),
    tools: {
      finalize_setup: {
        description:
          "Call this when you have enough information to generate the manager's recurring task schedule. Produces a structured list of tasks.",
        inputSchema: z.object({
          recurring_tasks: z
            .array(
              z.object({
                title: z.string().describe("Short task title"),
                description: z.string().nullable().describe("Optional detail"),
                category: z.enum([
                  "sanitation",
                  "laundry",
                  "food",
                  "equipment",
                  "field",
                  "admin",
                  "medical",
                  "general",
                ]),
                visibility: z.enum(["game_day", "off_day", "all"]),
                game_day_period: z
                  .enum(["morning", "pre_game", "post_game"])
                  .nullish()
                  .describe("Required when visibility is game_day, otherwise null"),
                default_time: z
                  .string()
                  .nullable()
                  .describe("HH:MM in 24h format, or null"),
              })
            )
            .describe("The full recurring task schedule"),
        }),
      },
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      if (error instanceof Error) return error.message;
      return "An error occurred";
    },
  });
}
