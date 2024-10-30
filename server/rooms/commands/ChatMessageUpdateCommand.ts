import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { IOfficeState } from '../../../types/IOfficeState'
import { ChatMessage } from '../schema/OfficeState'
import sanitizeHtml from 'sanitize-html'

type Payload = {
  client: Client
  content: string
}

export default class ChatMessageUpdateCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, content } = data
    const player = this.room.state.players.get(client.sessionId)
    const chatMessages = this.room.state.chatMessages

    if (!player || !chatMessages) return

    const MAX_MESSAGE_LENGTH = 500
    const MIN_TIME_BETWEEN_MESSAGES = 1000 // milliseconds

    // Rate limiting
    if (!player.lastMessageTime) player.lastMessageTime = 0
    const now = Date.now()
    if (now - player.lastMessageTime < MIN_TIME_BETWEEN_MESSAGES) {
      return // Optionally, send a warning to the client
    }
    player.lastMessageTime = now

    // Validate and sanitize content
    const trimmedContent = content.trim()
    if (
      typeof content !== 'string' ||
      trimmedContent.length === 0 ||
      trimmedContent.length > MAX_MESSAGE_LENGTH
    ) {
      return // Optionally, send an error message to the client
    }

    const sanitizedContent = sanitizeHtml(trimmedContent, {
      allowedTags: [],
      allowedAttributes: {},
    })

    // Enforce message limit
    if (chatMessages.length >= 100) chatMessages.shift()

    const newMessage = new ChatMessage()
    newMessage.author = player.name
    newMessage.content = sanitizedContent
    chatMessages.push(newMessage)
  }
}
