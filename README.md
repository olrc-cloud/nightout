# Night Out

Night Out is a voice-based speaking task for Novice Mid/High English learners. The learner phones three AI friends (Maya, Tom and Priya), finds the one weekend plan that works for everyone, and confirms it in a group text. Calls are listening and speaking only, with no captions. Learners download a full transcript to send to their instructor.

## Files

| Path | What it is |
|---|---|
| `public/index.html` | The activity page |
| `netlify/functions/chat.mjs` | Server function: holds the prompts and calls the Claude API |
| `netlify.toml` | Tells Netlify where the page and function are |

## Deploy on Netlify

1. Put these files in a GitHub repository, keeping the folders as they are.
2. In Netlify, choose **Add new site → Import an existing project**, pick the repository, and deploy. No build command is needed.
3. Choose how the friends reach Claude:
   - **Easiest: Netlify's AI Gateway.** Turn on AI for the project in Netlify. Netlify then supplies the Claude connection itself and bills usage to your Netlify credits, so you don't need an Anthropic key. Don't add an `ANTHROPIC_API_KEY` variable in this case.
   - **Your own Anthropic key.** Create a key at console.anthropic.com and set a monthly spending limit there. Then go to **Project configuration → Environment variables** and add `ANTHROPIC_API_KEY` with the key as its value (Functions scope).
4. Optional environment variables:
   - `CLASS_CODE`: students must type this code before the friends will answer.
   - `CLAUDE_MODEL`: defaults to `claude-haiku-5-5`, falling back to `claude-haiku-4-5`.
5. After any change to environment variables, go to **Deploys → Trigger deploy → Deploy site**.

Netlify Drop (drag and drop) does not deploy the server function. Use a Git import or the Netlify command-line tool.

## Browser support

- **Microphone (speech recognition):** Chrome and Edge, and Safari with less reliable results. Firefox has no microphone support, so students there type instead.
- **Friends' voices:** these use the voices built into the student's device and browser. The page picks a female-sounding voice for Maya and Priya and a male-sounding one for Tom. If the device has no voice of the right gender, it changes the pitch of the default voice instead.
- The page must be served over HTTPS, which Netlify does automatically.

## Editing the activity

The three options, friend names and genders appear in both `public/index.html` and `netlify/functions/chat.mjs`. Change both files together.
