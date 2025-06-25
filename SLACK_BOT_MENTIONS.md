# Slack Bot Mentions

This document explains how to set up and use the Slack bot mention functionality for creating access requests.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_DEFAULT_CHANNEL=#your-default-channel
```

### 2. Slack App Configuration

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app or select your existing app
3. Under "OAuth & Permissions", add the following bot token scopes:
   - `app_mentions:read`
   - `channels:history`
   - `chat:write`
   - `im:history`
   - `im:read`
   - `users:read`
   - `users:read.email`

4. Under "Event Subscriptions":
   - Enable events
   - Set the request URL to: `https://your-domain.com/slack-events/events`
   - Subscribe to bot events:
     - `app_mention` - When someone mentions your bot
     - `message.im` - When someone sends a direct message to your bot

5. Install the app to your workspace

### 3. User Setup

**Important**: Users must be pre-created in the system before they can use the bot. The bot will only work with existing users who have a `slackId` field set in their user record.

To create a user, you can use the database directly or create an admin endpoint. Each user should have:
- `id`: A unique identifier
- `slackId`: Their Slack user ID (e.g., "U123456789")
- `email`: Their email address
- `username`: Their username

### 4. URL Verification

When you first set up the event subscription, Slack will send a URL verification challenge. The endpoint automatically handles this and responds with the challenge string.

## Usage

### Bot Mentions

Users can mention the bot in any channel where it's present:

```
@cloud-gatekeeper I need read access to the analytics S3 bucket for data analysis
```

### Direct Messages

Users can also send direct messages to the bot:

```
I need write access to the production database for deployment purposes
```

## How It Works

1. When someone mentions the bot or sends a direct message, Slack sends an event to `/slack-events/events`
2. The system extracts the user's Slack ID and message content
3. It looks up the user by Slack ID in the database
4. If the user exists, it creates an access request with the message content
5. It sends a confirmation message back to the user
6. The access request follows the normal approval workflow
7. If the user doesn't exist, it sends an error message asking them to contact an administrator

## API Endpoints

### POST /slack-events/events

Handles Slack events including:
- URL verification challenges
- Bot mentions (`app_mention` events)
- Direct messages (`message.im` events)

## Example Request

When a user mentions the bot with:
```
@cloud-gatekeeper I need read access to the cloud-gatekeeper S3 bucket for data analysis and reporting purposes
```

The system will:
1. Extract the Slack ID and message
2. Look up the user by Slack ID
3. If found, create an access request with the message
4. Send a confirmation back to the user
5. If not found, send an error message

## Error Handling

- If the bot can't get user information from Slack, it will log an error and respond with an error message
- If the user doesn't exist in the system, it will send a message asking them to contact an administrator
- If creating the access request fails, it will notify the user and log the error
- All errors are logged for debugging purposes

## Security

- The endpoint is marked as `@Public()` since Slack needs to access it
- Slack signing verification should be implemented for production use
- Consider rate limiting for the events endpoint
- Only pre-created users can use the bot functionality 