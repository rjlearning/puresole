import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function removeAdminUser() {
  try {
    console.log("Removing admin privileges from admin.test@example.com...");
    
    const result = await db
      .update(users)
      .set({ isAdmin: false })
      .where(eq(users.email, "admin.test@example.com"))
      .returning({ 
        id: users.id, 
        email: users.email, 
        isAdmin: users.isAdmin 
      });

    if (result.length === 0) {
      console.log("❌ User not found: admin.test@example.com");
    } else {
      console.log("✅ Admin privileges removed successfully!");
      console.log("User:", result[0].email);
      console.log("Is Admin:", result[0].isAdmin);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error removing admin privileges:", error);
    process.exit(1);
  }
}

removeAdminUser();
