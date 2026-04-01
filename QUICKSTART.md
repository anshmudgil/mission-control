# Mission Control — Quick Start Guide

**Status:** ✅ LIVE at http://localhost:3000

## Start the Dashboard (30 seconds)

```bash
cd ~/Desktop/mission-control-main
npm run dev
```

Then open: **http://localhost:3000**

## What You're Looking At

### Left Sidebar
Navigate between views:
- **Task Board** — Kanban (Backlog → In Progress → In Review → Done)
- **Inbox** — Messages + notifications
- **Calendar** — Events & deadlines
- **Projects** — Deals pipeline ($85K)
- **Memories** — Knowledge base
- **Docs** — System documentation
- **Team** — Agent roster + status
- **Office** — Workspace config
- **Marketing** — Content pipeline
- **Pipeline** — Workflow stages

### Main Content Area
Currently shows **Task Board** with:
- **5 VelocityOS tasks** loaded from `/data/tasks.json`
- **Drag-and-drop** between columns
- **Real-time updates** every 5 seconds

### Right Sidebar
**Live Activity Feed** shows:
- Agent actions (task created, moved, completed)
- Timestamp
- Auto-updates when anything changes

## Create a Task (1 minute)

1. Click **"New Task"** button (top right, gold)
2. Fill in:
   - **Title:** E.g., "Fix Redis nonce store"
   - **Description:** E.g., "Security issue in OAuth flow"
   - **Assignee:** Choose "sameer" or "jarvis"
3. Click **"Create"**
4. Task lands in **Backlog**
5. Activity feed logs: "sameer created 'Fix Redis nonce store'"

## Move a Task

1. Find a task card
2. Click **"Move to [next-stage]"** button
3. Task moves to new column
4. Activity feed logs the move with timestamp

## View Other Pages

- **Projects:** Shows deal pipeline, client names, amounts, due dates
- **Team:** Shows agent roster with status indicators
- **Inbox:** (placeholder, ready to integrate Telegram/Discord)
- **Calendar:** (placeholder, ready to integrate Google Calendar)

## Data Location

All data lives in JSON files (readable, editable):

```
~/Desktop/mission-control-main/data/
├── tasks.json         ← Kanban tasks
├── activity.jsonl     ← Activity log (line-delimited)
├── projects.json      ← Deals
├── team.json          ← Agents
├── cron-jobs.json     ← Scheduled tasks
├── inbox/emails.json  ← Messages
└── ...
```

You can edit these files directly (e.g., edit tasks.json to change task names).

## Deploy to Vercel

When ready:

```bash
vercel login
cd ~/Desktop/mission-control-main
vercel --prod --yes
```

Will deploy to live URL like: `https://mission-control-[hash].vercel.app`

## Troubleshooting

**Port 3000 already in use?**
```bash
lsof -i :3000
kill -9 <PID>
npm run dev
```

**Changes not showing?**
The app polls every 5 seconds. Wait a moment or refresh browser (Cmd+R).

**Want to reset data?**
Edit `/data/tasks.json` directly or delete entries.

---

**👉 Next:** Read `/Users/anshmudgil/.openclaw/workspace/MISSION_CONTROL_SETUP_STATUS.md` for full setup details and integration roadmap.
