const express = require("express");
const supabase = require("../supabase");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();
const CATEGORIES = ["Waste reduction", "Energy saving", "Water conservation", "Green spaces", "Transport", "Other"];
const STATUSES = ["New", "Under review", "In progress", "Completed"];

async function attachCounts(ideas, userId) {
  if (!ideas.length) return [];
  const ids = ideas.map(i => i.id);
  const [{ data: votes, error: voteError }, { data: comments, error: commentError }, { data: myVotes, error: myVoteError }] = await Promise.all([
    supabase.from("votes").select("idea_id").in("idea_id", ids),
    supabase.from("comments").select("idea_id").in("idea_id", ids),
    userId ? supabase.from("votes").select("idea_id").eq("user_id", userId).in("idea_id", ids) : Promise.resolve({ data: [], error: null })
  ]);
  if (voteError || commentError || myVoteError) throw voteError || commentError || myVoteError;
  return ideas.map(i => ({ ...i, vote_count: votes.filter(v=>v.idea_id===i.id).length, comment_count: comments.filter(c=>c.idea_id===i.id).length, has_voted: !!myVotes?.some(v=>v.idea_id===i.id) }));
}
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("ideas").select("id,title,description,category,status,created_at,author_id,author:users!ideas_author_id_fkey(name)").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    const mapped = (data||[]).map(i=>({...i,author_name:i.author?.name||"Campus member"}));
    const ideas = await attachCounts(mapped, req.user?.id || null);
    res.json({ ideas });
  } catch(error) { next(error); }
});
router.get("/:id", async (req, res, next) => {
  try {
    const { data: raw, error } = await supabase.from("ideas").select("id,title,description,category,status,created_at,author_id,author:users!ideas_author_id_fkey(name)").eq("id", req.params.id).maybeSingle();
    if (error) throw error;
    if (!raw) return res.status(404).json({ error: "Idea not found." });
    const [idea] = await attachCounts([{...raw,author_name:raw.author?.name||"Campus member"}], req.user?.id || null);
    const { data: comments, error: commentError } = await supabase.from("comments").select("id,body,created_at,author_id,author:users!comments_author_id_fkey(name)").eq("idea_id", req.params.id).order("created_at", {ascending:true}).limit(100);
    if (commentError) throw commentError;
    res.json({ idea, comments:(comments||[]).map(c=>({id:c.id,body:c.body,created_at:c.created_at,author_name:c.author?.name||"Campus member"})) });
  } catch(error) { next(error); }
});
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const title = typeof req.body.title==="string" ? req.body.title.trim() : "";
    const description = typeof req.body.description==="string" ? req.body.description.trim() : "";
    const category = req.body.category;
    if(title.length<5||title.length>120) return res.status(400).json({error:"Title must be 5–120 characters long."});
    if(description.length<20||description.length>1500) return res.status(400).json({error:"Description must be 20–1,500 characters long."});
    if(!CATEGORIES.includes(category)) return res.status(400).json({error:"Choose a valid category."});
    const {data,error}=await supabase.from("ideas").insert({title,description,category,author_id:req.user.id,status:"New"}).select("id").single();
    if(error) throw error;
    res.status(201).json({message:"Idea published.",id:data.id});
  } catch(error){next(error);}
});
router.post("/:id/vote", requireAuth, async (req,res,next)=>{
  try {
    const {data:idea,error:ideaError}=await supabase.from("ideas").select("id").eq("id",req.params.id).maybeSingle();
    if(ideaError)throw ideaError;if(!idea)return res.status(404).json({error:"Idea not found."});
    const {data:existing,error:lookupError}=await supabase.from("votes").select("id").eq("idea_id",req.params.id).eq("user_id",req.user.id).maybeSingle();
    if(lookupError)throw lookupError;
    if(existing){const {error}=await supabase.from("votes").delete().eq("id",existing.id);if(error)throw error;return res.json({message:"Your support was removed."});}
    const {error}=await supabase.from("votes").insert({idea_id:req.params.id,user_id:req.user.id});if(error){if(error.code==="23505")return res.status(409).json({error:"You have already voted for this idea."});throw error;}
    res.status(201).json({message:"Thanks for supporting this idea!"});
  }catch(error){next(error);}
});
router.post("/:id/comments", requireAuth, async(req,res,next)=>{
  try {
    const body=typeof req.body.body==="string"?req.body.body.trim():"";
    if(body.length<2||body.length>600)return res.status(400).json({error:"Comment must be 2–600 characters long."});
    const {data:idea,error:ideaError}=await supabase.from("ideas").select("id").eq("id",req.params.id).maybeSingle();
    if(ideaError)throw ideaError;if(!idea)return res.status(404).json({error:"Idea not found."});
    const {data,error}=await supabase.from("comments").insert({idea_id:req.params.id,author_id:req.user.id,body}).select("id").single();
    if(error)throw error;res.status(201).json({message:"Comment added.",id:data.id});
  }catch(error){next(error);}
});
module.exports={router,STATUSES};
