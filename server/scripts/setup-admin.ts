import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function setupAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("\n❌ Error: User ID or email required\n");
    console.log("Usage:");
    console.log("  npm run setup-admin <user-id>");
    console.log("  npm run setup-admin <email>");
    console.log("\nExamples:");
    console.log("  npm run setup-admin 12345678");
    console.log("  npm run setup-admin admin@example.com\n");
    process.exit(1);
  }

  const identifier = args[0];
  
  try {
    let user;
    
    if (identifier.includes('@')) {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, identifier))
        .limit(1);
    } else {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, identifier))
        .limit(1);
    }

    if (!user) {
      console.error(`\n❌ Error: User not found with identifier: ${identifier}\n`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`\n✅ User is already an admin:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}\n`);
      process.exit(0);
    }

    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, user.id));

    console.log(`\n✅ Successfully promoted user to admin:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Previous Role: ${user.role}`);
    console.log(`   New Role: admin\n`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error setting up admin:", error);
    process.exit(1);
  }
}

setupAdmin();
