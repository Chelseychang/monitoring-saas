import { pushLark, previewLark } from './api.js';

export async function sendLarkPush(item) {
  return pushLark(item);
}

export async function getLarkPreview(item) {
  return previewLark(item);
}