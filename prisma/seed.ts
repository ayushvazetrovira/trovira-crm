import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seed() {
  // Create Plans
  const starterPlan = await db.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: { name: 'Starter', price: 799, userLimit: 1, leadLimit: 500, isActive: true },
  });

  const businessPlan = await db.plan.upsert({
    where: { name: 'Business' },
    update: {},
    create: { name: 'Business', price: 1499, userLimit: 5, leadLimit: 5000, isActive: true },
  });

  const proPlan = await db.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: { name: 'Pro', price: 2999, userLimit: 15, leadLimit: 999999, isActive: true },
  });

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

  // Create sample companies
  const company1 = await db.company.upsert({
    where: { id: 'comp_abc_school' },
    update: {},
    create: {
      id: 'comp_abc_school',
      name: 'ABC School',
      contactPerson: 'Raj Sharma',
      mobile: '9876543210',
      email: 'info@abcschool.com',
      planId: starterPlan.id,
      status: 'active',
    },
  });

  const company2 = await db.company.upsert({
    where: { id: 'comp_xyz_realty' },
    update: {},
    create: {
      id: 'comp_xyz_realty',
      name: 'XYZ Realty',
      contactPerson: 'Amit Patel',
      mobile: '9786543210',
      email: 'info@xyzrealty.com',
      planId: businessPlan.id,
      status: 'active',
    },
  });

  const company3 = await db.company.upsert({
    where: { id: 'comp_pqr_travel' },
    update: {},
    create: {
      id: 'comp_pqr_travel',
      name: 'PQR Travel',
      contactPerson: 'Neha Shah',
      mobile: '9686543210',
      email: 'info@pqrtravel.com',
      planId: proPlan.id,
      status: 'active',
    },
  });

  const company4 = await db.company.upsert({
    where: { id: 'comp_def_tech' },
    update: {},
    create: {
      id: 'comp_def_tech',
      name: 'DEF Technologies',
      contactPerson: 'Vikram Singh',
      mobile: '9987654321',
      email: 'info@deftech.com',
      planId: starterPlan.id,
      status: 'active',
    },
  });

  const company5 = await db.company.upsert({
    where: { id: 'comp_mno_health' },
    update: {},
    create: {
      id: 'comp_mno_health',
      name: 'MNO Healthcare',
      contactPerson: 'Dr. Anita Desai',
      mobile: '9876543212',
      email: 'info@mnohealth.com',
      planId: businessPlan.id,
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

  // Create subscriptions
  const now = new Date();
  await db.subscription.upsert({
    where: { id: 'sub_abc' },
    update: {},
    create: {
      id: 'sub_abc',
      companyId: company1.id,
      planId: starterPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      expiryDate: new Date(now.getFullYear(), now.getMonth() + 1, 30),
      status: 'active',
    },
  });

  await db.subscription.upsert({
    where: { id: 'sub_xyz' },
    update: {},
    create: {
      id: 'sub_xyz',
      companyId: company2.id,
      planId: businessPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 10),
      expiryDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      status: 'active',
    },
  });

  await db.subscription.upsert({
    where: { id: 'sub_pqr' },
    update: {},
    create: {
      id: 'sub_pqr',
      companyId: company3.id,
      planId: proPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      expiryDate: new Date(now.getFullYear(), now.getMonth(), 1),
      status: 'expired',
    },
  });

  await db.subscription.upsert({
    where: { id: 'sub_def' },
    update: {},
    create: {
      id: 'sub_def',
      companyId: company4.id,
      planId: starterPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 5),
      expiryDate: new Date(now.getFullYear(), now.getMonth() + 2, 5),
      status: 'active',
    },
  });

  await db.subscription.upsert({
    where: { id: 'sub_mno' },
    update: {},
    create: {
      id: 'sub_mno',
      companyId: company5.id,
      planId: businessPlan.id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      expiryDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      status: 'active',
    },
  });

  // Create payments
  await db.payment.upsert({
    where: { id: 'pay_1' },
    update: {},
    create: { id: 'pay_1', companyId: company1.id, planId: starterPlan.id, amount: 799, method: 'UPI', status: 'paid' },
  });

  await db.payment.upsert({
    where: { id: 'pay_2' },
    update: {},
    create: { id: 'pay_2', companyId: company2.id, planId: businessPlan.id, amount: 1499, method: 'Bank', status: 'paid' },
  });

  await db.payment.upsert({
    where: { id: 'pay_3' },
    update: {},
    create: { id: 'pay_3', companyId: company3.id, planId: proPlan.id, amount: 2999, method: 'UPI', status: 'pending' },
  });

  await db.payment.upsert({
    where: { id: 'pay_4' },
    update: {},
    create: { id: 'pay_4', companyId: company4.id, planId: starterPlan.id, amount: 799, method: 'Card', status: 'paid' },
  });

  await db.payment.upsert({
    where: { id: 'pay_5' },
    update: {},
    create: { id: 'pay_5', companyId: company5.id, planId: businessPlan.id, amount: 1499, method: 'UPI', status: 'paid' },
  });

  // Create sample leads for company1 (ABC School)
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
      subject: 'Plan upgrade request',
      issue: 'We would like to upgrade from Pro plan to a custom enterprise plan.',
      status: 'open',
      priority: 'low',
    },
  });

  // Create followups using actual lead IDs
  const company1Leads = await db.lead.findMany({ where: { companyId: company1.id }, take: 4, select: { id: true } });
  const company2Leads = await db.lead.findMany({ where: { companyId: company2.id }, take: 1, select: { id: true } });
  const todayStr = now.toISOString().split('T')[0];

  if (company1Leads.length >= 4) {
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
  if (company2Leads.length >= 1) {
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

  console.log('Seed data created successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
