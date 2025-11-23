export interface ChatMessage {
  timestamp: Date;
  sender: string;
  message: string;
  rawLine: string;
}

// Multiple date format patterns for WhatsApp exports
const DATE_PATTERNS = [
  // [DD/MM/YYYY, HH:MM:SS] Sender: Message
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\]\s*([^:]+?):\s*(.*)$/,
  // DD/MM/YYYY, HH:MM - Sender: Message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\s*[-–]\s*([^:]+?):\s*(.*)$/,
  // MM/DD/YY, HH:MM AM/PM - Sender: Message (US format)
  /^(\d{1,2}\/\d{1,2}\/\d{2}),?\s+(\d{1,2}:\d{2}(?:\s?[APap][Mm]))\s*[-–]\s*([^:]+?):\s*(.*)$/,
];

function parseTimestamp(dateStr: string, timeStr: string): Date {
  // Handle various date formats
  const dateParts = dateStr.split('/');
  let day: number, month: number, year: number;

  if (dateParts.length === 3) {
    // Try DD/MM/YYYY or MM/DD/YY format
    if (parseInt(dateParts[0]) > 12) {
      // DD/MM/YYYY format
      day = parseInt(dateParts[0]);
      month = parseInt(dateParts[1]) - 1;
      year = parseInt(dateParts[2]);
    } else if (parseInt(dateParts[1]) > 12) {
      // MM/DD/YYYY format
      month = parseInt(dateParts[0]) - 1;
      day = parseInt(dateParts[1]);
      year = parseInt(dateParts[2]);
    } else {
      // Ambiguous, default to DD/MM/YYYY
      day = parseInt(dateParts[0]);
      month = parseInt(dateParts[1]) - 1;
      year = parseInt(dateParts[2]);
    }

    // Handle 2-digit years
    if (year < 100) {
      year += 2000;
    }
  } else {
    return new Date();
  }

  // Parse time
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?([APap][Mm]))?/);
  if (!timeMatch) return new Date(year, month, day);

  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
  const meridiem = timeMatch[4]?.toUpperCase();

  // Convert to 24-hour format if AM/PM is present
  if (meridiem) {
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  return new Date(year, month, day, hours, minutes, seconds);
}

export function parseWhatsAppChat(fileContent: string): ChatMessage[] {
  const lines = fileContent.split('\n');
  const messages: ChatMessage[] = [];
  let currentMessage: ChatMessage | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    let matched = false;

    // Try each date pattern
    for (const pattern of DATE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }

        const [, dateStr, timeStr, sender, message] = match;
        currentMessage = {
          timestamp: parseTimestamp(dateStr, timeStr),
          sender: sender.trim(),
          message: message.trim(),
          rawLine: line,
        };
        matched = true;
        break;
      }
    }

    // If no pattern matched, this is a continuation of the previous message
    if (!matched && currentMessage) {
      currentMessage.message += '\n' + line.trim();
      currentMessage.rawLine += '\n' + line;
    }
  }

  // Add the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

export function filterMessagesByDateRange(
  messages: ChatMessage[],
  startDate?: Date,
  endDate?: Date
): ChatMessage[] {
  if (!startDate && !endDate) return messages;

  return messages.filter((msg) => {
    const msgDate = msg.timestamp;
    if (startDate && msgDate < startDate) return false;
    if (endDate) {
      // Set end date to end of day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (msgDate > endOfDay) return false;
    }
    return true;
  });
}

export function formatChatForAnalysis(messages: ChatMessage[]): string {
  return messages
    .map((msg) => {
      const date = msg.timestamp.toLocaleDateString();
      const time = msg.timestamp.toLocaleTimeString();
      return `[${date} ${time}] ${msg.sender}: ${msg.message}`;
    })
    .join('\n');
}
