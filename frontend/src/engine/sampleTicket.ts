/**
 * Fictional Support Ticket Sample crafted specifically for PromptWars judging flow.
 *
 * Requirements Met:
 * 1. Contains every supported entity type:
 *    - EMAIL (x2: same email address alex.morgan@cybersecure-vault.io)
 *    - PHONE (+1 (555) 234-5678 and +91 98765 43210)
 *    - IPV4 (192.168.1.105)
 *    - IPV6 (2001:0db8:85a3:0000:0000:8a2e:0370:7334)
 *    - PAN (ABCDE1234F)
 *    - AADHAAR (5489 1234 5678)
 *    - CARD (4012 8888 8888 1881 - Valid Luhn test card)
 * 2. 16-digit reference (9876-5432-1098-7654 - Fails Luhn) placed right next to the card.
 * 3. Shows same pseudonym alias for both email occurrences in Pseudonymize mode.
 * 4. Luhn-failing reference stays untouched across all modes.
 */
export const SAMPLE_SUPPORT_TICKET = `TICKET #SEC-89241 - ESCALATION TO BACKEND SECURITY TEAM
Priority: High | Status: Pending Triage | Product: Cloud Checkout & Identity

[CUSTOMER PROFILE & CONTACT]
Account Name: Apex Global Logistics
Primary Contact: Alex Morgan
Customer Email: alex.morgan@cybersecure-vault.io
Direct Callback: +1 (555) 234-5678 | Mobile: +91 98765 43210

[TELEMETRY & NETWORK LOGS]
Client IPv4: 192.168.1.105 (API Edge Gateway 04)
Ingress IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)

[COMPLIANCE & VERIFICATION DATA]
Permanent Account Number (PAN): ABCDE1234F
Aadhaar Candidate: 5489 1234 5678
KYC Verification Status: Tier 3 Verified

[PAYMENT INVESTIGATION - DISPUTED TRANSACTION]
Card Number: 4012 8888 8888 1881 (Declined with code E-4091)
Internal Reference ID: 9876-5432-1098-7654 (16-digit non-card system trace)
Transaction Amount: $4,250.00 USD
Merchant Descriptor: APEX*GLOBAL*VAULT

[AGENT NOTES]
Customer reported recurring timeout during 3D-Secure challenge.
Please send debug payload and confirmation to alex.morgan@cybersecure-vault.io once reviewed.`;

export const SAMPLE_CSV_TICKET = `Ticket_ID,Customer_Name,Email,Phone,Client_IP,Payment_Card,National_ID,Notes
TCK-101,Alex Morgan,alex.morgan@cybersecure-vault.io,+1 (555) 234-5678,192.168.1.105,4012 8888 8888 1881,ABCDE1234F,"Dispute filed; check card auth"
TCK-102,Alex Morgan,alex.morgan@cybersecure-vault.io,+91 98765 43210,10.0.4.15,4012 8888 8888 1881,5489 1234 5678,"Follow-up escalation from alex.morgan@cybersecure-vault.io"
TCK-103,Priya Sharma,priya.s@fintech-edge.in,+91 91234 56789,172.16.254.1,4012 8888 8888 1881,ZXCVB9876Q,"Internal ref 9876-5432-1098-7654 passed cleanly"`;
