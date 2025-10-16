

import React, { FC, useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
// FIX: Changed import to be a relative path.
import { Project, User, WikiArticle, AccordionSection } from '../../types';
import { useWikiData } from '../../hooks/useWikiData';
import { useAppContext } from '../../contexts/AppContext';

interface AIChatProps {
    onClose: () => void;
    projects: Project[];
    users: User[];
}

interface AIChatMessage {
    role: 'user' | 'model';
    content: string;
}

const AIChat: FC<AIChatProps> = ({ onClose, projects, users }) => {
    const { setSuggestedAction } = useAppContext();
    const [messages, setMessages] = useState<AIChatMessage[]>([
        { role: 'model', content: 'Hallo! Ich bin Ihre AI-Assistenz. Stellen Sie mir eine Frage zu Ihren Projekten oder dem Firmen-Wiki.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    
    const { data: wikiData } = useWikiData();
    const wikiArticles = wikiData?.articles || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userInput: AIChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userInput]);
        setInput('');
        setIsLoading(true);

        try {
            // Create a rich context for the AI
            const wikiContext = wikiArticles.map(a => `ARTIKEL: ${a.title}\n${a.content}`).join('\n\n---\n\n');

            const projectsForContext = projects.map(p => {
                const techDocSummaries = (p.technicalDocuments || [])
                    .flatMap(f => f.files)
                    .map(file => file.aiSummary ? `Zusammenfassung für ${file.name}: ${file.aiSummary}` : '')
                    .filter(Boolean).join('\n');
                
                const fireDocSummaries = (p.fireProtectionDocs || [])
                    .flatMap(f => f.files)
                    .map(file => {
                        if (!file.analysisResult) return '';

                        const result: any = file.analysisResult;
                        const sections: AccordionSection[] = Array.isArray(result) ? result : (result.sections || []);

                        if (!Array.isArray(sections) || sections.length === 0) return '';
                        
                        return `Analyse von ${file.name}:\n` + sections.map(s => `* ${s.title}: ${s.content}`).join('\n');
                    })
                    .filter(Boolean).join('\n');

                return {
                    id: p.id,
                    name: p.name,
                    projectNumber: p.projectNumber,
                    status: p.status,
                    projectLeiter: (p.projectLeiterIds || []).map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', '),
                    memos: (p.memos || []).flatMap(folder => folder.memos).map(memo => `${memo.type}-Notiz: ${memo.content}`).join('\n'),
                    documentSummaries: `${techDocSummaries}\n${fireDocSummaries}`.trim()
                };
            });

            const projectContext = JSON.stringify(projectsForContext, null, 2);

            const fullPrompt = `PROJEKTDATEN:\n${projectContext}\n\nWISSENSDATENBANK (WIKI):\n${wikiContext}\n\nFRAGE DES BENUTZERS: "${userInput.content}"`;
            
            const systemInstruction = `Du bist ein KI-Assistent für die Projektmanagement-Software "HOAI Planer Pro". Deine Aufgabe ist es, Fragen zu den Projekten des Nutzers sowie zur internen Wissensdatenbank (Wiki) zu beantworten. Nutze die bereitgestellten Projektdaten und Wiki-Artikel im JSON-Format, um die Fragen zu beantworten. Antworte immer auf Deutsch, sei präzise und freundlich. Formatiere deine Antworten lesbar mit Markdown.

Wenn du eine Aktion vorschlagen kannst, die der Benutzer ausführen kann (z. B. einen Zeiteintrag erstellen), füge am Ende deiner Antwort einen speziellen JSON-Block ein. Das Format ist: ###ACTION###{ "action": "ACTION_TYPE", "payload": { ... } }###END_ACTION###.

Unterstützte Aktionen:
1.  **CREATE_TIME_ENTRY**: Erstellt einen neuen Zeiteintrag.
    - **Payload-Felder**: \`projectId\` (string), \`service_phase_id\` (number, 1-9), \`duration_hours\` (number), \`description\` (string).
    - Beispiel: Der Benutzer sagt "Buche 2 Stunden für die Planungssitzung für das Innovationshub in LP2". Du könntest vorschlagen: ###ACTION###{ "action": "CREATE_TIME_ENTRY", "payload": { "projectId": "p1", "service_phase_id": 2, "duration_hours": 2, "description": "Planungssitzung" } }###END_ACTION###.

Stelle sicher, dass alle erforderlichen Payload-Felder aus der Konversation abgeleitet werden können, bevor du eine Aktion vorschlägst. Die Projekt-IDs sind in den Projektdaten verfügbar.`;
            
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const result = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: { systemInstruction },
            });
            
            let currentResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of result) {
                currentResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.content = currentResponse.split('###ACTION###')[0];
                    }
                    return newMessages;
                });
            }

            // After stream ends, parse for action
            const actionRegex = /###ACTION###([\s\S]*?)###END_ACTION###/;
            const match = currentResponse.match(actionRegex);
            if (match && match[1]) {
                try {
                    const actionJson = JSON.parse(match[1]);
                    const payload = actionJson.payload;
                    let description = '';

                    if (actionJson.action === 'CREATE_TIME_ENTRY' && payload) {
                        const projectName = projects.find(p => p.id === payload.projectId)?.name || 'Unbekanntes Projekt';
                        description = `AI schlägt vor: Zeiteintrag für "${projectName}" erstellen (${payload.duration_hours}h für "${payload.description}").`;
                        
                        setSuggestedAction({
                            type: 'CREATE_TIME_ENTRY',
                            payload: payload,
                            description: description,
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse AI action", e);
                }
            }

        } catch (error) {
            console.error("AI chat error:", error);
            setMessages(prev => [...prev, { role: 'model', content: 'Entschuldigung, es ist ein Fehler aufgetreten. Die Anfrage war möglicherweise zu komplex oder die Daten konnten nicht verarbeitet werden.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-window print:hidden">
            <header className="chat-header">
                <h3 className="chat-header-title">
                    <span role="img" aria-label="robot">🤖</span>
                    AI Projekt-Assistenz
                </h3>
                <button onClick={onClose} className="chat-close-btn" aria-label="Chat schließen">&times;</button>
            </header>
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role === 'user' ? 'user' : 'other'}`}>
                         {msg.role === 'model' && <div className="avatar">🤖</div>}
                         <div className="message-content">
                            <div className="message-bubble prose prose-sm max-w-none">
                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                    {msg.content}
                                </div>
                            </div>
                         </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="message-wrapper other">
                        <div className="avatar">🤖</div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <footer className="chat-footer">
                <form onSubmit={handleSend} className="chat-input-form">
                    <textarea 
                        ref={textAreaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Frage zu Projekten oder Wiki stellen..." 
                        className="chat-input-textarea"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button type="submit" className="chat-send-btn" disabled={isLoading || !input.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default AIChat;