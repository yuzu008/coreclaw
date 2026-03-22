import { NewMessage, Channel } from './types.js';

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatMessages(messages: NewMessage[], timezone: string): string {
  const now = new Date().toLocaleString('en-US', { timeZone: timezone });
  const lines = [`<messages received_at="${escapeXml(now)}">`];

  for (const msg of messages) {
    const ts = new Date(msg.timestamp).toLocaleString('en-US', {
      timeZone: timezone,
    });
    const from = msg.is_from_me ? 'me' : escapeXml(msg.sender_name || msg.sender);
    lines.push(
      `  <message from="${from}" time="${escapeXml(ts)}">${escapeXml(msg.content)}</message>`,
    );
  }

  lines.push('</messages>');
  return lines.join('\n');
}

export function formatOutbound(rawText: string): string {
  return rawText
    .replace(/<internal>[\s\S]*?<\/internal>/g, '')
    .trim();
}

export function findChannel(channels: Channel[], jid: string): Channel | undefined {
  return channels.find((ch) => ch.ownsJid(jid));
}
