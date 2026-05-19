const seenMessages = new Set();

export function hasSeenMessage(messageId) {
  return seenMessages.has(messageId);
}

export function markMessageSeen(messageId) {
  seenMessages.add(messageId);
}

export function getSeenCount() {
  return seenMessages.size;
}