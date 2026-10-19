import bcrypt from "bcryptjs";
import {db} from "../lib/db";
async function main(){const email=process.env.FACILITATOR_EMAIL?.toLowerCase(),passwordHash=process.env.FACILITATOR_PASSWORD_HASH;if(!email||!passwordHash){throw new Error("Set FACILITATOR_EMAIL and FACILITATOR_PASSWORD_HASH before seeding. Never use a default facilitator password.")}const existing=await db.user.findUnique({where:{email}});if(existing){await db.user.update({where:{email},data:{role:"FACILITATOR",passwordHash}});console.log("Updated facilitator account role and password hash.");return;}await db.user.create({data:{name:"GDG Facilitator",email,passwordHash,role:"FACILITATOR"}});console.log("Created facilitator account.");}
main().finally(()=>db.$disconnect());
