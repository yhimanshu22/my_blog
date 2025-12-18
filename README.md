# Autonomous AI Blogging Platform

This is a fully automated blogging system powered by Next.js and Google Gemini.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Get a key from [Google AI Studio](https://aistudio.google.com/)*

## Manual Usage

- **Start the Server**:
  ```bash
  npm run dev
  ```
  Visit `http://localhost:3000`.

- **Generate a New Post**:
  ```bash
  npm run generate
  ```
  This will:
  1. Pick a unique topic based on your niche.
  2. Write a full blog post in Markdown.
  3. Save it to `content/posts`.
  4. Update `history.json`.

## "Fully Autonomous" Setup (Cron / Scheduler)

To make this run indefinitely without you, set up a recurring task.

### Windows (Task Scheduler)
Create a `.bat` file (e.g., `auto_blog.bat`):
```batch
cd C:\Users\91811\Desktop\blog
call npm run generate >> logs\automation.log 2>&1
```
Then use **Task Scheduler** to run this script daily.

### Linux / Mac (Cron)
Add to crontab (`crontab -e`):
```bash
0 9 * * * cd /path/to/blog && npm run generate >> logs/automation.log 2>&1
```

## Customization
Edit `site-config.ts` to change the Niche, Tone, or Target Audience.
