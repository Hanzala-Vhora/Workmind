import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const prisma = new PrismaClient();
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export async function scrapeWebsite(url: string): Promise<string> {
    try {
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;
        const $ = cheerio.load(html);

        // Remove unnecessary elements
        $('script, style, noscript, iframe, img, svg, video, audio').remove();

        const title = $('title').text().trim();
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        
        let textContent = $('body').text();
        textContent = textContent.replace(/\s+/g, ' ').trim();

        // Limit to ~20000 characters to avoid huge payloads
        const rawContent = `Title: ${title}\nDescription: ${metaDescription}\n\nContent:\n${textContent.slice(0, 20000)}`;
        return rawContent;
    } catch (error: any) {
        console.error('Error scraping website:', error.message);
        throw new Error(`Failed to scrape website: ${error.message}`);
    }
}

export async function analyzeWebsiteContent(rawContent: string, socialLinks: string = ''): Promise<string> {
    const prompt = `You are an expert business analyst. I am providing you with the scraped raw text from a company's website, along with any social media context if provided.
Your goal is to extract and structure this into a clear, concise "Shared Business Context" that will be used by our internal AI agents (Sales, Marketing, HR, etc.) to understand the company.

Website Raw Content:
${rawContent}

Social Links Context:
${socialLinks}

Please generate a structured analysis including:
1. What the company does (Core Offerings)
2. Target Audience (ICP)
3. Tone and Messaging Style
4. Key Marketing Angles
5. Strong Sales Points / USPs
6. Pricing or Packages (if found)

Keep it highly relevant and structured. Avoid fluff.`;

    try {
        let modelProvider = 'gemini';
        try {
            const setting = await prisma.systemSetting.findUnique({ where: { key: 'DEFAULT_MODEL_PROVIDER' } });
            if (setting) modelProvider = setting.value;
            else if (process.env.DEFAULT_MODEL_PROVIDER) modelProvider = process.env.DEFAULT_MODEL_PROVIDER;
        } catch (e) {
            console.warn('Could not fetch model provider from DB, falling back to gemini');
        }

        if (modelProvider === 'claude') {
            const response = await fetch(CLAUDE_API_URL, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 2000,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Claude API Error: ${errText}`);
            }
            const data = await response.json();
            return data.content[0]?.text || 'No analysis generated.';
        } else if (modelProvider === 'openai') {
            const stream = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
            });
            return stream.choices[0]?.message?.content || 'No analysis generated.';
        } else {
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { temperature: 0.3 }
            });
            const result = await chat.sendMessage({ message: prompt });
            return result.text || 'No analysis generated.';
        }
    } catch (error: any) {
        console.error('Error analyzing website:', error);
        return 'Failed to analyze website content.';
    }
}
