const API = "/api";
const state = { token: localStorage.getItem("cgb_token"), user: JSON.parse(localStorage.getItem("cgb_user") || "null"), ideas: [], mode: "signin" };
const $ = (id) => document.getElementById(id);
const authDialog = $("auth-dialog"), ideaDialog = $("idea-dialog"), detailDialog = $("detail-dialog");
$("year").textContent = new Date().getFullYear();

function escapeHTML(value="") { return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch])); }
function showNotice(message, error=false) { const el=$("notice"); el.textContent=message; el.classList.toggle("error",error); el.hidden=false; window.setTimeout(()=>{el.hidden=true;},4500); }
async function request(path, options={}) {
  const headers = { "Content-Type":"application/json", ...(options.headers||{}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(API+path, {...options, headers});
  const data = await response.json().catch(()=>({error:"The server returned an invalid response."}));
  if (!response.ok) {
    if (response.status===401 && state.token) logout(false);
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}
function updateNav() {
  const nav=$("nav-auth");
  if(state.user) nav.innerHTML=`<span class="author" style="align-self:center">Hi, ${escapeHTML(state.user.name)}</span><button class="btn btn-outline" id="logout-btn">Sign out</button>`;
  else nav.innerHTML='<button class="btn btn-outline" id="show-signin">Sign in</button><button class="btn btn-primary" id="show-signup">Join the board</button>';
  $("show-signin")?.addEventListener("click",()=>openAuth("signin"));
  $("show-signup")?.addEventListener("click",()=>openAuth("signup"));
  $("logout-btn")?.addEventListener("click",()=>logout());
}
function logout(notify=true) { state.token=null; state.user=null; localStorage.removeItem("cgb_token"); localStorage.removeItem("cgb_user"); updateNav(); renderIdeas(); if(notify) showNotice("You have signed out."); }
function openAuth(mode="signin") {
  state.mode=mode; $("auth-title").textContent=mode==="signup"?"Create your account":"Welcome back";
  $("auth-subtitle").textContent=mode==="signup"?"Join the community and share greener ideas.":"Sign in to support campus ideas.";
  $("name-wrap").hidden=mode!=="signup"; $("auth-name").required=mode==="signup";
  $("auth-password").autocomplete=mode==="signup"?"new-password":"current-password";
  $("auth-submit").textContent=mode==="signup"?"Create account":"Sign in";
  $("auth-switch").innerHTML=mode==="signup"?'Already registered? <button type="button" id="switch-to-signin">Sign in</button>':'New here? <button type="button" id="switch-to-signup">Create an account</button>';
  $("auth-error").hidden=true; authDialog.showModal();
  $("switch-to-signup")?.addEventListener("click",()=>openAuth("signup"));
  $("switch-to-signin")?.addEventListener("click",()=>openAuth("signin"));
}
function openIdea() { if(!state.user){openAuth("signin");showNotice("Please sign in before posting an idea.",true);return;} $("idea-error").hidden=true; $("idea-form").reset(); ideaDialog.showModal(); }
function statusClass(status){return status.toLowerCase().replace(/\s+/g,"-");}
function renderIdeas() {
  const search=$("search").value.trim().toLowerCase(), category=$("category-filter").value, status=$("status-filter").value, sort=$("sort-filter").value;
  let ideas=state.ideas.filter(i=>(!search||(i.title+" "+i.description+" "+i.category).toLowerCase().includes(search))&&(!category||i.category===category)&&(!status||i.status===status));
  ideas.sort((a,b)=>sort==="newest"?new Date(b.created_at)-new Date(a.created_at):sort==="oldest"?new Date(a.created_at)-new Date(b.created_at):(b.vote_count||0)-(a.vote_count||0));
  $("ideas-grid").innerHTML=ideas.map(i=>`<article class="idea-card">
    <div class="card-top"><span class="category">${escapeHTML(i.category)}</span><span class="status ${statusClass(i.status)}">${escapeHTML(i.status)}</span></div>
    <h3>${escapeHTML(i.title)}</h3><p class="description">${escapeHTML(i.description)}</p>
    <div class="card-meta">${new Date(i.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})} · ${i.comment_count||0} comments</div>
    <div class="card-footer"><span class="author">By ${escapeHTML(i.author_name||"Campus member")}</span><div class="card-actions"><button class="small-btn ${i.has_voted?"voted":""}" data-vote="${i.id}" aria-label="Vote for ${escapeHTML(i.title)}">♡ ${i.vote_count||0}</button><button class="small-btn" data-details="${i.id}">Details</button></div></div>
  </article>`).join("");
  $("empty-state").hidden=ideas.length!==0;
  if(!ideas.length)$("ideas-grid").innerHTML="";
  $("stat-ideas").textContent=state.ideas.length;
  $("stat-votes").textContent=state.ideas.reduce((sum,i)=>sum+(i.vote_count||0),0);
  $("stat-done").textContent=state.ideas.filter(i=>i.status==="Completed").length;
  document.querySelectorAll("[data-vote]").forEach(btn=>btn.addEventListener("click",()=>vote(btn.dataset.vote)));
  document.querySelectorAll("[data-details]").forEach(btn=>btn.addEventListener("click",()=>showDetails(btn.dataset.details)));
}
async function loadIdeas() {
  $("ideas-grid").innerHTML='<div class="loading">Growing the idea board…</div>';
  try { const data=await request("/ideas"); state.ideas=data.ideas||[]; renderIdeas(); }
  catch(e){$("ideas-grid").innerHTML="";showNotice(e.message,true);}
}
async function vote(id) {
  if(!state.user){openAuth("signin");showNotice("Sign in to vote for an idea.",true);return;}
  try {const result=await request(`/ideas/${id}/vote`,{method:"POST"});showNotice(result.message);await loadIdeas();}
  catch(e){showNotice(e.message,true);}
}
async function showDetails(id) {
  try {
    const data=await request(`/ideas/${id}`), idea=data.idea;
    const comments=data.comments||[];
    $("detail-content").innerHTML=`<span class="category">${escapeHTML(idea.category)}</span><span class="status ${statusClass(idea.status)}" style="margin-left:7px">${escapeHTML(idea.status)}</span><h2>${escapeHTML(idea.title)}</h2><p class="card-meta">Shared by ${escapeHTML(idea.author_name||"Campus member")} · ${new Date(idea.created_at).toLocaleDateString()}</p><p class="detail-body">${escapeHTML(idea.description)}</p>
      <div class="card-actions"><button class="small-btn ${idea.has_voted?"voted":""}" id="detail-vote">♡ ${idea.vote_count||0} support</button></div>
      ${state.user?.role==="admin"?`<div class="admin-panel"><label>Update idea status<select id="admin-status">${["New","Under review","In progress","Completed"].map(s=>`<option ${s===idea.status?"selected":""}>${s}</option>`).join("")}</select></label><button class="btn btn-primary" id="save-status">Save status</button><button class="btn btn-outline" id="delete-idea" style="margin-top:8px">Delete idea</button></div>`:""}
      <div class="comment-list"><h3>Community comments (${comments.length})</h3>${comments.length?comments.map(c=>`<div class="comment"><strong>${escapeHTML(c.author_name||"Campus member")} · ${new Date(c.created_at).toLocaleDateString()}</strong><p>${escapeHTML(c.body)}</p></div>`).join(""):'<p class="card-meta">No comments yet. Start the conversation.</p>'}
      ${state.user?'<form class="comment-form" id="comment-form"><input id="comment-body" required minlength="2" maxlength="600" placeholder="Add a helpful comment…"><button class="btn btn-primary" type="submit">Send</button></form>':'<p class="card-meta">Sign in to leave a comment.</p>'}</div>`;
    detailDialog.dataset.ideaId=id; detailDialog.showModal();
    $("detail-vote").addEventListener("click",async()=>{await vote(id);detailDialog.close();});
    $("comment-form")?.addEventListener("submit",async e=>{e.preventDefault();try{await request(`/ideas/${id}/comments`,{method:"POST",body:JSON.stringify({body:$("comment-body").value})});showNotice("Comment added.");await showDetails(id);await loadIdeas();}catch(err){showNotice(err.message,true);}});
    $("save-status")?.addEventListener("click",async()=>{try{await request(`/admin/ideas/${id}/status`,{method:"PATCH",body:JSON.stringify({status:$("admin-status").value})});showNotice("Idea status updated.");detailDialog.close();await loadIdeas();}catch(err){showNotice(err.message,true);}});
    $("delete-idea")?.addEventListener("click",async()=>{if(!confirm("Delete this idea and its related votes and comments?"))return;try{await request(`/admin/ideas/${id}`,{method:"DELETE"});showNotice("Idea deleted.");detailDialog.close();await loadIdeas();}catch(err){showNotice(err.message,true);}});
  } catch(e){showNotice(e.message,true);}
}
$("auth-form").addEventListener("submit",async e=>{
  e.preventDefault();const error=$("auth-error");error.hidden=true;
  const payload={email:$("auth-email").value.trim(),password:$("auth-password").value};
  if(state.mode==="signup")payload.name=$("auth-name").value.trim();
  try {const data=await request(`/auth/${state.mode}`,{method:"POST",body:JSON.stringify(payload)});state.token=data.token;state.user=data.user;localStorage.setItem("cgb_token",state.token);localStorage.setItem("cgb_user",JSON.stringify(state.user));authDialog.close();updateNav();showNotice(state.mode==="signup"?"Account created. Welcome to the board!":"Signed in successfully.");await loadIdeas();}
  catch(err){error.textContent=err.message;error.hidden=false;}
});
$("idea-form").addEventListener("submit",async e=>{
  e.preventDefault();const error=$("idea-error");error.hidden=true;
  try {await request("/ideas",{method:"POST",body:JSON.stringify({title:$("idea-title").value.trim(),description:$("idea-description").value.trim(),category:$("idea-category").value})});ideaDialog.close();showNotice("Your idea has been published!");await loadIdeas();}
  catch(err){error.textContent=err.message;error.hidden=false;}
});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
$("show-signin").addEventListener("click",()=>openAuth("signin"));$("show-signup").addEventListener("click",()=>openAuth("signup"));
["submit-idea","hero-submit","cta-submit"].forEach(id=>$(id).addEventListener("click",openIdea));
["search","category-filter","sort-filter","status-filter"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",renderIdeas));
async function start(){
  updateNav();
  if(state.token){try{const data=await request("/auth/me");state.user=data.user;localStorage.setItem("cgb_user",JSON.stringify(state.user));}catch{logout(false);}}
  await loadIdeas();
}
start();
