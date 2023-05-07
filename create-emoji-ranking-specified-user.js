const { WebClient } = require('@slack/web-api');

const token = "User OAuth Token"; // Set User OAuth Token here
const web = new WebClient(token);

const startDate = new Date('2023-01-01T00:00:00.000Z');
const endDate = new Date('2023-04-30T23:59:59.000Z');
const targetUserId = 'USERID'; // Set the target user's ID here

(async () => {
  try {
    let cursor;
    const channels = [];

    // Fetch all channels with pagination
    do {
      const channelsResponse = await web.conversations.list({
        cursor: cursor,
      });
      channels.push(...channelsResponse.channels);
      cursor = channelsResponse.response_metadata.next_cursor;
    } while (cursor);

    const emojiCount = {};

    for (const channel of channels) {
      console.log(`Processing channel: ${channel.name}`);
      let latest = endDate.toISOString();
      let hasMore = true;

      while (hasMore) {
        const messagesResponse = await web.conversations.history({
          channel: channel.id,
          latest: latest,
          inclusive: false,
          limit: 200,
        });

        for (const message of messagesResponse.messages) {
          const messageTimestamp = new Date(message.ts * 1000);
          if (messageTimestamp < startDate) {
            hasMore = false;
            break;
          }

          // Check if the message is from the target user
          if (message.user === targetUserId) {
            // Count emojis in message text
            const emojiMatches = message.text.match(/:[a-zA-Z0-9_+-]+:/g) || [];
            for (const emoji of emojiMatches) {
              if (!emojiCount[emoji]) {
                emojiCount[emoji] = 0;
              }
              emojiCount[emoji]++;
            }
          }
        }

        if (messagesResponse.has_more) {
          latest = messagesResponse.messages[messagesResponse.messages.length - 1].ts;
        } else {
          hasMore = false;
        }
      }
    }

    const sortedEmoji = Object.entries(emojiCount).sort(([, count1], [, count2]) => count2 - count1);
    console.log('Emoji ranking for target user:');
    let i =1
    for (const [emoji, count] of sortedEmoji) {
      console.log(`第${i}位 => ${emoji}: ${count}回`);
      i++;
    }
  } catch (error) {
    console.error(error);
  }
})();
