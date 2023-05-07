const { WebClient } = require('@slack/web-api');

const token = "User OAuth Token"; // Set User OAuth Token here
const web = new WebClient(token);

const startDate = new Date('2023-01-01T00:00:00.000Z');
const endDate = new Date('2023-04-30T23:59:59.000Z');

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

    const reactionCount = {};

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

          // Count reactions
          if (message.reactions) {
            for (const reaction of message.reactions) {
              const emoji = `:${reaction.name}:`;
              if (!reactionCount[emoji]) {
                reactionCount[emoji] = 0;
              }
              reactionCount[emoji] += reaction.count;
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

    const sortedReactions = Object.entries(reactionCount).sort(([, count1], [, count2]) => count2 - count1);
    console.log('Reaction ranking:');
    let i =1
    for (const [emoji, count] of sortedReactions) {
      console.log(`第${i}位 => ${emoji}: ${count}回`);
      i++;

    }
  } catch (error) {
    console.error(error);
  }
})();
