import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService, ChatMessage } from '../../services/ai-chat.service';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewChecked {
    @ViewChild('chatHistory') private chatContainer!: ElementRef;

    messages: ChatMessage[] = [
        {
            text: "Bonjour ! Je suis votre assistant parental virtuel. Comment puis-je vous aider aujourd'hui ?",
            sender: 'ai',
            timestamp: new Date()
        }
    ];
    userMessage = "";
    isTyping = false;

    constructor(private aiChatService: AiChatService) { }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    scrollToBottom(): void {
        try {
            this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    sendMessage(): void {
        if (!this.userMessage || this.userMessage.trim() === '') {
            return;
        }

        const messageText = this.userMessage;

        // Add user message
        this.messages.push({
            text: messageText,
            sender: 'user',
            timestamp: new Date()
        });

        this.userMessage = "";
        this.isTyping = true;

        // Call service
        this.aiChatService.sendMessage(messageText).subscribe({
            next: (response) => {
                this.messages.push(response);
                this.isTyping = false;
            },
            error: (err) => {
                console.error("Erreur chat:", err);
                this.isTyping = false;
            }
        });
    }
}
