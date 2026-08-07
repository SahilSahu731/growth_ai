# Security incident response

## Ownership and severity

Assign a named primary security owner and backup in the production runbook. Treat confirmed credential theft, cross-user access, deployment-key exposure, unsigned billing entitlement, destructive admin misuse, or sensitive-data exfiltration as critical.

## Response sequence

1. Open a restricted incident record with UTC timestamps, reporter, affected systems, and current evidence. Preserve logs; do not paste secrets or user content into chat or tickets.
2. Contain with the narrowest safe action: disable the affected role key, increment `ADMIN_SESSION_VERSION`, revoke admin session records, disable AI with `AI_GENERATION_DISABLED`, pause checkout, or isolate a deployment.
3. Rotate exposed member/admin/webhook/background signing keys independently. Rotate `CONVEX_DEPLOY_KEY` in Convex if deployment authority may be exposed; rotate OAuth, Razorpay, Gemini, and application secrets when implicated.
4. Determine scope from tamper-evident audit exports, provider logs, session records, billing events, and affected data/time ranges. Maintain chain of custody.
5. Obtain counsel/privacy-owner guidance on user, regulator, partner, or processor notification deadlines. Communicate verified facts, impact, protective action, and update cadence.
6. Eradicate the cause, deploy reviewed fixes, retest the exploit path, restore service gradually, and monitor for recurrence.
7. Within five business days, publish an internal post-incident review with timeline, root cause, control failures, corrective owners/dates, and evidence that rotations and notifications completed.

Test this runbook with a tabletop at least twice yearly and after major identity, billing, or infrastructure changes.
