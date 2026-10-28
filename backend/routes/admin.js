const express = require("express");
const supabase = require("../supabase");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { STATUSES } = require("./ideas");
const router = express.Router();
router.use(requireAuth, requireAdmin);
router.patch("/ideas/:id/status", async(req,res,next)=>{
  try {
    if(!STATUSES.includes(req.body.status))return res.status(400).json({error:"Choose a valid status."});
    const {data,error}=await supabase.from("ideas").update({status:req.body.status}).eq("id",req.params.id).select("id,status").maybeSingle();
    if(error)throw error;if(!data)return res.status(404).json({error:"Idea not found."});
    res.json({message:"Idea status updated.",idea:data});
  }catch(error){next(error);}
});
router.delete("/ideas/:id",async(req,res,next)=>{
  try{
    const {data,error}=await supabase.from("ideas").delete().eq("id",req.params.id).select("id").maybeSingle();
    if(error)throw error;if(!data)return res.status(404).json({error:"Idea not found."});
    res.json({message:"Idea deleted."});
  }catch(error){next(error);}
});
module.exports=router;
