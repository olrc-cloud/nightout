# Night Out

Night Out is a voice-based speaking task for Novice Mid/High English learners. The learner phones three AI friends (Maya, Jon and Priya), finds the one weekend plan that works for everyone, and confirms it in a group text. Calls are listening and speaking only, with no captions. Learners download a full transcript to send to their instructor.

## Files

| Path | What it is |
|---|---|
| `public/index.html` | The activity page |
| `netlify/functions/chat.mjs` | Server function: holds the prompts and calls the Claude API |
| `netlify.toml` | Tells Netlify where the page and function are |

## Deploy on Netlify

1. Put these files in a GitHub repository, keeping the folders as they are.
2. In Netlify, choose **Add new site → Import an existing project**, pick the repository, and deploy. No build command is needed.
3. Create an API key at console.anthropic.com. Set a monthly spending limit there.
4. In Netlify, go to **Site configuration → Environment variables** and add:
   - `ANTHROPIC_API_KEY`: your key (required)
   - `CLASS_CODE`: optional. If you set it, students must type this code before the friends will answer, which keeps strangers from using your key.
   - `CLAUDE_MODEL`: optional, defaults to `claude-haiku-5-5`
5. Go to **Deploys → Trigger deploy → Deploy site** so the new settings take effect.

Netlify Drop (drag and drop) does not deploy the server function. Use a Git import or the Netlify command-line tool.

## Browser support

- **Microphone (speech recognition):** Chrome and Edge, and Safari with less reliable results. Firefox has no microphone support, so students there type instead.
- **Friends' voices:** these use the voices built into the student's device and browser. The page picks a female-sounding voice for Maya and Priya and a male-sounding one for Jon. If the device has no voice of the right gender, it changes the pitch of the default voice instead.
- The page must be served over HTTPS, which Netlify does automatically.

## Editing the activity

The three options, friend names and genders appear in both `public/index.html` and `netlify/functions/chat.mjs`. Change both files together.
