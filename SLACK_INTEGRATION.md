# Slack Integration Setup

This document explains how to set up and use the Slack integration in the Cloud Gatekeeper application.

## Prerequisites

1. A Slack workspace where you have admin permissions
2. A Slack app with bot token permissions

## Setup Instructions

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Give your app a name (e.g., "Cloud Gatekeeper")
4. Select your workspace

### 2. Configure Bot Token Scopes

In your Slack app settings, go to "OAuth & Permissions" and add these scopes:

**Bot Token Scopes:**
- `chat:write` - Send messages to channels
- `chat:write.public` - Send messages to public channels
- `users:read` - Read user information (optional, for user lookups)

### 3. Install the App

1. Go to "Install App" in your Slack app settings
2. Click "Install to Workspace"
3. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 4. Environment Variables

Add these environment variables to your `.env` file:

```bash
# Slack Configuration
SLACK_BOT_TOKEN="xoxb-your-bot-token-here"
SLACK_DEFAULT_CHANNEL="#your-default-channel"
```

### 5. Invite Bot to Channels

Invite your bot to the channels where you want it to send notifications:

```
/invite @your-bot-name
```

## Usage

The Slack integration automatically sends notifications for:

### Access Request Created
When a new access request is submitted, a notification is sent to the default channel:

```
🆕 New access request created!

*Project:* analytics-prod
*Requested by:* user@example.com
*Requested at:* 1/1/2024, 12:00:00 PM
*Status:* Pending approval
```

### Access Request Approved
When an access request is approved, a notification is sent to the requester:

```
Your access request for project "analytics-prod" has been ✅ APPROVED by admin@example.com
```

### Access Request Rejected
When an access request is rejected, a notification is sent to the requester:

```
Your access request for project "analytics-prod" has been ❌ REJECTED by admin@example.com
Reason: Insufficient justification
```

## API Methods

### Basic Message Sending

```typescript
// Send a simple message
await slackService.sendMessage({
  channel: '#general',
  message: 'Hello from Cloud Gatekeeper!'
})

// Send a message in a thread
await slackService.sendMessage({
  channel: '#general',
  message: 'This is a reply',
  threadTs: '1234567890.123456'
})
```

### Access Request Notifications

```typescript
// Send access request created notification
await slackService.sendAccessRequestCreatedNotification(accessRequest)

// Send approval notification
await slackService.sendAccessRequestApprovedNotification(accessRequest, approver)

// Send rejection notification
await slackService.sendAccessRequestRejectedNotification(accessRequest, approver, reason)
```

## Error Handling

The Slack service includes comprehensive error handling:

- API errors are logged and re-thrown
- Network timeouts are handled gracefully
- Invalid channel names are caught and reported
- Authentication errors are clearly identified

## Testing

Run the Slack service tests:

```bash
pnpm test src/infra/services/slack/slack.service.spec.ts
```

## Troubleshooting

### Common Issues

1. **"channel_not_found" error**
   - Make sure the bot is invited to the channel
   - Verify the channel name is correct (include the #)

2. **"not_in_channel" error**
   - The bot needs to be invited to the channel first

3. **"invalid_auth" error**
   - Check that your `SLACK_BOT_TOKEN` is correct
   - Ensure the bot token hasn't been revoked

4. **"missing_scope" error**
   - Add the required scopes in your Slack app settings

### Debug Mode

Enable debug logging by setting the log level in your application configuration.

## Security Considerations

- Never commit your Slack bot token to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your bot tokens
- Limit bot permissions to only what's necessary
- Monitor bot activity for unusual patterns 