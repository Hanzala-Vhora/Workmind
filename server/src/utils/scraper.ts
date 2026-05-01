import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';
import { ApifyClient } from 'apify-client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const prisma = new PrismaClient();
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export async function scrapeWebsite(url: string): Promise<string> {
    try {
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        const isSocialMedia = url.includes('instagram.com') || url.includes('linkedin.com') || url.includes('twitter.com');

        if (isSocialMedia) {
            // Use Apify for Social Media scraping to bypass protections
            const apifyToken = process.env.APIFY_API_TOKEN;
            if (!apifyToken) {
                throw new Error("APIFY_API_TOKEN is missing in environment variables. Apify is required to scrape social media.");
            }
            
            const client = new ApifyClient({ token: apifyToken });
            console.log(`Using Apify to scrape social media URL: ${url}`);
            
            let actorId = 'apify/website-content-crawler';
            let inputArgs: any = { startUrls: [{ url }] };

            if (url.includes('instagram.com')) {
                actorId = 'apify/instagram-profile-scraper';
                const usernameMatches = url.match(/instagram\.com\/([^\/?#]+)/);
                inputArgs = { usernames: [usernameMatches ? usernameMatches[1] : url] };
            } else if (url.includes('linkedin.com')) {
                actorId = 'bebity/linkedin-scraper';
                inputArgs = { urls: [url] };
            }
            
            const run = await client.actor(actorId).call(inputArgs);

            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            
            if (!items || items.length === 0) {
                throw new Error("Apify returned no data for this profile.");
            }

            // Convert JSON payload into raw text for the LLM
            const textContent = JSON.stringify(items, null, 2);
            return `[SOCIAL MEDIA EXTRACT via APIFY]\n\nURL: ${url}\n\nContent:\n${textContent.slice(0, 20000)}`;
        }

        // Standard HTTP Scraper for normal websites
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
        let modelProvider = 'claude';
        let modelName = '';
        try {
            const settings = await prisma.systemSetting.findMany({
                where: { key: { in: ['DEFAULT_MODEL_PROVIDER', 'DEFAULT_MODEL'] } }
            });
            const settingsMap = settings.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, string>);

            if (settingsMap['DEFAULT_MODEL_PROVIDER']) modelProvider = settingsMap['DEFAULT_MODEL_PROVIDER'];
            else if (process.env.DEFAULT_MODEL_PROVIDER) modelProvider = process.env.DEFAULT_MODEL_PROVIDER;

            if (settingsMap['DEFAULT_MODEL']) modelName = settingsMap['DEFAULT_MODEL'];
            else if (process.env.DEFAULT_MODEL) modelName = process.env.DEFAULT_MODEL;
        } catch (e) {
            console.warn('Could not fetch model provider from DB, falling back to defaults');
        }

        // Apply fallback models based on provider if not specified in DB
        if (modelProvider === 'claude' && !modelName) modelName = 'claude-3-5-sonnet-20240620';
        if (modelProvider === 'openai' && !modelName) modelName = 'gpt-4o-mini';
        if (modelProvider === 'gemini' && !modelName) modelName = 'gemini-2.0-flash';

        if (modelProvider === 'claude') {
            const response = await fetch(CLAUDE_API_URL, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: modelName,
                    max_tokens: 2000,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Claude API Error: ${errText}`);
            }
            const data = await response.json() as any;
            return data.content[0]?.text || 'No analysis generated.';
        } else if (modelProvider === 'openai') {
            const stream = await openai.chat.completions.create({
                model: modelName,
                messages: [{ role: 'user', content: prompt }],
            });
            return stream.choices[0]?.message?.content || 'No analysis generated.';
        } else {
            const chat = ai.chats.create({
                model: modelName,
                config: { temperature: 0.3 }
            });
            const result = await chat.sendMessage({ message: prompt });
            return result.text || 'No analysis generated.';
        }
    } catch (error: any) {
        console.error('Error analyzing website:', error);
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
}
