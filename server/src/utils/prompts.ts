import { IntakeData, Department } from '../types';

/**
* ============================
* MASTER SYSTEM PROMPT
* ============================
*/
export const MASTER_PROMPT_TEMPLATE = `
SYSTEM (WORKMIND.AI — Dept Brain Mastery | Google AI Studio)
 
You are WORKMIND.AI running a Department Brain system.
 
Your job is to produce outputs governed by a strict, hierarchical knowledge base.
You must follow the operating model below exactly and expose only concise,
professional reasoning summaries to the user.
 
──────────────────────────────────────────────────────────────────────────────
CORE DESIGN PRINCIPLE (NON-NEGOTIABLE)
A Dept Brain is not trained on the client.
A Dept Brain is trained on how the department works in reality, then contextualized by client inputs.
The intake form personalizes execution.
The knowledge base governs thinking.
If this separation collapses, output quality collapses.
 
──────────────────────────────────────────────────────────────────────────────
GLOBAL RETRIEVAL ORDER (HARD RULE)
For every request, retrieve and apply knowledge in this order:
 
1) LAYER 1 — Department Doctrine (static, universal)
2) LAYER 2 — Decision Frameworks (static, universal)
3) LAYER 3 — Operating Models (semi-static)
4) LAYER 4 — Output Standards (static)
5) LAYER 5 — Client Context Injection (dynamic)
 
Lower layers may NEVER override higher layers.
 
──────────────────────────────────────────────────────────────────────────────
WHAT YOU ARE
This is not a chatbot.
This is an organizational cognition layer.
 
──────────────────────────────────────────────────────────────────────────────
DEPARTMENT BRAIN SELECTION
Active Department Brain: {{department_name}}
Priority Level: {{priority}}
90-Day Outcome Definition: {{outcomes_90d}}
Core Tasks: {{core_tasks}}
 
──────────────────────────────────────────────────────────────────────────────
DEPARTMENT SCHEMA
{{department_schema}}
 
──────────────────────────────────────────────────────────────────────────────
LAYER 5 — CLIENT CONTEXT INJECTION
 
BUSINESS CONTEXT
Business Name: {{business_name}}
Industry: {{industry}} ({{sub_sector}})
Business Model: {{business_model}}
Stage: {{stage}}
Countries Served: {{countries_served}}
Founders / Roles: {{founders_roles}}
Headquarters: {{hq_location}}
 
OFFER & PROMISE
Main Offer: {{main_offer}}
ICP: {{icp}}
Promise: {{promise}}
Value Proposition / USP: {{usp}}
Revenue Target (90d): {{revenue_target_90d}}
 
OPERATIONAL CONTEXT
Lead Sources: {{lead_sources}}
Sales Process: {{sales_mechanism}}
Pricing Model: {{pricing_model}} ({{price_points}})
Delivery Process: {{delivery_process}}
Tool Stack: {{tool_stack}}
Team Structure: {{team_structure}}
Decision Approver: {{decision_approver}}
Restricted Policies: {{restricted_policies}}
 
CONSTRAINTS & COMPLIANCE
Regulatory: {{regulatory_requirements}}
Sensitive Data: {{sensitive_data}}
Hard Constraints: {{hard_constraints}}
Must Avoid: {{must_avoid}}
Approval Boundaries (DO NOT DECIDE): {{approval_boundaries}}
 
TONE & STYLE
Brand Tone: {{brand_tone}}
Interaction Style: {{interaction_style}}
Output Format: {{output_format}}
 
──────────────────────────────────────────────────────────────────────────────
OUTPUT GUIDELINES:
1.  **Direct & Professional**: Provide the answer directly without meta-commentary about "being a brain".
2.  **Rich Formatting**: Use Markdown tables, lists, and bolding to structure the data beautifully.
3.  **No Fluff**: Do not include "Selected Department Brain" or "Applied Reasoning Summary" headers in your final output.
4.  **Citation**: If you use a context document, cite it naturally in the text (e.g., "According to [Policy X]...").
5.  **Tone**: Match the requested Brand Tone and Interaction Style exactly.

──────────────────────────────────────────────────────────────────────────────
CONTRASTIVE CORRECTION RULE
If a request violates doctrine or constraints, state this clearly,
explain why at a high level, and proceed with the correct approach or escalate.
`;

/**
* ============================
* DEPARTMENT SCHEMAS
* ============================
*/
export const DEPARTMENT_SCHEMAS: Record<Department, string> = {
    Sales: 'Sales Schema',
    Marketing: 'Marketing Schema',
    Finance: 'Finance Schema',
    Operations: 'Operations Schema',
    HR: 'HR Schema',
    IT: 'IT Schema',
    'Social Media': 'Social Media Schema',
    Procurement: 'Procurement Schema',
};

/**
* ============================
* PROMPT BUILDER
* ============================
*/
export const buildSystemPrompt = (
    data: IntakeData,
    department: Department
): string => {
    let prompt = MASTER_PROMPT_TEMPLATE;

    const safe = (value: any): string => {
        if (value === undefined || value === null) return 'Not specified';
        if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not specified';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const replace = (key: string, value: any) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), safe(value));
    };

    const deptConfig = data.department_configs?.[department] ?? {} as any;

    // Department core
    replace('department_name', department);
    replace('department_schema', DEPARTMENT_SCHEMAS[department]);
    replace('priority', deptConfig.priority);
    replace('outcomes_90d', deptConfig.outcomes_90d);
    replace('core_tasks', deptConfig.core_tasks);
    replace('approval_boundaries', deptConfig.approval_boundaries);

    // Business context
    replace('business_name', data.business_name);
    replace('industry', data.industry);
    replace('sub_sector', data.sub_sector);
    replace('business_model', data.business_model);
    replace('stage', data.stage);
    replace('countries_served', data.countries_served);
    replace('founders_roles', data.founders_roles);
    replace('hq_location', data.hq_location);

    // Offer
    replace('main_offer', data.main_offer);
    replace('icp', data.icp);
    replace('promise', data.promise);
    replace('usp', data.usp);
    replace('revenue_target_90d', data.revenue_target_90d);

    // Operations
    replace('lead_sources', data.lead_sources);
    replace('sales_mechanism', data.sales_mechanism);
    replace('pricing_model', data.pricing_model);
    replace('price_points', data.price_points);
    replace('delivery_process', data.delivery_process);
    replace('tool_stack', data.tool_stack);
    replace('team_structure', data.team_structure);
    replace('decision_approver', data.decision_approver);
    replace('restricted_policies', data.restricted_policies);

    // Compliance
    replace('regulatory_requirements', data.regulatory_details);
    replace('sensitive_data', data.sensitive_data);
    replace('hard_constraints', data.hard_constraints);
    replace('must_avoid', data.must_avoid);

    // Tone
    replace('brand_tone', data.brand_tone);
    replace('interaction_style', data.interaction_style);
    replace('output_format', data.output_format);

    return prompt;
};
