require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const supabase = require("./supabase");
const authRoutes = require("./routes/auth");
const { router: ideaRoutes } = require("./routes/ideas");
const adminRoutes = require("./routes/admin");
const { requireAuth } = require("./middleware/auth");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random string of at least 32 characters.");
}
const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"], imgSrc: ["'self'", "data:"], connectSrc: ["'self'"], objectSrc: ["'none'"], upgradeInsecureRequests: null } } }));
app.use(express.json({ limit: "20kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many authentication attempts. Please wait and try again." } }));
app.use("/api", (req,res,next)=>{ if(req.path.startsWith("/auth/"))return next(); next(); });
app.get("/api/health", (req,res)=>res.json({status:"ok",application:"Campus Green Ideas Board"}));
app.use("/api/auth", authRoutes);
// Optional authentication for public idea browsing: if a valid token exists, attach the account; otherwise browse anonymously.
app.use("/api/ideas", async(req,res,next)=>{
  const header=req.get("authorization")||"";
  if(!header.startsWith("Bearer "))return next();
  return requireAuth(req,res,next);
}, ideaRoutes);
app.use("/api/admin", adminRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("/{*path}", (req,res,next)=>{ if(req.path.startsWith("/api/"))return next();res.sendFile(path.join(__dirname,"..","frontend","index.html")); });
app.use((req,res)=>res.status(404).json({error:"The requested route was not found."}));
app.use((err,req,res,next)=>{
  console.error("Request failed:", err?.message || "Unknown error");
  if(res.headersSent)return next(err);
  res.status(500).json({error:"The server could not complete this request. Check server configuration and database availability."});
});

async function ensureAdmin() {
  const email=(process.env.ADMIN_EMAIL||"").trim().toLowerCase();
  const password=process.env.ADMIN_PASSWORD||"";
  if(!email||!password){console.warn("ADMIN_EMAIL/ADMIN_PASSWORD not set; automatic admin setup skipped.");return;}
  if(password.length<12)throw new Error("ADMIN_PASSWORD must be at least 12 characters long. Update backend/.env.");
  const {data:existing,error}=await supabase.from("users").select("id,role").eq("email",email).maybeSingle();
  if(error)throw error;
  if(existing){
    if(existing.role!=="admin"){const {error:updateError}=await supabase.from("users").update({role:"admin"}).eq("id",existing.id);if(updateError)throw updateError;}
    console.log(`Administrator account ready: ${email}`);
    return;
  }
  const hash=await bcrypt.hash(password,12);
  const {error:insertError}=await supabase.from("users").insert({name:"Campus Administrator",email,password_hash:hash,role:"admin"});
  if(insertError)throw insertError;
  console.log(`Administrator account created: ${email}`);
}
const port=Number(process.env.PORT)||3000;
ensureAdmin().then(()=>app.listen(port,()=>console.log(`Campus Green Ideas Board running at http://localhost:${port}`))).catch(error=>{console.error("Startup failed:",error.message);process.exit(1);});
