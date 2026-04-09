import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seed() {
  // First, update all foreign key references to a single plan
  // Check if Trovira Plan already exists
  let troviraPlan = await db.plan.findUnique({ where: { id: 'plan_trovira' } });

  if (!troviraPlan) {
    // Get any existing plan to reuse its ID, or create fresh
    const existingPlans = await db.plan.findMany();
    if (existingPlans.length > 0) {
      // Update all existing plans data and companies/subscriptions/payments to point to first plan
      const firstPlan = existingPlans[0];
      await db.company.updateMany({ data: { planId: firstPlan.id } });
      await db.subscription.updateMany({ data: { planId: firstPlan.id } });
      await db.payment.updateMany({ data: { planId: firstPlan.id } });

      // Delete other plans
      for (const plan of existingPlans.slice(1)) {
        await db.plan.delete({ where: { id: plan.id } });
      }

      // Update the remaining plan to Trovira Plan
      troviraPlan = await db.plan.update({
        where: { id: firstPlan.id },
        data: {
          id: 'plan_trovira',
          name: 'Trovira Plan',
          price: 2999,
          userLimit: 15,
          leadLimit: 999999,
          isActive: true,
        },
      });
    } else {
      troviraPlan = await db.plan.create({
        data: {
          id: 'plan_trovira',
          name: 'Trovira Plan',
          price: 2999,
          userLimit: 15,
          leadLimit: 999999,
          isActive: true,
        },
      });
    }
  }

  // Create Admin user
  const adminUser = await db.user.upsert({
    where: { email: 'admin@trovira.com' },
    update: {},
    create: {
      email: 'admin@trovira.com',
      name: 'Trovira Admin',
      password: 'admin123',
      role: 'admin',
    },
  });

  // Create sample companies — all on Trovira Plan
  const company1 = await db.company.upsert({
    where: { id: 'comp_abc_school' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'comp_abc_school',
      name: 'ABC School',
      contactPerson: 'Raj Sharma',
      mobile: '9876543210',
      email: 'info@abcschool.com',
      planId: troviraPlan.id,
      status: 'active',
    },
  });

  const company2 = await db.company.upsert({
    where: { id: 'comp_xyz_realty' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'comp_xyz_realty',
      name: 'XYZ Realty',
      contactPerson: 'Amit Patel',
      mobile: '9786543210',
      email: 'info@xyzrealty.com',
      planId: troviraPlan.id,
      status: 'active',
    },
  });

  const company3 = await db.company.upsert({
    where: { id: 'comp_pqr_travel' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'comp_pqr_travel',
      name: 'PQR Travel',
      contactPerson: 'Neha Shah',
      mobile: '9686543210',
      email: 'info@pqrtravel.com',
      planId: troviraPlan.id,
      status: 'active',
    },
  });

  const company4 = await db.company.upsert({
    where: { id: 'comp_def_tech' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'comp_def_tech',
      name: 'DEF Technologies',
      contactPerson: 'Vikram Singh',
      mobile: '9987654321',
      email: 'info@deftech.com',
      planId: troviraPlan.id,
      status: 'active',
    },
  });

  const company5 = await db.company.upsert({
    where: { id: 'comp_mno_health' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'comp_mno_health',
      name: 'MNO Healthcare',
      contactPerson: 'Dr. Anita Desai',
      mobile: '9876543212',
      email: 'info@mnohealth.com',
      planId: troviraPlan.id,
      status: 'active',
    },
  });

  // Create client users for each company
  await db.user.upsert({
    where: { email: 'raj@abcschool.com' },
    update: {},
    create: {
      email: 'raj@abcschool.com',
      name: 'Raj Sharma',
      password: 'client123',
      role: 'client',
      companyId: company1.id,
    },
  });

  await db.user.upsert({
    where: { email: 'amit@xyzrealty.com' },
    update: {},
    create: {
      email: 'amit@xyzrealty.com',
      name: 'Amit Patel',
      password: 'client123',
      role: 'client',
      companyId: company2.id,
    },
  });

  await db.user.upsert({
    where: { email: 'neha@pqrtravel.com' },
    update: {},
    create: {
      email: 'neha@pqrtravel.com',
      name: 'Neha Shah',
      password: 'client123',
      role: 'client',
      companyId: company3.id,
    },
  });

  await db.user.upsert({
    where: { email: 'vikram@deftech.com' },
    update: {},
    create: {
      email: 'vikram@deftech.com',
      name: 'Vikram Singh',
      password: 'client123',
      role: 'client',
      companyId: company4.id,
    },
  });

  await db.user.upsert({
    where: { email: 'anita@mnohealth.com' },
    update: {},
    create: {
      email: 'anita@mnohealth.com',
      name: 'Dr. Anita Desai',
      password: 'client123',
      role: 'client',
      companyId: company5.id,
    },
  });

  // Update existing subscriptions to Trovira Plan
  await db.subscription.updateMany({ data: { planId: troviraPlan.id } });
  await db.payment.updateMany({ data: { planId: troviraPlan.id, amount: 2999 } });

  // Create subscriptions
  const now = new Date();
  await db.subscription.upsert({
    where: { id: 'sub_abc' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'sub_abc',
      companyId: company1.id,
      planId: troviraPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      expiryDate: new Date(now.getFullYear(), now.getMonth() + 1, 30),
      status: 'active',
    },
  });

  await db.subscription.upsert({
    where: { id: 'sub_xyz' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'sub_xyz',
      companyId: company2.id,
      planId: troviraPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 10),
      expiryDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      status: 'active',
    },
  });

  await db.subscription.upsert({
    where: { id: 'sub_pqr' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'sub_pqr',
      companyId: company3.id,
      planId: troviraPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      expiryDate: new Date(now.getFullYear(), now.getMonth(), 1),
      status: 'expired',
    },
  });

  await db.subscription.upsert({
    where: { id: 'sub_def' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'sub_def',
      companyId: company4.id,
      planId: troviraPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 5),
      expiryDate: new Date(now.getFullYear(), now.getMonth() + 2, 5),
      status: 'active',
    },
  });

  await db.subscription.upsert({
    where: { id: 'sub_mno' },
    update: { planId: troviraPlan.id },
    create: {
      id: 'sub_mno',
      companyId: company5.id,
      planId: troviraPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      expiryDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      status: 'active',
    },
  });

  // Create payments
  await db.payment.upsert({
    where: { id: 'pay_1' },
    update: { planId: troviraPlan.id, amount: 2999 },
    create: { id: 'pay_1', companyId: company1.id, planId: troviraPlan.id, amount: 2999, method: 'UPI', status: 'paid' },
  });

  await db.payment.upsert({
    where: { id: 'pay_2' },
    update: { planId: troviraPlan.id, amount: 2999 },
    create: { id: 'pay_2', companyId: company2.id, planId: troviraPlan.id, amount: 2999, method: 'Bank', status: 'paid' },
  });

  await db.payment.upsert({
    where: { id: 'pay_3' },
    update: { planId: troviraPlan.id, amount: 2999 },
    create: { id: 'pay_3', companyId: company3.id, planId: troviraPlan.id, amount: 2999, method: 'UPI', status: 'pending' },
  });

  await db.payment.upsert({
    where: { id: 'pay_4' },
    update: { planId: troviraPlan.id, amount: 2999 },
    create: { id: 'pay_4', companyId: company4.id, planId: troviraPlan.id, amount: 2999, method: 'Card', status: 'paid' },
  });

  await db.payment.upsert({
    where: { id: 'pay_5' },
    update: { planId: troviraPlan.id, amount: 2999 },
    create: { id: 'pay_5', companyId: company5.id, planId: troviraPlan.id, amount: 2999, method: 'UPI', status: 'paid' },
  });

  // Create sample leads for all companies
  const leadStatuses = ['New', 'Contacted', 'Interested', 'Proposal Sent', 'Won', 'Lost'];
  const leadSources = ['WhatsApp', 'Facebook', 'Instagram', 'Website', 'Referral', 'manual'];
  const names = [
    'Raj Kumar', 'Priya Sharma', 'Amit Verma', 'Sneha Patel', 'Rohit Gupta',
    'Anita Singh', 'Vikram Joshi', 'Meera Reddy', 'Arjun Nair', 'Kavita Desai',
    'Suresh Kumar', 'Deepika Iyer', 'Rahul Mehta', 'Pooja Agarwal', 'Manish Tiwari',
    'Shalini Rao', 'Nikhil Bansal', 'Ritu Sharma', 'Sanjay Verma', 'Geeta Kumari',
    'Ravi Malhotra', 'Nisha Gupta', 'Arun Kapoor', 'Swati Pillai', 'Dinesh Yadav',
    'Lakshmi Narayan', 'Harsh Vardhan', 'Rekha Mishra', 'Karan Thakur', 'Divya Saxena',
  ];

  const allCompanies = [company1, company2, company3, company4, company5];
  for (const comp of allCompanies) {
    const existingCount = await db.lead.count({ where: { companyId: comp.id } });
    if (existingCount > 0) continue;

    const numLeads = comp.id === company1.id ? 30 : comp.id === company2.id ? 20 : 15;
    for (let i = 0; i < numLeads; i++) {
      const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
      const source = leadSources[Math.floor(Math.random() * leadSources.length)];
      const leadName = names[i % names.length];
      const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const followupDate = new Date(now.getTime() + Math.random() * 7 * 86400000);

      await db.lead.create({
        data: {
          companyId: comp.id,
          name: leadName,
          phone,
          email: `${leadName.toLowerCase().replace(' ', '.')}@example.com`,
          company: `${leadName.split(' ')[0]} Enterprises`,
          source,
          status,
          followupDate: Math.random() > 0.3 ? followupDate : null,
          notes: `Lead for ${source} inquiry`,
          value: Math.floor(Math.random() * 50000) + 5000,
        },
      });
    }
  }

  // Create support tickets
  await db.supportTicket.upsert({
    where: { id: 'ticket_1' },
    update: {},
    create: {
      id: 'ticket_1',
      companyId: company1.id,
      subject: 'WhatsApp not working',
      issue: 'WhatsApp integration stopped working after the latest update. Need urgent fix.',
      status: 'open',
      priority: 'high',
    },
  });

  await db.supportTicket.upsert({
    where: { id: 'ticket_2' },
    update: {},
    create: {
      id: 'ticket_2',
      companyId: company2.id,
      subject: 'Cannot login',
      issue: 'Getting an error when trying to login to the CRM. Credentials seem correct.',
      status: 'closed',
      priority: 'medium',
    },
  });

  await db.supportTicket.upsert({
    where: { id: 'ticket_3' },
    update: {},
    create: {
      id: 'ticket_3',
      companyId: company3.id,
      subject: 'Feature request',
      issue: 'We would like to request a new feature for bulk lead import.',
      status: 'open',
      priority: 'low',
    },
  });

  // Create followups using actual lead IDs
  const company1Leads = await db.lead.findMany({ where: { companyId: company1.id }, take: 4, select: { id: true } });
  const company2Leads = await db.lead.findMany({ where: { companyId: company2.id }, take: 1, select: { id: true } });
  const todayStr = now.toISOString().split('T')[0];

  const existingFu1 = await db.followup.findUnique({ where: { id: 'fu_1' } });
  if (!existingFu1 && company1Leads.length >= 4) {
    await db.followup.create({
      data: { id: 'fu_1', leadId: company1Leads[0].id, companyId: company1.id, date: new Date(todayStr), time: '10:30', purpose: 'Call about enrollment', status: 'pending', notes: 'Discuss admission process' },
    });
    await db.followup.create({
      data: { id: 'fu_2', leadId: company1Leads[1].id, companyId: company1.id, date: new Date(todayStr), time: '12:00', purpose: 'Send details via WhatsApp', status: 'pending', notes: 'Send fee structure' },
    });
    await db.followup.create({
      data: { id: 'fu_4', companyId: company1.id, leadId: company1Leads[3].id, date: new Date(now.getTime() - 86400000), time: '09:00', purpose: 'Initial call', status: 'overdue', notes: 'Missed the call, reschedule' },
    });
  }
  const existingFu3 = await db.followup.findUnique({ where: { id: 'fu_3' } });
  if (!existingFu3 && company2Leads.length >= 1) {
    await db.followup.create({
      data: { id: 'fu_3', companyId: company2.id, leadId: company2Leads[0].id, date: new Date(now.getTime() + 86400000), time: '11:00', purpose: 'Site visit follow-up', status: 'pending' },
    });
  }

  // Create CRM settings for companies
  for (const comp of allCompanies) {
    await db.crmSetting.upsert({
      where: { id: `settings_${comp.id}` },
      update: {},
      create: {
        id: `settings_${comp.id}`,
        companyId: comp.id,
        businessName: comp.name,
        email: comp.email,
        phone: comp.mobile,
      },
    });
  }

  // Seed Notes for each company
  const notesData: { companyId: string; title: string; content: string; color: string; isPinned: boolean; tags: string }[] = [
    // ABC School
    { companyId: company1.id, title: 'Q1 Sales Strategy', content: 'Focus on upselling existing clients. Target 20% increase in MRR. Key accounts to prioritize: TechCorp, EduStart, HealthPlus.\n\nAction items:\n- Schedule demo calls\n- Prepare pricing sheets\n- Update proposal templates', color: 'yellow', isPinned: true, tags: 'Important, Action Item' },
    { companyId: company1.id, title: 'Client Meeting Notes — ABC Realty', content: 'Discussed CRM requirements. They need:\n1. WhatsApp integration\n2. Lead scoring automation\n3. Custom reports\n\nBudget approved: ₹50,000/year. Follow up by Feb 20.', color: 'green', isPinned: true, tags: 'Meeting, Client' },
    { companyId: company1.id, title: 'Product Feature Ideas', content: 'New features to consider:\n- AI-powered lead scoring\n- Email sequence builder\n- Calendar sync for follow-ups\n- Bulk WhatsApp messaging\n- Dark mode support', color: 'blue', isPinned: false, tags: 'Idea' },
    { companyId: company1.id, title: 'Team Training Schedule', content: 'Next training session: Feb 25, 2 PM\n\nTopics:\n- Pipeline management best practices\n- Using broadcast feature\n- Automation workflows\n\nTrainer: Neha Patel', color: 'purple', isPinned: false, tags: 'Reminder' },
    { companyId: company1.id, title: 'Follow-up: Priya Sharma Demo', content: 'Demo call went well. She liked the WhatsApp integration feature. Send proposal by this week. She mentioned budget approval might take 2 weeks.', color: 'pink', isPinned: false, tags: 'Follow-up, Client' },
    { companyId: company1.id, title: 'Personal Goals — Feb', content: '- Close 5 deals this month\n- Onboard 3 new clients\n- Complete CRM certification\n- Review and optimize all automated workflows', color: 'white', isPinned: false, tags: 'Personal' },

    // XYZ Realty
    { companyId: company2.id, title: 'Property Listing Strategy', content: 'Focus on premium properties in Bandra and Andheri. Coordinate with photographers for virtual tours. Update listing templates with new branding.', color: 'yellow', isPinned: true, tags: 'Important' },
    { companyId: company2.id, title: 'Site Visit Checklist', content: 'Items to prepare before client visit:\n- Property documents (ownership, tax receipts)\n- Floor plans and measurements\n- Neighborhood amenities list\n- Pricing comparison sheet', color: 'green', isPinned: false, tags: 'Action Item' },
    { companyId: company2.id, title: 'Competitor Analysis Notes', content: 'Key competitors:\n1. PropTiger — strong online presence\n2. MagicBricks — better pricing data\n3. Housing.com — good mobile UX\n\nOur advantage: Personal CRM + WhatsApp integration', color: 'blue', isPinned: false, tags: 'Idea' },
    { companyId: company2.id, title: 'RERA Compliance Updates', content: 'New RERA regulations effective March 2025:\n- Mandatory quarterly progress reports\n- Updated escrow account requirements\n- Need to update all project registrations', color: 'pink', isPinned: false, tags: 'Reminder, Important' },

    // PQR Travel
    { companyId: company3.id, title: 'Summer Travel Packages', content: 'Packages to launch for summer 2025:\n1. Goa Beach Retreat — ₹15,999/person\n2. Kerala Backwaters — ₹22,999/person\n3. Rajasthan Heritage Tour — ₹18,999/person\n\nEarly bird discount: 15% before March 15.', color: 'yellow', isPinned: true, tags: 'Important, Action Item' },
    { companyId: company3.id, title: 'Vendor Contacts', content: 'Hotels:\n- Taj Group — Priya: 9876543201\n- Marriott — Rahul: 9876543202\n- ITC Hotels — Sanjay: 9876543203\n\nTransport:\n- SRS Travels — Amit: 9876543204\n- VRL Travels — Deepak: 9876543205', color: 'green', isPinned: false, tags: 'Client' },
    { companyId: company3.id, title: 'Customer Feedback Summary', content: 'January feedback highlights:\n- 92% satisfaction rate\n- Most requested: flexible payment plans\n- Complaint: slow response on WhatsApp\n- Suggestion: add group booking discounts', color: 'blue', isPinned: false, tags: 'Meeting' },

    // DEF Technologies
    { companyId: company4.id, title: 'Product Roadmap Q2 2025', content: 'Phase 1 (April): AI Lead Scoring\nPhase 2 (May): Email Automation\nPhase 3 (June): Mobile App Beta\n\nBudget allocation: ₹8L for development, ₹2L for marketing', color: 'yellow', isPinned: true, tags: 'Important, Action Item' },
    { companyId: company4.id, title: 'Sprint Retrospective Notes', content: 'What went well:\n- Faster deployment cycle\n- Better code review process\n\nWhat to improve:\n- Test coverage (currently 62%, target 80%)\n- Documentation updates lagging\n- Need more sync between design and dev', color: 'purple', isPinned: false, tags: 'Meeting, Idea' },
    { companyId: company4.id, title: 'Client Onboarding Checklist', content: 'New client onboarding steps:\n1. Account setup (30 min)\n2. Data migration (2-3 days)\n3. Training session (1 hr)\n4. UAT testing (1 week)\n5. Go-live + support handoff', color: 'green', isPinned: false, tags: 'Action Item' },
    { companyId: company4.id, title: 'Hiring Plan — Dev Team', content: 'Positions needed:\n- Senior React Developer (1)\n- Backend Developer — Node.js (1)\n- QA Engineer (1)\n- UI/UX Designer (1)\n\nBudget: ₹15L/year total\nTarget: All positions filled by April', color: 'white', isPinned: false, tags: 'Reminder' },

    // MNO Healthcare
    { companyId: company5.id, title: 'Patient CRM Integration Notes', content: 'Requirements from Dr. Mehta:\n- HIPAA compliant data storage\n- Appointment reminder automation\n- Patient feedback collection\n- Insurance claim tracking\n\nDeadline: End of March', color: 'yellow', isPinned: true, tags: 'Important, Client' },
    { companyId: company5.id, title: 'Medical Conference Schedule', content: 'Upcoming conferences:\n1. MedTech India — March 10-12, Mumbai\n2. HealthIT Summit — April 5-7, Delhi\n3. Digital Health Expo — May 15-17, Bangalore\n\nRegister early for group discounts.', color: 'blue', isPinned: false, tags: 'Reminder' },
    { companyId: company5.id, title: 'Telemedicine Feature Specs', content: 'Core features:\n- Video consultation (WebRTC)\n- Prescription generation\n- Lab report integration\n- Payment processing (UPI + Card)\n\nTech stack: Next.js + Socket.io + Twilio', color: 'pink', isPinned: false, tags: 'Idea' },
  ];

  for (const note of notesData) {
    const existingCount = await db.note.count({ where: { companyId: note.companyId, title: note.title } });
    if (existingCount === 0) {
      await db.note.create({
        data: {
          companyId: note.companyId,
          title: note.title,
          content: note.content,
          color: note.color,
          isPinned: note.isPinned,
          tags: note.tags,
        },
      });
    }
  }

  // Seed Broadcasts for each company
  const broadcastsData: { companyId: string; name: string; message: string; recipients: number; status: string; delivered: number; readCount: number; failed: number }[] = [
    // ABC School
    { companyId: company1.id, name: 'February Promotion', message: 'Hello! We have exciting offers this February. Get 20% off on all our courses. Contact us today to learn more!', recipients: 145, status: 'sent', delivered: 138, readCount: 112, failed: 7 },
    { companyId: company1.id, name: 'New Year Greetings', message: 'Wishing you a very Happy New Year! May this year bring you success and happiness. We look forward to serving you.', recipients: 230, status: 'delivered', delivered: 225, readCount: 198, failed: 5 },
    { companyId: company1.id, name: 'Admission Open 2025', message: 'Admissions are now open for the academic year 2025-26! Limited seats available. Enroll early to get a discount.', recipients: 180, status: 'sent', delivered: 170, readCount: 95, failed: 10 },
    { companyId: company1.id, name: 'Parent-Teacher Meet Invite', message: 'Hi! You are invited to the Parent-Teacher meeting on Saturday at 10 AM. Please confirm your attendance.', recipients: 42, status: 'queued', delivered: 0, readCount: 0, failed: 0 },
    { companyId: company1.id, name: 'Summer Camp Announcement', message: 'Join our exciting Summer Camp! Activities include arts, sports, coding, and more. Register now!', recipients: 98, status: 'draft', delivered: 0, readCount: 0, failed: 0 },
    { companyId: company1.id, name: 'Fee Reminder', message: 'This is a gentle reminder that the Q1 fees are due by Feb 20th. Please ensure timely payment.', recipients: 15, status: 'failed', delivered: 8, readCount: 5, failed: 7 },

    // XYZ Realty
    { companyId: company2.id, name: 'New Listings Alert', message: 'Check out our latest property listings in Bandra and Andheri. Premium apartments with great amenities. Book a site visit today!', recipients: 85, status: 'delivered', delivered: 82, readCount: 70, failed: 3 },
    { companyId: company2.id, name: 'Festive Season Offer', message: 'Special Diwali offer! 5% discount on booking for all properties listed before November 30. Don\'t miss out!', recipients: 120, status: 'sent', delivered: 115, readCount: 88, failed: 5 },
    { companyId: company2.id, name: 'Price Revision Notice', message: 'Dear clients, please note that prices for select properties will be revised from March 1st. Contact us for current rates.', recipients: 60, status: 'draft', delivered: 0, readCount: 0, failed: 0 },
    { companyId: company2.id, name: 'Site Visit Follow-up', message: 'Thank you for visiting our site last week. We hope you liked what you saw. Let us know if you have any questions!', recipients: 30, status: 'failed', delivered: 25, readCount: 18, failed: 5 },

    // PQR Travel
    { companyId: company3.id, name: 'Summer Packages Launch', message: 'Exciting summer travel packages are here! Goa, Kerala, Rajasthan starting from ₹15,999. Early bird discount: 15%!', recipients: 200, status: 'sent', delivered: 192, readCount: 145, failed: 8 },
    { companyId: company3.id, name: 'Last Minute Deals', message: 'Grab these last-minute deals! 3-day Goa trip for just ₹9,999. Limited availability. Book now!', recipients: 75, status: 'delivered', delivered: 73, readCount: 60, failed: 2 },
    { companyId: company3.id, name: 'Group Booking Discount', message: 'Planning a group trip? Get 20% off for groups of 10+. Perfect for corporate offsites and family reunions!', recipients: 50, status: 'queued', delivered: 0, readCount: 0, failed: 0 },

    // DEF Technologies
    { companyId: company4.id, name: 'Product Launch Invite', message: 'You are invited to the exclusive launch of our latest SaaS product. March 15th, 3 PM IST. Register now!', recipients: 150, status: 'sent', delivered: 145, readCount: 110, failed: 5 },
    { companyId: company4.id, name: 'Webinar Reminder', message: 'Reminder: Our AI in CRM webinar starts in 2 hours. Join link: https://deftech.com/webinar. See you there!', recipients: 90, status: 'delivered', delivered: 88, readCount: 72, failed: 2 },
    { companyId: company4.id, name: 'Newsletter — January', message: 'Monthly newsletter: Product updates, industry insights, and upcoming events. Read now at deftech.com/newsletter.', recipients: 250, status: 'sent', delivered: 240, readCount: 180, failed: 10 },

    // MNO Healthcare
    { companyId: company5.id, name: 'Health Camp Reminder', message: 'Free health checkup camp this Sunday at City Hospital. BP, Sugar, ECG included. Spread the word!', recipients: 180, status: 'sent', delivered: 175, readCount: 140, failed: 5 },
    { companyId: company5.id, name: 'Vaccination Drive', message: 'Flu vaccination drive starts next week. Book your slot now. ₹499 per dose. Walk-ins welcome too.', recipients: 100, status: 'delivered', delivered: 96, readCount: 80, failed: 4 },
    { companyId: company5.id, name: 'Telemedicine Service Launch', message: 'Introducing 24/7 telemedicine consultations! Consult top doctors from home. First consultation free for new patients.', recipients: 130, status: 'queued', delivered: 0, readCount: 0, failed: 0 },
  ];

  for (const bc of broadcastsData) {
    const existingCount = await db.broadcast.count({ where: { companyId: bc.companyId, name: bc.name } });
    if (existingCount === 0) {
      await db.broadcast.create({
        data: {
          companyId: bc.companyId,
          name: bc.name,
          message: bc.message,
          recipients: bc.recipients,
          status: bc.status,
          delivered: bc.delivered,
          readCount: bc.readCount,
          failed: bc.failed,
        },
      });
    }
  }

  // Seed Automation Rules for each company
  const automationData: { companyId: string; name: string; trigger: string; action: string; description: string; status: string; executions: number; lastRun: Date | null }[] = [
    // ABC School
    { companyId: company1.id, name: 'Welcome New Leads', trigger: 'new_lead_created', action: 'send_whatsapp', description: 'Automatically send a welcome message via WhatsApp when a new lead is captured.', status: 'active', executions: 87, lastRun: new Date('2025-02-10T14:30:00') },
    { companyId: company1.id, name: 'Follow-up Overdue Alert', trigger: 'followup_overdue', action: 'create_task', description: 'Create a high-priority task when a follow-up becomes overdue.', status: 'active', executions: 34, lastRun: new Date('2025-02-09T09:00:00') },
    { companyId: company1.id, name: 'Won Lead Notification', trigger: 'lead_status_change', action: 'send_email', description: 'Send a congratulatory email to the team when a lead status changes to Won.', status: 'active', executions: 23, lastRun: new Date('2025-02-08T16:45:00') },
    { companyId: company1.id, name: 'Auto-assign New Leads', trigger: 'new_lead_created', action: 'assign_lead', description: 'Automatically assign new leads to the team member with the fewest active leads.', status: 'paused', executions: 56, lastRun: new Date('2025-01-28T11:20:00') },
    { companyId: company1.id, name: 'Lost Lead Follow-up', trigger: 'lead_status_change', action: 'add_note', description: 'Add a note to leads that change to Lost status with reasons for review.', status: 'active', executions: 12, lastRun: new Date('2025-02-07T10:15:00') },
    { companyId: company1.id, name: 'Interested Lead Email', trigger: 'lead_status_change', action: 'send_email', description: 'Send a detailed product brochure email when a lead status changes to Interested.', status: 'paused', executions: 18, lastRun: new Date('2025-01-25T13:30:00') },
    { companyId: company1.id, name: 'Task Completion Log', trigger: 'task_completed', action: 'add_note', description: 'Automatically add a completion note to the related lead when a task is marked complete.', status: 'active', executions: 45, lastRun: new Date('2025-02-10T15:00:00') },

    // XYZ Realty
    { companyId: company2.id, name: 'Welcome New Prospects', trigger: 'new_lead_created', action: 'send_whatsapp', description: 'Send a welcome message with property catalog link when a new prospect is added.', status: 'active', executions: 52, lastRun: new Date('2025-02-10T09:00:00') },
    { companyId: company2.id, name: 'Site Visit Reminder', trigger: 'followup_overdue', action: 'send_whatsapp', description: 'Send a WhatsApp reminder when a site visit follow-up is overdue.', status: 'active', executions: 28, lastRun: new Date('2025-02-09T14:00:00') },
    { companyId: company2.id, name: 'Won Deal Celebration', trigger: 'lead_status_change', action: 'send_email', description: 'Send celebration email with deal summary when a lead is marked as Won.', status: 'active', executions: 15, lastRun: new Date('2025-02-06T18:00:00') },
    { companyId: company2.id, name: 'Auto Lead Assignment', trigger: 'lead_assigned', action: 'create_task', description: 'Create a follow-up task when a lead is assigned to a team member.', status: 'paused', executions: 40, lastRun: new Date('2025-01-30T10:30:00') },

    // PQR Travel
    { companyId: company3.id, name: 'New Inquiry Welcome', trigger: 'new_lead_created', action: 'send_whatsapp', description: 'Send a WhatsApp message with package highlights when a new travel inquiry is received.', status: 'active', executions: 63, lastRun: new Date('2025-02-10T11:00:00') },
    { companyId: company3.id, name: 'Booking Confirmation', trigger: 'lead_status_change', action: 'send_email', description: 'Send booking confirmation email with itinerary details when a lead converts.', status: 'active', executions: 31, lastRun: new Date('2025-02-08T09:30:00') },
    { companyId: company3.id, name: 'Overdue Follow-up Task', trigger: 'followup_overdue', action: 'create_task', description: 'Create a priority task when a travel inquiry follow-up is missed.', status: 'active', executions: 19, lastRun: new Date('2025-02-09T16:00:00') },

    // DEF Technologies
    { companyId: company4.id, name: 'Lead Welcome Flow', trigger: 'new_lead_created', action: 'send_email', description: 'Send a welcome email with product demo link when a new SaaS lead is captured.', status: 'active', executions: 95, lastRun: new Date('2025-02-10T13:00:00') },
    { companyId: company4.id, name: 'Demo Scheduling', trigger: 'new_lead_created', action: 'create_task', description: 'Create a demo scheduling task for the sales team when a new lead is added.', status: 'active', executions: 78, lastRun: new Date('2025-02-10T14:00:00') },
    { companyId: company4.id, name: 'Lost Lead Analysis', trigger: 'lead_status_change', action: 'add_note', description: 'Add an analysis note when a SaaS lead is marked as Lost for quarterly review.', status: 'paused', executions: 22, lastRun: new Date('2025-02-01T10:00:00') },
    { companyId: company4.id, name: 'Task Completion Notification', trigger: 'task_completed', action: 'send_whatsapp', description: 'Notify the lead owner via WhatsApp when their assigned task is completed.', status: 'active', executions: 55, lastRun: new Date('2025-02-10T12:00:00') },

    // MNO Healthcare
    { companyId: company5.id, name: 'Patient Welcome', trigger: 'new_lead_created', action: 'send_whatsapp', description: 'Send a welcome message with hospital info when a new patient lead is added.', status: 'active', executions: 70, lastRun: new Date('2025-02-10T08:00:00') },
    { companyId: company5.id, name: 'Appointment Overdue Alert', trigger: 'followup_overdue', action: 'create_task', description: 'Create a task for the receptionist when a follow-up appointment is overdue.', status: 'active', executions: 25, lastRun: new Date('2025-02-09T10:00:00') },
    { companyId: company5.id, name: 'Treatment Completion', trigger: 'lead_status_change', action: 'send_email', description: 'Send a treatment summary and follow-up care instructions via email.', status: 'active', executions: 18, lastRun: new Date('2025-02-07T17:00:00') },
    { companyId: company5.id, name: 'Auto Patient Assignment', trigger: 'lead_assigned', action: 'add_note', description: 'Add a note when a patient is assigned to a doctor with speciality info.', status: 'paused', executions: 33, lastRun: new Date('2025-01-20T09:00:00') },
  ];

  for (const rule of automationData) {
    const existingCount = await db.automationRule.count({ where: { companyId: rule.companyId, name: rule.name } });
    if (existingCount === 0) {
      await db.automationRule.create({
        data: {
          companyId: rule.companyId,
          name: rule.name,
          trigger: rule.trigger,
          action: rule.action,
          description: rule.description,
          status: rule.status,
          executions: rule.executions,
          lastRun: rule.lastRun,
        },
      });
    }
  }

  // Seed Emails for each company
  const emailsData: { companyId: string; fromName: string; fromEmail: string; toEmail: string; subject: string; preview: string; body: string; isRead: boolean; isStarred: boolean; hasAttachment: boolean; folder: string }[] = [
    // ABC School
    { companyId: company1.id, fromName: 'Priya Sharma', fromEmail: 'priya@example.com', toEmail: 'raj@abcschool.com', subject: 'Inquiry About Admission Process', preview: 'Hi, I wanted to know about the admission process for the upcoming batch...', body: 'Hi,\n\nI wanted to know about the admission process for the upcoming batch. Could you please share the details regarding the fees, eligibility criteria, and important dates?\n\nLooking forward to your response.\n\nBest regards,\nPriya Sharma', isRead: false, isStarred: true, hasAttachment: false, folder: 'inbox' },
    { companyId: company1.id, fromName: 'Amit Verma', fromEmail: 'amit.verma@corp.com', toEmail: 'raj@abcschool.com', subject: 'Corporate Training Proposal', preview: 'We are looking for a training partner for our team of 50 employees...', body: 'Dear ABC School,\n\nWe are looking for a training partner for our team of 50 employees in data analytics. Could you arrange a meeting to discuss the proposal?\n\nRegards,\nAmit Verma\nHR Manager', isRead: false, isStarred: false, hasAttachment: true, folder: 'inbox' },
    { companyId: company1.id, fromName: 'Sneha Patel', fromEmail: 'sneha@gmail.com', toEmail: 'raj@abcschool.com', subject: 'Fee Structure Request', preview: 'Can you send me the detailed fee structure for the Python course?', body: 'Hello,\n\nCan you send me the detailed fee structure for the Python course? Also, do you offer EMI options?\n\nThanks,\nSneha Patel', isRead: true, isStarred: false, hasAttachment: false, folder: 'inbox' },
    { companyId: company1.id, fromName: 'Raj Sharma', fromEmail: 'raj@abcschool.com', toEmail: 'priya@example.com', subject: 'Re: Inquiry About Admission Process', preview: 'Thank you for your interest! Here are the details about our admission process...', body: 'Hi Priya,\n\nThank you for your interest! Here are the details about our admission process:\n\n1. Last date: July 25, 2025\n2. Eligibility: Any graduate\n3. Fees: ₹25,000 (installments available)\n\nPlease let me know if you need anything else.\n\nRegards,\nRaj Sharma', isRead: true, isStarred: false, hasAttachment: true, folder: 'sent' },
    { companyId: company1.id, fromName: 'Rohit Gupta', fromEmail: 'rohit@startup.io', toEmail: 'raj@abcschool.com', subject: 'Partnership Opportunity', preview: 'We are a startup looking for educational partners. Would love to discuss...', body: 'Hi Raj,\n\nWe are a fast-growing startup looking for educational content partners. Would love to set up a call this week.\n\nBest,\nRohit Gupta\nCEO, Startup.io', isRead: true, isStarred: true, hasAttachment: false, folder: 'inbox' },
    { companyId: company1.id, fromName: 'Meera Reddy', fromEmail: 'meera.r@university.edu', toEmail: 'raj@abcschool.com', subject: 'Workshop Invitation', preview: 'We would like to invite your institution to participate in our upcoming workshop...', body: 'Dear ABC School,\n\nWe would like to invite your institution to participate in our upcoming workshop on "Future of Education Technology" scheduled for August 5, 2025.\n\nWarm regards,\nDr. Meera Reddy', isRead: true, isStarred: false, hasAttachment: true, folder: 'inbox' },
    { companyId: company1.id, fromName: 'Raj Sharma', fromEmail: 'raj@abcschool.com', toEmail: 'amit.verma@corp.com', subject: 'Re: Corporate Training Proposal', preview: 'Thank you for reaching out. We would be happy to schedule a meeting...', body: 'Dear Amit,\n\nThank you for reaching out. We would be happy to schedule a meeting to discuss the corporate training requirements.\n\nWould Friday at 3 PM work for you?\n\nRegards,\nRaj Sharma', isRead: true, isStarred: false, hasAttachment: false, folder: 'sent' },
    { companyId: company1.id, fromName: 'Vikram Joshi', fromEmail: 'vikram@design.co', toEmail: 'raj@abcschool.com', subject: 'Website Redesign Quotation', preview: 'As discussed, here is the quotation for the complete website redesign project...', body: 'Hi Raj,\n\nAs discussed, here is the quotation for the complete website redesign project:\n\n- Design: ₹50,000\n- Development: ₹80,000\n- SEO: ₹15,000\n\nTotal: ₹1,45,000\n\nRegards,\nVikram Joshi', isRead: true, isStarred: false, hasAttachment: true, folder: 'inbox' },

    // XYZ Realty
    { companyId: company2.id, fromName: 'Sunita Mehta', fromEmail: 'sunita.m@gmail.com', toEmail: 'amit@xyzrealty.com', subject: 'Interested in 3BHK in Andheri', preview: 'I saw your listing for a 3BHK in Andheri West. Can you share more details?', body: 'Hi,\n\nI saw your listing for a 3BHK in Andheri West on MagicBricks. Can you share the floor plan, pricing, and possession date?\n\nBudget: Up to ₹1.5 Cr\n\nThanks,\nSunita Mehta', isRead: false, isStarred: true, hasAttachment: false, folder: 'inbox' },
    { companyId: company2.id, fromName: 'Rajesh Kapoor', fromEmail: 'rajesh.k@investments.com', toEmail: 'amit@xyzrealty.com', subject: 'Commercial Property Investment', preview: 'We are looking to invest in commercial spaces in Bandra Kurla Complex...', body: 'Dear Amit,\n\nWe are looking to invest in commercial spaces in BKC area. Our requirements:\n- Minimum 2000 sq ft\n- Grade A building\n- Budget: ₹5-8 Cr\n\nPlease share available options.\n\nRegards,\nRajesh Kapoor', isRead: false, isStarred: false, hasAttachment: true, folder: 'inbox' },
    { companyId: company2.id, fromName: 'Amit Patel', fromEmail: 'amit@xyzrealty.com', toEmail: 'sunita.m@gmail.com', subject: 'Re: Interested in 3BHK in Andheri', preview: 'Thank you for your interest! Here are the details of the property...', body: 'Hi Sunita,\n\nThank you for your interest! The 3BHK details:\n- Area: 1450 sq ft\n- Price: ₹1.35 Cr (negotiable)\n- Possession: Dec 2025\n- Amenities: Pool, Gym, Garden\n\nWould you like to schedule a site visit?\n\nRegards,\nAmit Patel', isRead: true, isStarred: false, hasAttachment: true, folder: 'sent' },
    { companyId: company2.id, fromName: 'Neeta Deshmukh', fromEmail: 'neeta.d@realtor.com', toEmail: 'amit@xyzrealty.com', subject: 'Joint Venture Proposal', preview: 'We have a land parcel in Thane and looking for a development partner...', body: 'Dear Amit,\n\nWe have a 2-acre land parcel in Thane (Ghodbunder Road) and are looking for a development partner. The FSI allows construction of approximately 200 units.\n\nWould you be interested in a joint venture discussion?\n\nRegards,\nNeeta Deshmukh', isRead: true, isStarred: true, hasAttachment: false, folder: 'inbox' },

    // PQR Travel
    { companyId: company3.id, fromName: 'Sanjay Kumar', fromEmail: 'sanjay.k@corp.in', toEmail: 'neha@pqrtravel.com', subject: 'Corporate Offsite Planning', preview: 'We are planning a 3-day corporate offsite for our team of 40 people...', body: 'Hi Neha,\n\nWe are planning a 3-day corporate offsite for 40 people in Goa for March. Requirements:\n- 4-star resort\n- Conference room for 40 pax\n- Team activities\n- All meals included\n\nBudget: ₹15,000 per person\n\nRegards,\nSanjay Kumar\nHR Director', isRead: false, isStarred: true, hasAttachment: false, folder: 'inbox' },
    { companyId: company3.id, fromName: 'Pooja Iyer', fromEmail: 'pooja.iyer@gmail.com', toEmail: 'neha@pqrtravel.com', subject: 'Honeymoon Package to Kerala', preview: 'We are getting married in April and looking for a 5-night Kerala package...', body: 'Hello,\n\nWe are getting married in April and looking for a 5-night Kerala honeymoon package. Budget is around ₹30,000 for two people. We prefer backwater stays and houseboat experience.\n\nThanks,\nPooja Iyer', isRead: true, isStarred: false, hasAttachment: false, folder: 'inbox' },
    { companyId: company3.id, fromName: 'Neha Shah', fromEmail: 'neha@pqrtravel.com', toEmail: 'sanjay.k@corp.in', subject: 'Re: Corporate Offsite Planning', preview: 'Thank you for your inquiry! We have some great resort options in Goa...', body: 'Hi Sanjay,\n\nThank you for reaching out! Based on your requirements, we recommend:\n1. Taj Exotica Resort — ₹18,000/pp\n2. W Goa — ₹16,500/pp\n3. Grand Hyatt — ₹14,500/pp\n\nAll include conference rooms and team activities. Shall I share detailed itineraries?\n\nRegards,\nNeha Shah', isRead: true, isStarred: false, hasAttachment: true, folder: 'sent' },

    // DEF Technologies
    { companyId: company4.id, fromName: 'Arjun Menon', fromEmail: 'arjun@startupxyz.io', toEmail: 'vikram@deftech.com', subject: 'API Integration Support', preview: 'We are trying to integrate your API but facing authentication issues...', body: 'Hi Vikram,\n\nWe are trying to integrate your CRM API for our internal tools but facing authentication issues. The OAuth token seems to expire very quickly.\n\nCan you schedule a support call this week?\n\nRegards,\nArjun Menon\nCTO, StartupXYZ', isRead: false, isStarred: false, hasAttachment: false, folder: 'inbox' },
    { companyId: company4.id, fromName: 'Deepa Nair', fromEmail: 'deepa.n@enterprise.com', toEmail: 'vikram@deftech.com', subject: 'Enterprise License Inquiry', preview: 'We are evaluating CRM solutions for our 500+ employee organization...', body: 'Dear Vikram,\n\nWe are evaluating CRM solutions for our organization of 500+ employees. We need:\n- SSO integration\n- Custom role management\n- On-premise deployment option\n- SLA guarantee\n\nPlease share your enterprise pricing.\n\nRegards,\nDeepa Nair\nVP Operations', isRead: true, isStarred: true, hasAttachment: true, folder: 'inbox' },
    { companyId: company4.id, fromName: 'Vikram Singh', fromEmail: 'vikram@deftech.com', toEmail: 'arjun@startupxyz.io', subject: 'Re: API Integration Support', preview: 'Sure, let\'s schedule a call. Are you available on Thursday at 11 AM?', body: 'Hi Arjun,\n\nSure, let\'s schedule a call. Are you available on Thursday at 11 AM IST?\n\nIn the meantime, please ensure you are using the API v2 endpoints with the refresh token flow. Documentation is at docs.deftech.com/api\n\nRegards,\nVikram Singh', isRead: true, isStarred: false, hasAttachment: false, folder: 'sent' },

    // MNO Healthcare
    { companyId: company5.id, fromName: 'Dr. Ramesh Patel', fromEmail: 'dr.ramesh@hospital.com', toEmail: 'anita@mnohealth.com', subject: 'EMR Software Demo Request', preview: 'We are interested in your EMR module. Can we schedule a demo?', body: 'Dear Anita,\n\nWe run a 200-bed hospital and are interested in your Electronic Medical Records module. Specifically, we need:\n- Patient history management\n- Prescription templates\n- Lab integration\n\nCan we schedule a demo next week?\n\nRegards,\nDr. Ramesh Patel\nMedical Director', isRead: false, isStarred: true, hasAttachment: false, folder: 'inbox' },
    { companyId: company5.id, fromName: 'Kavita Sharma', fromEmail: 'kavita.s@insurance.com', toEmail: 'anita@mnohealth.com', subject: 'Insurance Claims API', preview: 'We would like to integrate with your claims processing system...', body: 'Hi Anita,\n\nWe represent a leading health insurance provider and would like to integrate with your claims processing system for faster settlement.\n\nCan we discuss the technical requirements and API specs?\n\nRegards,\nKavita Sharma\nHead of Partnerships', isRead: true, isStarred: false, hasAttachment: false, folder: 'inbox' },
    { companyId: company5.id, fromName: 'Dr. Anita Desai', fromEmail: 'anita@mnohealth.com', toEmail: 'dr.ramesh@hospital.com', subject: 'Re: EMR Software Demo Request', preview: 'Thank you for your interest! We would be happy to schedule a demo...', body: 'Dear Dr. Ramesh,\n\nThank you for your interest! We would be happy to schedule a demo. How about Wednesday at 10 AM IST?\n\nI will prepare a customized demo based on your hospital\'s requirements.\n\nBest regards,\nDr. Anita Desai', isRead: true, isStarred: false, hasAttachment: true, folder: 'sent' },
  ];

  for (const email of emailsData) {
    const existingCount = await db.crmEmail.count({ where: { companyId: email.companyId, subject: email.subject } });
    if (existingCount === 0) {
      await db.crmEmail.create({
        data: {
          companyId: email.companyId,
          fromName: email.fromName,
          fromEmail: email.fromEmail,
          toEmail: email.toEmail,
          subject: email.subject,
          preview: email.preview,
          body: email.body,
          isRead: email.isRead,
          isStarred: email.isStarred,
          hasAttachment: email.hasAttachment,
          folder: email.folder,
        },
      });
    }
  }

  // Seed WhatsApp Contacts and Messages for each company
  const waContactsData: { companyId: string; name: string; phone: string; lastMessage: string; lastTime: string; unread: number; isOnline: boolean }[] = [
    // ABC School
    { companyId: company1.id, name: 'Priya Sharma', phone: '+91 98765 43210', lastMessage: 'Sure, I will send the documents tomorrow', lastTime: '10:45 AM', unread: 2, isOnline: true },
    { companyId: company1.id, name: 'Amit Verma', phone: '+91 97865 43210', lastMessage: 'Thanks for the update!', lastTime: '9:30 AM', unread: 0, isOnline: true },
    { companyId: company1.id, name: 'Sneha Patel', phone: '+91 96865 43210', lastMessage: 'Can we reschedule the meeting?', lastTime: 'Yesterday', unread: 1, isOnline: false },
    { companyId: company1.id, name: 'Rohit Gupta', phone: '+91 95865 43210', lastMessage: 'The proposal looks great 👍', lastTime: 'Yesterday', unread: 0, isOnline: false },
    { companyId: company1.id, name: 'Kavita Desai', phone: '+91 94865 43210', lastMessage: 'Please share the fee details', lastTime: 'Mon', unread: 3, isOnline: true },
    { companyId: company1.id, name: 'Vikram Joshi', phone: '+91 93865 43210', lastMessage: 'We can discuss this on Friday', lastTime: 'Mon', unread: 0, isOnline: false },
    { companyId: company1.id, name: 'Meera Reddy', phone: '+91 92865 43210', lastMessage: 'Looking forward to the workshop!', lastTime: 'Sun', unread: 0, isOnline: false },
    { companyId: company1.id, name: 'Arjun Nair', phone: '+91 91865 43210', lastMessage: 'Is the batch starting next week?', lastTime: 'Sat', unread: 0, isOnline: false },

    // XYZ Realty
    { companyId: company2.id, name: 'Sunita Mehta', phone: '+91 99123 45678', lastMessage: 'When can I visit the property?', lastTime: '11:00 AM', unread: 1, isOnline: true },
    { companyId: company2.id, name: 'Rajesh Kapoor', phone: '+91 98234 56789', lastMessage: 'Send me the floor plans please', lastTime: '10:15 AM', unread: 0, isOnline: false },
    { companyId: company2.id, name: 'Neeta Deshmukh', phone: '+91 97345 67890', lastMessage: 'The JV proposal looks interesting', lastTime: 'Yesterday', unread: 2, isOnline: true },
    { companyId: company2.id, name: 'Kiran Rao', phone: '+91 96456 78901', lastMessage: 'What is the registration cost?', lastTime: 'Yesterday', unread: 0, isOnline: false },
    { companyId: company2.id, name: 'Pallavi Shah', phone: '+91 95567 89012', lastMessage: 'I will bring my family for the visit', lastTime: 'Tue', unread: 0, isOnline: false },

    // PQR Travel
    { companyId: company3.id, name: 'Sanjay Kumar', phone: '+91 98111 22334', lastMessage: 'Goa resort looks perfect!', lastTime: '2:30 PM', unread: 1, isOnline: true },
    { companyId: company3.id, name: 'Pooja Iyer', phone: '+91 97222 33445', lastMessage: 'Kerala package details please', lastTime: '12:00 PM', unread: 2, isOnline: false },
    { companyId: company3.id, name: 'Rahul Desai', phone: '+91 96333 44556', lastMessage: 'Group discount for 15 people?', lastTime: 'Yesterday', unread: 0, isOnline: false },
    { companyId: company3.id, name: 'Anita Kulkarni', phone: '+91 95444 55667', lastMessage: 'Thanks for the quick booking!', lastTime: 'Mon', unread: 0, isOnline: true },

    // DEF Technologies
    { companyId: company4.id, name: 'Arjun Menon', phone: '+91 98765 11223', lastMessage: 'API token refresh is working now', lastTime: '3:00 PM', unread: 0, isOnline: true },
    { companyId: company4.id, name: 'Deepa Nair', phone: '+91 97654 22334', lastMessage: 'Please share enterprise pricing PDF', lastTime: '1:15 PM', unread: 1, isOnline: false },
    { companyId: company4.id, name: 'Siddharth Roy', phone: '+91 96543 33445', lastMessage: 'SSO integration docs please', lastTime: 'Yesterday', unread: 0, isOnline: false },
    { companyId: company4.id, name: 'Nandini Rao', phone: '+91 95432 44556', lastMessage: 'Trial extension request', lastTime: 'Tue', unread: 0, isOnline: true },

    // MNO Healthcare
    { companyId: company5.id, name: 'Dr. Ramesh Patel', phone: '+91 98100 55667', lastMessage: 'Wednesday 10 AM works for the demo', lastTime: '4:00 PM', unread: 1, isOnline: true },
    { companyId: company5.id, name: 'Kavita Sharma', phone: '+91 97200 66778', lastMessage: 'API specs shared via email', lastTime: '2:45 PM', unread: 0, isOnline: false },
    { companyId: company5.id, name: 'Dr. Sunita Joshi', phone: '+91 96300 77889', lastMessage: 'Patient data migration status?', lastTime: 'Yesterday', unread: 2, isOnline: false },
    { companyId: company5.id, name: 'Manish Agarwal', phone: '+91 95400 88990', lastMessage: 'Insurance integration meeting confirmed', lastTime: 'Mon', unread: 0, isOnline: true },
  ];

  // Create contacts and their messages
  const waMessagesData: Record<string, { content: string; direction: string; isRead: boolean; createdAt: Date }[]> = {
    'comp_abc_school_Priya Sharma': [
      { content: 'Hi! I wanted to know about the course timings.', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 60 * 60000) },
      { content: 'Hello Priya! The next batch starts from August 1st. Classes are from 6 PM to 8 PM.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 55 * 60000) },
      { content: 'That sounds great! What documents do I need to submit?', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 45 * 60000) },
      { content: 'You need to submit: 1) ID proof 2) Previous educational certificates 3) 2 passport photos', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 40 * 60000) },
      { content: 'Can I submit them online?', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 35 * 60000) },
      { content: 'Yes, you can email them to admissions@abcschool.com or WhatsApp them here.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 30 * 60000) },
      { content: 'Sure, I will send the documents tomorrow', direction: 'incoming', isRead: false, createdAt: new Date(now.getTime() - 15 * 60000) },
    ],
    'comp_abc_school_Amit Verma': [
      { content: 'Hi Amit, the corporate training schedule has been finalized.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 120 * 60000) },
      { content: 'That\'s great news! When does it start?', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 115 * 60000) },
      { content: 'Starting from August 10th. I\'ll share the detailed curriculum by EOD.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 110 * 60000) },
      { content: 'Thanks for the update!', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 100 * 60000) },
    ],
    'comp_abc_school_Sneha Patel': [
      { content: 'Hi Sneha, our meeting is scheduled for Thursday at 3 PM.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 24 * 3600000) },
      { content: 'Can we reschedule the meeting?', direction: 'incoming', isRead: false, createdAt: new Date(now.getTime() - 22 * 3600000) },
    ],
    'comp_abc_school_Rohit Gupta': [
      { content: 'Hi Rohit, please find the attached proposal for your review.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 28 * 3600000) },
      { content: 'The proposal looks great 👍', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 26 * 3600000) },
    ],
    'comp_xyz_realty_Sunita Mehta': [
      { content: 'Hi! I saw your Andheri listing. What is the per sq ft rate?', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 90 * 60000) },
      { content: 'The rate is ₹9,300 per sq ft. It\'s a premium project with all modern amenities.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 85 * 60000) },
      { content: 'When can I visit the property?', direction: 'incoming', isRead: false, createdAt: new Date(now.getTime() - 60 * 60000) },
    ],
    'comp_pqr_travel_Sanjay Kumar': [
      { content: 'We need a Goa resort for 40 people. March 15-17.', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 180 * 60000) },
      { content: 'I have 3 options: Taj Exotica, W Goa, and Grand Hyatt. All within budget.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 170 * 60000) },
      { content: 'Goa resort looks perfect!', direction: 'incoming', isRead: false, createdAt: new Date(now.getTime() - 120 * 60000) },
    ],
    'comp_def_tech_Arjun Menon': [
      { content: 'The API v2 auth is now working with refresh tokens.', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 240 * 60000) },
      { content: 'Let me test it out. Will update you in an hour.', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 230 * 60000) },
      { content: 'API token refresh is working now', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 60 * 60000) },
    ],
    'comp_mno_health_Dr. Ramesh Patel': [
      { content: 'We need EMR for our 200-bed hospital. Can we schedule a demo?', direction: 'incoming', isRead: true, createdAt: new Date(now.getTime() - 300 * 60000) },
      { content: 'Absolutely! How about Wednesday at 10 AM IST?', direction: 'outgoing', isRead: true, createdAt: new Date(now.getTime() - 290 * 60000) },
      { content: 'Wednesday 10 AM works for the demo', direction: 'incoming', isRead: false, createdAt: new Date(now.getTime() - 60 * 60000) },
    ],
  };

  for (const contactData of waContactsData) {
    const contactKey = `${contactData.companyId}_${contactData.name}`;
    const existingCount = await db.whatsAppContact.count({ where: { companyId: contactData.companyId, name: contactData.name } });
    if (existingCount === 0) {
      const contact = await db.whatsAppContact.create({
        data: {
          companyId: contactData.companyId,
          name: contactData.name,
          phone: contactData.phone,
          lastMessage: contactData.lastMessage,
          lastTime: contactData.lastTime,
          unread: contactData.unread,
          isOnline: contactData.isOnline,
        },
      });

      // Create messages for this contact
      const msgs = waMessagesData[contactKey];
      if (msgs) {
        for (const msg of msgs) {
          await db.whatsAppMessage.create({
            data: {
              contactId: contact.id,
              content: msg.content,
              direction: msg.direction,
              isRead: msg.isRead,
              createdAt: msg.createdAt,
            },
          });
        }
      }
    }
  }

  console.log('Seed data created successfully with Trovira Plan!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
