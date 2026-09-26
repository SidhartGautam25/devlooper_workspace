import bcrypt from "bcryptjs";
import { LeadStatus, PrismaClient, Role, TaskPriority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingSuperuser = await prisma.user.findFirst({
    where: { role: Role.SUPERUSER },
  });

  const passwordHash = await bcrypt.hash("Password@123", 10);

  const superuser =
    existingSuperuser ??
    (await prisma.user.create({
      data: {
        name: "System Administrator",
        email: "admin@agency.com",
        passwordHash,
        role: Role.SUPERUSER,
        phone: "+1 (555) 010-0001",
        isActive: true,
      },
    }));

  let employee = await prisma.user.findUnique({
    where: { email: "employee@agency.com" },
  });

  if (!employee) {
    employee = await prisma.user.create({
      data: {
        name: "Alex Rivera",
        email: "employee@agency.com",
        passwordHash,
        role: Role.EMPLOYEE,
        phone: "+1 (555) 010-0042",
        isActive: true,
      },
    });
  }

  const taskCount = await prisma.task.count();
  if (taskCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: "Kickoff website redesign",
          description: "Prepare sitemap and first-pass wireframes for the new marketing site.",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          createdById: superuser.id,
          assignedToId: employee.id,
        },
        {
          title: "Follow up with inbound campaign leads",
          description: "Call the three leads from last week's paid campaign.",
          status: TaskStatus.TODO,
          priority: TaskPriority.URGENT,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
          createdById: superuser.id,
          assignedToId: employee.id,
        },
        {
          title: "Archive completed Q2 reports",
          description: "Move finalized reports into the shared drive.",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.LOW,
          createdById: superuser.id,
          assignedToId: employee.id,
        },
      ],
    });
  }

  const leadCount = await prisma.lead.count();
  if (leadCount === 0) {
    await prisma.lead.createMany({
      data: [
        {
          name: "Jordan Blake",
          email: "jordan.blake@example.com",
          phone: "+1 (555) 201-8890",
          source: "Website",
          service: "Brand Identity",
          status: LeadStatus.NEW,
          notes: "Requested a full identity system for a fintech startup.",
          budget: "$15k–$25k",
          assignedToId: employee.id,
        },
        {
          name: "Samira Patel",
          email: "samira.patel@example.com",
          phone: "+1 (555) 441-2208",
          source: "Referral",
          service: "Web Development",
          status: LeadStatus.CONTACTED,
          notes: "Had an intro call. Waiting on tech stack preferences.",
          budget: "$40k",
          assignedToId: employee.id,
        },
        {
          name: "Chris Nguyen",
          email: "chris.nguyen@example.com",
          phone: "+1 (555) 902-1144",
          source: "Campaign",
          service: "SEO Retainer",
          status: LeadStatus.QUALIFIED,
          notes: "Unassigned inbound lead from the spring campaign.",
          budget: "$3k/mo",
          assignedToId: null,
        },
      ],
    });
  }

  console.log("Seed complete:", {
    superuser: superuser.email,
    employee: employee.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
