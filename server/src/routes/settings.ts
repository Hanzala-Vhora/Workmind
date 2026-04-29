import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

/**
 * GET /api/settings/ai-config
 * Returns the currently active AI model and provider configuration.
 * Fetches from database if available, otherwise falls back to environment variables.
 */
router.get('/ai-config', async (req, res) => {
    try {
        // Fetch settings from database
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['DEFAULT_MODEL_PROVIDER', 'DEFAULT_MODEL'] }
            }
        });

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        const config = {
            modelProvider: settingsMap['DEFAULT_MODEL_PROVIDER'] || process.env.DEFAULT_MODEL_PROVIDER || 'gemini',
            model: settingsMap['DEFAULT_MODEL'] || process.env.DEFAULT_MODEL || 'gemini-2.0-flash',
            availableProviders: ['gemini', 'openai', 'claude']
        };
        
        res.json(config);
    } catch (error) {
        console.error('Error fetching settings:', error);
        // Fallback to env vars on error
        res.json({
            modelProvider: process.env.DEFAULT_MODEL_PROVIDER || 'gemini',
            model: process.env.DEFAULT_MODEL || 'gemini-2.0-flash',
            availableProviders: ['gemini', 'openai', 'claude']
        });
    }
});

export default router;
