
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { KB_LAYERS, MASTER_PROMPT_TEMPLATE } from '@/lib/knowledge-base';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { workspaceId, agentId, threadId, message } = await req.json();

    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    // 1. Fetch Context Data
    const [workspace, agent, intake, repoItems, threadHistory] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
      prisma.agent.findUnique({ where: { id: agentId } }),
      prisma.workspaceIntake.findUnique({ where: { workspaceId } }),
      prisma.repositoryItem.findMany({
        where: { workspaceId, pinned: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.message.findMany({
        where: { threadId },
        take: 10,
        orderBy: { createdAt: 'asc' }
      })
    ]);

    if (!workspace || !agent || !intake) {
      return NextResponse.json({ error: 'Context missing' }, { status: 404 });
    }

    // 2. Assemble KB Pack
    // Match department name loosely to keys
    const deptKey = Object.keys(KB_LAYERS.DEPARTMENTS).find(k => 
      agent.department_name.toLowerCase().includes(k.toLowerCase())
    ) || 'Sales'; // Default if unknown
    
    const layer2 = KB_LAYERS.DEPARTMENTS[deptKey as keyof typeof KB_LAYERS.DEPARTMENTS];
    
    const kbPack = `
      ${KB_LAYERS.LAYER_1}
      ${layer2}
      ${KB_LAYERS.LAYER_3}
    `;

    // 3. Assemble Repository Excerpts (Basic RAG)
    const repoExcerpts = repoItems.map(item => 
      `DOC TITLE: ${item.title} (${item.type})\nCONTENT: ${item.contentText?.substring(0, 1000)}...`
    ).join('\n---\n');

    // 4. Fill Template
    let systemPrompt = MASTER_PROMPT_TEMPLATE
      .replace('{{department_name}}', agent.department_name)
      .replace('{{business_name}}', intake.company_name)
      .replace('{{industry}}', intake.industry)
      .replace('{{company_size}}', intake.company_size)
      .replace('{{current_tools}}', intake.current_tools)
      .replace('{{top_problems}}', intake.top_problems)
      .replace('{{top_goals}}', intake.top_goals)
      .replace('{{output_types}}', intake.output_types)
      .replace('{{extra_notes}}', intake.extra_notes || 'None')
      .replace('{{KB_PACK}}', kbPack)
      .replace('{{REPOSITORY_EXCERPTS}}', repoExcerpts ? `REPOSITORY CONTEXT:\n${repoExcerpts}` : 'REPOSITORY CONTEXT: None available.');

    // 5. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [
        { role: 'system', content: systemPrompt },
        ...threadHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: message }
      ],
      temperature: 0.3, // Strict and factual
    });

    const reply = completion.choices[0].message.content || "I could not generate a response.";

    // 6. Persist
    await prisma.message.createMany({
      data: [
        { threadId, role: 'user', content: message },
        { threadId, role: 'assistant', content: reply }
      ]
    });

    return NextResponse.json({ reply });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
