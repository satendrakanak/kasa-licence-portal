const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.licenseActivation.deleteMany();
  await prisma.license.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.lead.deleteMany();

  const passwordHash = await bcrypt.hash("Password@123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@kasa.test" },
    update: {
      name: "Kasa Admin",
      passwordHash,
    },
    create: {
      name: "Kasa Admin",
      email: "admin@kasa.test",
      passwordHash,
    },
  });

  await prisma.product.upsert({
    where: { slug: "kasa-enterprise" },
    update: {
      name: "Kasa Enterprise",
      description: "Full LMS, live classes, exams, certificates, notifications, and marketplace-ready modules.",
      status: "ACTIVE",
    },
    create: {
      name: "Kasa Enterprise",
      slug: "kasa-enterprise",
      description: "Full LMS, live classes, exams, certificates, notifications, and marketplace-ready modules.",
    },
  });

  await prisma.product.upsert({
    where: { slug: "kasa-starter-kit" },
    update: {
      name: "Kasa Starter Kit",
      description: "A focused starter edition for smaller academies and quick launches.",
      status: "ACTIVE",
    },
    create: {
      name: "Kasa Starter Kit",
      slug: "kasa-starter-kit",
      description: "A focused starter edition for smaller academies and quick launches.",
    },
  });

  console.log("\nSeed complete.");
  console.log("Admin login: admin@kasa.test / Password@123");
  console.log("Clean state: products kept, pricing/licenses/leads/activations/audits cleared.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
