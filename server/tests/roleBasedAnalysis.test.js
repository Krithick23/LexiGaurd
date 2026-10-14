import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../server.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Contract from '../models/Contract.js';
import { runFallbackAnalysis } from '../services/fallbackAnalysis.js';

describe('End-to-End Role-Based Contract Analysis & Isolation Tests', () => {
  let freelancerToken, freelancerUser;
  let internToken, internUser;
  let smbToken, smbUser;
  let founderToken, founderUser;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.MONGODB_URI;
    await connectDB();
    await User.deleteMany({});
    await Contract.deleteMany({});

    // 1. Register Freelancer
    const fRes = await request(app).post('/api/auth/register').send({
      name: 'Aarav Freelancer',
      email: 'aarav.freelancer@test.com',
      password: 'Password123!',
      role: 'freelancer',
    });
    freelancerToken = fRes.body.token;
    freelancerUser = fRes.body.user;

    // 2. Register Intern
    const iRes = await request(app).post('/api/auth/register').send({
      name: 'Rohan Intern',
      email: 'rohan.intern@test.com',
      password: 'Password123!',
      role: 'intern', // 3 canonical roles: freelancer, intern, small_business
    });
    internToken = iRes.body.token;
    internUser = iRes.body.user;

    // 3. Register Small Business Owner
    const sRes = await request(app).post('/api/auth/register').send({
      name: 'Meera SMB',
      email: 'meera.smb@test.com',
      password: 'Password123!',
      role: 'business', // tests normalization to 'small_business'
    });
    smbToken = sRes.body.token;
    smbUser = sRes.body.user;

    // 4. Register Small Business Owner (commercial lease / customer contract perspective)
    const foRes = await request(app).post('/api/auth/register').send({
      name: 'Vikram SMB',
      email: 'vikram.smb@test.com',
      password: 'Password123!',
      role: 'small_business',
    });
    founderToken = foRes.body.token;
    founderUser = foRes.body.user;
  }, 60000);

  afterAll(async () => {
    await User.deleteMany({});
    await Contract.deleteMany({});
    await disconnectDB();
  }, 30000);

  // Acceptance Criterion 1: Freelancer Client Agreement
  it('Criterion 1: Freelancer logs in, uploads client agreement and receives freelancer-specific analysis', async () => {
    const freelanceAgreement = `
    INDEPENDENT CONTRACTOR SERVICE AGREEMENT
    1. SCOPE OF SERVICES: Contractor shall design user interface components for Client mobile application.
    2. PAYMENT AND MILESTONES: Total fee of INR 1,50,000 shall be paid across 3 milestones upon Client satisfaction. Invoices paid within 90 days.
    3. INTELLECTUAL PROPERTY: Contractor assigns all worldwide rights and intellectual property unconditionally upon creation.
    4. REVISIONS: Contractor agrees to provide unlimited revisions at no additional cost until client approves.
    5. TERMINATION: Client may terminate at any time with 24 hours notice without paying cancellation fees.
    6. NON-COMPETE: Contractor shall not perform freelance design work for any software firm in India for 24 months.
    `;

    const res = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .attach('file', Buffer.from(freelanceAgreement, 'utf-8'), 'freelance_service_agreement.txt');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const contract = res.body.contract;

    expect(contract.roleAtAnalysis).toBe('freelancer');
    expect(contract.detectedContractType).toBeDefined();
    expect(contract.overallRiskScore).toBeGreaterThanOrEqual(50);
    expect(contract.clauses.length).toBeGreaterThan(0);

    // Verify freelancer specific checks were applied
    const paymentClause = contract.clauses.find((c) => c.text.includes('90 days'));
    expect(paymentClause).toBeDefined();
    expect(paymentClause.whyItMatters).toMatch(/cash flow|freelance|late payment|working capital/i);

    const nonCompeteClause = contract.clauses.find((c) => c.text.includes('24 months'));
    expect(nonCompeteClause).toBeDefined();
    expect(nonCompeteClause.reason).toContain('Section 27');
    expect(nonCompeteClause.risk).toMatch(/Critical|High/);
  });

  // Acceptance Criterion 2: Intern uploads internship agreement
  it('Criterion 2: Intern logs in, uploads internship agreement and receives internship-specific analysis', async () => {
    const internshipAgreement = `
    INTERNSHIP OFFER & TRAINING AGREEMENT
    1. STIPEND: Company shall pay an internship stipend of INR 15,000 per month on the 7th working day.
    2. DURATION & HOURS: The internship shall be 6 months with expected 50 hours of work per week.
    3. TRAINING BOND & PENALTY: Intern agrees to serve a mandatory 2-year service bond. If intern leaves before 2 years, intern must pay INR 1,50,000 as liquidated damages and training costs.
    4. FULL-TIME CONVERSION: Conversion to full-time employment is not guaranteed and subject to management sole discretion.
    5. INTELLECTUAL PROPERTY: All code and project assets created during internship belong exclusively to Company.
    `;

    const res = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${internToken}`)
      .attach('file', Buffer.from(internshipAgreement, 'utf-8'), 'internship_training_offer.txt');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const contract = res.body.contract;

    expect(contract.roleAtAnalysis).toBe('intern');
    expect(contract.detectedContractType).toMatch(/Internship/i);

    // Check internship-specific flags: training bond penalty is flagged as Critical/High
    const bondClause = contract.clauses.find((c) => c.text.includes('TRAINING BOND') || c.text.includes('bond'));
    expect(bondClause).toBeDefined();
    expect(bondClause.risk).toMatch(/Critical|High/);
    expect(bondClause.whyItMatters).toMatch(/intern|bond|penalty|Section 27|employment/i);
    expect(bondClause.negotiation?.alternativeWording || bondClause.saferAlternative).toBeDefined();
  });

  // Acceptance Criterion 3: Small Business Owner uploads vendor agreement
  it('Criterion 3: Small business owner uploads vendor agreement and receives business-specific analysis', async () => {
    const vendorAgreement = `
    VENDOR SUPPLY AND SERVICE LEVEL AGREEMENT
    1. VENDOR SERVICES: Supplier shall provide cloud server hosting with 99.0% uptime guarantee.
    2. PAYMENT TERMS & DEPOSIT: Client shall pay INR 2,00,000 annual fee upfront. All payments are non-refundable under all circumstances.
    3. SERVICE LEVEL PENALTIES: Sole remedy for service outage is a 5% credit on future renewal billing.
    4. AUTOMATIC RENEWAL: Agreement automatically renews for successive 24-month terms unless cancelled 90 days prior to expiry.
    5. LIMITATION OF LIABILITY: Supplier aggregate liability for all claims shall not exceed INR 5,000, regardless of negligence or data loss.
    `;

    const res = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${smbToken}`)
      .attach('file', Buffer.from(vendorAgreement, 'utf-8'), 'vendor_supply_agreement.txt');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const contract = res.body.contract;

    expect(contract.roleAtAnalysis).toBe('small_business');
    expect(contract.detectedContractType).toMatch(/Vendor|Supply|Commercial|Service/i);

    // Check business-specific flags: auto-renewal trap, limitation of liability
    const liabilityClause = contract.clauses.find((c) => c.text.includes('LIMITATION OF LIABILITY'));
    expect(liabilityClause).toBeDefined();
    expect(liabilityClause.whyItMatters).toMatch(/business|liability|supplier|vendor|continuity/i);
  });

  // Acceptance Criterion 4: Small Business Owner uploads commercial lease agreement
  it('Criterion 4: Small business owner uploads commercial lease and receives business-specific analysis', async () => {
    const commercialLease = `
    COMMERCIAL LEASE AND PREMISES AGREEMENT
    1. LEASE TERM & PREMISES: Lessor leases commercial office premises to Lessee for thirty-six (36) months.
    2. RENT & ESCALATION: Monthly rent shall be INR 75,000, escalating by 15% annually at Lessor sole discretion.
    3. SECURITY DEPOSIT: Lessee deposits INR 4,50,000 as a non-refundable security deposit subject to total forfeiture upon any dispute.
    4. REPAIRS & INDEMNITY: Lessee shall bear all structural repair costs and indemnifies Lessor with unlimited liability for building damages.
    5. TERMINATION: Lessor may terminate immediately with 7 days notice. Lessee has no right to terminate early under any circumstances.
    `;

    const res = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${founderToken}`)
      .attach('file', Buffer.from(commercialLease, 'utf-8'), 'commercial_lease_agreement.txt');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const contract = res.body.contract;

    expect(contract.roleAtAnalysis).toBe('small_business');
    expect(contract.detectedContractType).toMatch(/Lease|Commercial|Premises|Service|Vendor|Agreement/i);

    // Verify lease/commercial terms: deposit / termination / rent escalation
    const terminationClause = contract.clauses.find((c) => c.text.includes('TERMINATION') || c.text.includes('SECURITY DEPOSIT'));
    expect(terminationClause).toBeDefined();
    expect(terminationClause.risk).toMatch(/Critical|High/);
    expect(terminationClause.whyItMatters).toMatch(/business|liability|termination|rent|lease|deposit|cash flow/i);
  });

  // Acceptance Criterion 5: NDA uploaded and checked from role perspective
  it('Criterion 5: User uploads an NDA and receives NDA-specific checks from their own role perspective', async () => {
    const ndaAgreement = `
    MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT
    1. DEFINITIONS: Confidential Information includes all proprietary technical, financial and client data.
    2. OBLIGATIONS: Receiving Party shall hold all information in strict confidence indefinitely for eternity.
    3. PORTFOLIO EXCLUSION: Receiving Party shall not disclose the existence of this engagement or include any work in portfolio.
    4. INDEMNITY: Receiving Party shall indemnify Disclosing Party for all direct, indirect, and consequential damages from any breach.
    `;

    const res = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .attach('file', Buffer.from(ndaAgreement, 'utf-8'), 'confidentiality_nda.txt');

    expect(res.status).toBe(201);
    const contract = res.body.contract;

    expect(contract.roleAtAnalysis).toBe('freelancer');
    expect(contract.detectedContractType).toMatch(/Non-Disclosure|NDA|Confidentiality/i);

    // Verify portfolio exclusion / indefinite duration analysis
    const durationClause = contract.clauses.find((c) => c.text.includes('indefinitely'));
    expect(durationClause).toBeDefined();
    expect(durationClause.whyItMatters).toMatch(/freelance|indefinite|portfolio|perpetual|standard/i);
  });

  // Acceptance Criterion 6: Upload page contains NO role selector or repeated question
  it('Criterion 6: client/src/pages/Upload.jsx contains no role dropdown or "What role are you?" question', () => {
    const uploadFilePath = path.join(__dirname, '../../client/src/pages/Upload.jsx');
    const uploadContent = fs.readFileSync(uploadFilePath, 'utf-8');

    // Must NOT contain role dropdown / selector
    expect(uploadContent).not.toContain('<RoleSelector');
    expect(uploadContent).not.toMatch(/What role are you\?/i);
    expect(uploadContent).not.toMatch(/Select your role/i);
    expect(uploadContent).not.toMatch(/name="role"/);

    // Must contain informational banner displaying user's account role
    expect(uploadContent).toMatch(/Analyzing as:/);
    expect(uploadContent).toMatch(/\(from account\)/i);
  });

  // Acceptance Criterion 7: Role shown on results page comes from authenticated account
  it('Criterion 7: GET /api/contracts/:id returns the authoritative role from the user account', async () => {
    const agreement = `
    1. GENERAL TERMS: Services provided according to standard commercial schedules.
    2. GOVERNING LAW: Governed by the laws of India.
    `;
    const uploadRes = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .attach('file', Buffer.from(agreement, 'utf-8'), 'simple_agreement.txt');

    expect(uploadRes.status).toBe(201);
    const contractId = uploadRes.body.contract._id;

    const getRes = await request(app)
      .get(`/api/contracts/${contractId}`)
      .set('Authorization', `Bearer ${freelancerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.contract.roleAtAnalysis).toBe('freelancer');
  });

  // Acceptance Criterion 8: Changing frontend role in request cannot override backend user role
  it('Criterion 8: Frontend cannot manipulate role via API request to override registered role', async () => {
    const agreement = `
    1. GENERAL TERMS: Basic software development agreement.
    `;

    // Attempt to inject role: 'founder' when user is registered as 'freelancer'
    const res = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .field('role', 'founder') // Injected malicious role override
      .attach('file', Buffer.from(agreement, 'utf-8'), 'tamper_test.txt');

    expect(res.status).toBe(201);
    // Backend must use user's registered role ('freelancer'), ignoring 'founder'
    expect(res.body.contract.roleAtAnalysis).toBe('freelancer');
    expect(res.body.contract.roleAtAnalysis).not.toBe('founder');
  });

  // Acceptance Criterion 9: Different roles produce appropriately different risk explanations for the same clause
  it('Criterion 9: Different roles produce appropriately different risk explanations for the same clause', () => {
    const ipClause = {
      id: 'c-ip',
      text: 'All inventions, works of authorship, and intellectual property conceived during the term belong exclusively to the Company.',
      originalOrder: 1,
    };

    const freelancerResult = runFallbackAnalysis([ipClause], 'freelancer');
    const internResult = runFallbackAnalysis([ipClause], 'intern');
    const smbResult = runFallbackAnalysis([ipClause], 'small_business');

    const freelancerScored = freelancerResult.clauses[0];
    const internScored = internResult.clauses[0];
    const smbScored = smbResult.clauses[0];

    // Freelancer explanation emphasizes portfolio, pre-existing tools, payment condition
    expect(freelancerScored.whyItMatters).toMatch(/freelance|pre-existing|portfolio|payment/i);

    // Intern explanation emphasizes intern, academic credit, university, or employment protections
    expect(internScored.whyItMatters).toMatch(/intern|academic|university|personal projects|Section 17|employee/i);

    // Small business explanation emphasizes small business, proprietary software, platform IP, or vendor trade secrets
    expect(smbScored.whyItMatters).toMatch(/business|software|platform|frameworks|vendor|proprietary/i);
  });

  // Acceptance Criterion 10: Unsupported or low-confidence documents handled gracefully
  it('Criterion 10: Low-confidence / vague unstructured documents are handled gracefully', async () => {
    const vagueDoc = `
    Meeting Notes Oct 14:
    Discussed items with team.
    Check tomorrow morning.
    `;

    const res = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .attach('file', Buffer.from(vagueDoc, 'utf-8'), 'vague_notes.txt');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.contract).toBeDefined();
    expect(res.body.contract.contractClassification).toBeDefined();
  });

  // Acceptance Criterion 11: Contract history, comparison, and stats continue to work
  it('Criterion 11: Contract history, version comparison, and user stats work as expected', async () => {
    // 1. History
    const histRes = await request(app)
      .get('/api/contracts')
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(histRes.status).toBe(200);
    expect(histRes.body.contracts.length).toBeGreaterThanOrEqual(1);

    // 2. Stats
    const statsRes = await request(app)
      .get('/api/contracts/stats')
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.stats.totalContracts).toBeGreaterThanOrEqual(1);

    // 3. Comparison
    const c1 = histRes.body.contracts[0]._id;
    const c2 = histRes.body.contracts[1]?._id || c1;
    const compRes = await request(app)
      .post('/api/contracts/compare')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({ contractId1: c1, contractId2: c2 });
    expect(compRes.status).toBe(200);
    expect(compRes.body.comparison).toBeDefined();
  });

  // Acceptance Criterion 12: Users cannot access another user's contract or analysis
  it('Criterion 12: Strict user isolation: User B cannot read, delete, or compare User A contracts', async () => {
    // Create private contract owned by Freelancer
    const privateAgreement = `1. CONFIDENTIAL TERMS: Private freelance contract for custom software services between Developer and Secret Client. All rights reserved.`;
    const fUpload = await request(app)
      .post('/api/contracts/upload')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .attach('file', Buffer.from(privateAgreement, 'utf-8'), 'freelancer_private.txt');

    expect(fUpload.status).toBe(201);
    const privateContractId = fUpload.body.contract._id;

    // Intern (User B) tries to read Freelancer's contract
    const unauthorizedGet = await request(app)
      .get(`/api/contracts/${privateContractId}`)
      .set('Authorization', `Bearer ${internToken}`);
    expect(unauthorizedGet.status).toBe(404);

    // Intern (User B) tries to delete Freelancer's contract
    const unauthorizedDelete = await request(app)
      .delete(`/api/contracts/${privateContractId}`)
      .set('Authorization', `Bearer ${internToken}`);
    expect(unauthorizedDelete.status).toBe(404);

    // Intern (User B) tries to compare Freelancer's contract
    const unauthorizedCompare = await request(app)
      .post('/api/contracts/compare')
      .set('Authorization', `Bearer ${internToken}`)
      .send({
        contractId1: privateContractId,
        contractId2: '507f1f77bcf86cd799439011',
      });
    expect(unauthorizedCompare.status).toBe(404);
  });
});
