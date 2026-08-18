import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not defined");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const permissions = [
  "users.read","users.create","users.update","users.delete",
  "roles.read","roles.create","roles.update","roles.delete",
  "permissions.read","permissions.manage",
  "rooms.read","rooms.create","rooms.update","rooms.delete",
  "messages.read","messages.create","messages.update","messages.delete",
  "notifications.read","notifications.manage",
  "subscriptions.read","subscriptions.manage",
  "payments.read","payments.manage",
  "settings.read","settings.manage",
  "admin.users.read","admin.users.manage","admin.settings.read","admin.settings.manage",
  "admin.analytics.read","admin.subscribers.manage","admin.payments.manage","admin.plans.manage",
  "contacts.read","contacts.manage","groups.read","groups.create","groups.manage",
  "communities.read","communities.create","communities.manage",
  "status.read","status.create","status.manage","search.read","audit.read"
];

const roles: Record<string,string[]> = {
  platform_admin: permissions,
  group_admin: ["users.read","rooms.read","rooms.create","rooms.update","rooms.delete","messages.read","messages.create","messages.update","messages.delete","notifications.read","contacts.read","contacts.manage","groups.read","groups.create","groups.manage","communities.read","communities.create","communities.manage","status.read","status.create","status.manage","search.read"],
  user: ["users.read","rooms.read","rooms.create","messages.read","messages.create","messages.update","messages.delete","notifications.read","contacts.read","contacts.manage","status.read","status.create","status.manage","search.read","subscriptions.read","payments.read"],
  guest: ["rooms.read","messages.read","notifications.read","search.read"]
};

async function main() {
  for (const name of permissions) {
    await prisma.permission.upsert({ where:{name}, update:{description:`FedChat ${name}`}, create:{name,description:`FedChat ${name}`} });
  }
  for (const [name, allowed] of Object.entries(roles)) {
    const role = await prisma.role.upsert({ where:{name}, update:{description:`FedChat ${name}`}, create:{name,description:`FedChat ${name}`} });
    const allowedRows = await prisma.permission.findMany({ where:{name:{in:allowed}}, select:{id:true} });
    await prisma.rolePermission.deleteMany({ where:{roleId:role.id, permissionId:{notIn:allowedRows.map(x=>x.id)}} });
    for (const perm of allowedRows) await prisma.rolePermission.upsert({ where:{roleId_permissionId:{roleId:role.id,permissionId:perm.id}}, update:{}, create:{roleId:role.id,permissionId:perm.id} });
  }

  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || "admin@fedchat.local";
  const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD || "Admin@12345";
  const adminRole = await prisma.role.findUniqueOrThrow({ where:{name:"platform_admin"} });
  await prisma.user.upsert({
    where:{email:adminEmail},
    update:{roleId:adminRole.id},
    create:{email:adminEmail,username:"platformadmin",passwordHash:await bcrypt.hash(adminPassword,12),firstName:"Platform",lastName:"Admin",roleId:adminRole.id}
  });

  const testEmail = process.env.TEST_USER_EMAIL || "test@fedchat.local";
  const testPassword = process.env.TEST_USER_PASSWORD || "Test@12345";
  const userRole = await prisma.role.findUniqueOrThrow({ where:{name:"user"} });
  await prisma.user.upsert({
    where:{email:testEmail},
    update:{roleId:userRole.id},
    create:{email:testEmail,username:"testuser",passwordHash:await bcrypt.hash(testPassword,12),firstName:"Test",lastName:"User",roleId:userRole.id}
  });

  // Development conversation so the seeded test user can immediately verify
  // the chat UI and Socket.IO flow after signing in.
  const existingRoom = await prisma.room.findFirst({ where: { name: "Test Conversation" } });
  const room = existingRoom ?? await prisma.room.create({
    data: {
      name: "Test Conversation",
      description: "Local FedChat demo conversation",
      isPrivate: true,
      createdById: (await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } })).id,
    },
  });
  const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
  const testUser = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
  await prisma.roomMember.upsert({ where: { roomId_userId: { roomId: room.id, userId: adminUser.id } }, update: {}, create: { roomId: room.id, userId: adminUser.id } });
  await prisma.roomMember.upsert({ where: { roomId_userId: { roomId: room.id, userId: testUser.id } }, update: {}, create: { roomId: room.id, userId: testUser.id } });
  const demoMessage = await prisma.message.findFirst({ where: { roomId: room.id } });
  if (!demoMessage) {
    await prisma.message.create({ data: { roomId: room.id, senderId: adminUser.id, content: "Welcome to FedChat. Send a message — it should appear instantly without refreshing.", messageType: "text" } });
  }

  const plans = [
    {name:"Basic",description:"Groups for small communities",price:199,durationDays:30,accessLevel:"FULL" as const,maxGroups:2,maxMembersPerGroup:100,maxCommunities:1,maxGuestsPerGroup:20},
    {name:"Pro",description:"More groups, members and storage",price:499,durationDays:30,accessLevel:"FULL" as const,maxGroups:10,maxMembersPerGroup:500,maxCommunities:5,maxGuestsPerGroup:100},
    {name:"Business",description:"Large communities and advanced limits",price:999,durationDays:30,accessLevel:"FULL" as const,maxGroups:50,maxMembersPerGroup:2000,maxCommunities:20,maxGuestsPerGroup:500}
  ];
  for (const plan of plans) {
    // SubscriptionPlan.name is not a unique field in the current database schema,
    // so do not use it in a Prisma upsert where-clause. Find the plan by name and
    // update it when it exists; otherwise create it.
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name },
      select: { id: true },
    });

    if (existingPlan) {
      await prisma.subscriptionPlan.update({
        where: { id: existingPlan.id },
        data: plan,
      });
    } else {
      await prisma.subscriptionPlan.create({ data: plan });
    }
  }

  const existing = await prisma.paymentMethod.findFirst({where:{name:"UPI"}});
  if(!existing) await prisma.paymentMethod.create({data:{name:"UPI",type:"UPI",description:"Default manual UPI payment method. Configure the UPI ID in Admin Console.",isDefault:true}});
  else await prisma.paymentMethod.update({where:{id:existing.id},data:{type:"UPI",isDefault:true,isActive:true}});
  await prisma.paymentMethod.updateMany({where:{id:{not:existing?.id || "00000000-0000-0000-0000-000000000000"}},data:{isDefault:false}});
  const settings = [
    ["site.name","FedChat"],["site.registrationEnabled",true],["site.guestJoinEnabled",true],["site.maintenanceMode",false],["upload.maxMb",100]
  ] as const;
  for(const [key,value] of settings) await prisma.siteSetting.upsert({where:{key},update:{value},create:{key,value}});
  console.log(`Seed complete.`);
  console.log(`Platform admin: ${adminEmail}`);
  console.log(`Test user: ${testEmail}`);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
