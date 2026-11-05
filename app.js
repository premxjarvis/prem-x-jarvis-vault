(() => {
  const $ = (id) => document.getElementById(id);
  const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("PASTE_") && !window.SUPABASE_ANON_KEY.includes("PASTE_");
  const client = configured && window.supabase
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  let mode = "login";
  let pendingEmail = "";
  let editingId = null;
  const authView = $("authView"), vaultView = $("vaultView");
  const message = (text, ok=false) => { $("message").textContent = text; $("message").className = "message" + (ok ? " success" : ""); };
  const showOtp = (email) => {
    pendingEmail = email;
    $("otpEmail").textContent = email;
    $("authForm").classList.add("hidden");
    $("otpView").classList.remove("hidden");
    $("otpGrid").querySelectorAll("input").forEach(i => i.value = "");
    $("otpGrid").querySelector("input").focus();
    message("");
  };
  const showAuth = () => { authView.classList.remove("hidden"); vaultView.classList.add("hidden"); };
  const showVault = async () => {
    authView.classList.add("hidden"); vaultView.classList.remove("hidden");
    await loadNotes();
  };
  const setMode = (next) => {
    mode = next;
    $("loginTab").classList.toggle("active", mode === "login");
    $("signupTab").classList.toggle("active", mode === "signup");
    $("confirmWrap").classList.toggle("hidden", mode !== "signup");
    $("forgotButton").classList.toggle("hidden", mode !== "login");
    $("formTitle").textContent = mode === "login" ? "Access your vault" : "Create your account";
    $("formDescription").textContent = mode === "login" ? "Sign in to continue to your private space." : "Create an account using your email address.";
    $("submitAuth").innerHTML = mode === "login" ? 'LOGIN TO VAULT <span>↗</span>' : 'CREATE ACCOUNT <span>↗</span>';
    $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
    message("");
  };

  $("loginTab").addEventListener("click", () => setMode("login"));
  $("signupTab").addEventListener("click", () => setMode("signup"));
  $("submitAuth").addEventListener("click", async () => {
    if (!client) return message("Setup needed: add your Supabase URL and anon/publishable key in config.js.");
    const email = $("email").value.trim(), password = $("password").value;
    if (!email || !password) return message("Enter your email and password.");
    if (mode === "signup") {
      if (password.length < 8) return message("Use a password with at least 8 characters.");
      if (password !== $("confirmPassword").value) return message("Passwords do not match.");
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return message(error.message);
      if (data.session) return showVault();
      showOtp(email);
      message("Account created. Check your email for the verification code.");
    } else {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return message(error.message);
      if (data.session) await showVault();
    }
  });

  const otpInputs = [...$("otpGrid").querySelectorAll("input")];
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(-1);
      if (input.value && index < 5) otpInputs[index + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) otpInputs[index - 1].focus();
      if (e.key === "ArrowLeft" && index > 0) otpInputs[index - 1].focus();
      if (e.key === "ArrowRight" && index < 5) otpInputs[index + 1].focus();
    });
    input.addEventListener("paste", (e) => {
      const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0,6);
      if (!digits) return;
      e.preventDefault();
      digits.split("").forEach((d,i) => otpInputs[i].value = d);
      otpInputs[Math.min(digits.length,5)].focus();
    });
  });
  $("verifyOtp").addEventListener("click", async () => {
    if (!client) return message("Supabase setup is not complete yet.");
    const token = otpInputs.map(i => i.value).join("");
    if (token.length !== 6) return message("Enter all 6 digits.");
    const { data, error } = await client.auth.verifyOtp({ email: pendingEmail, token, type: "signup" });
    if (error) return message(error.message);
    if (data.session) await showVault();
    else message("Email verified. Now log in with your email and password.", true);
  });
  $("resendOtp").addEventListener("click", async () => {
    if (!client) return message("Supabase setup is not complete yet.");
    const { error } = await client.auth.resend({ type: "signup", email: pendingEmail });
    message(error ? error.message : "Verification email requested. Check your inbox.", !error);
  });
  $("backToAuth").addEventListener("click", () => { $("otpView").classList.add("hidden"); $("authForm").classList.remove("hidden"); setMode("login"); });
  $("forgotButton").addEventListener("click", async () => {
    if (!client) return message("Setup needed: add Supabase settings first.");
    const email = $("email").value.trim();
    if (!email) return message("Enter your email first.");
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    message(error ? error.message : "Password reset email requested. Check your inbox.", !error);
  });
  $("logoutButton").addEventListener("click", async () => {
    if (client) await client.auth.signOut();
    showAuth();
  });

  async function loadNotes() {
    if (!client) return;
    const { data, error } = await client.from("vault_notes").select("id,title,content,created_at,updated_at").order("created_at", { ascending: false });
    if (error) { $("notesContainer").innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; return; }
    $("noteCount").textContent = data.length;
    if (!data.length) { $("notesContainer").innerHTML = '<div class="empty">No notes yet. Create your first private note.</div>'; return; }
    $("notesContainer").innerHTML = data.map(n => `<article class="note-card"><h3>${escapeHtml(n.title || "Untitled")}</h3><p>${escapeHtml(n.content || "")}</p><div class="note-actions"><button data-edit="${n.id}">EDIT</button><button data-delete="${n.id}">DELETE</button></div></article>`).join("");
    $("notesContainer").querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editNote(data.find(n => n.id === b.dataset.edit))));
    $("notesContainer").querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => deleteNote(b.dataset.delete)));
  }
  function editNote(note) {
    editingId = note.id; $("noteTitle").value = note.title || ""; $("noteContent").value = note.content || "";
    $("editorTitle").textContent = "Edit your note"; $("saveNote").innerHTML = 'UPDATE NOTE <span>↗</span>'; $("cancelEdit").classList.remove("hidden");
    $("noteTitle").focus();
  }
  $("cancelEdit").addEventListener("click", resetEditor);
  function resetEditor() { editingId = null; $("noteTitle").value = ""; $("noteContent").value = ""; $("editorTitle").textContent = "Create a note"; $("saveNote").innerHTML = 'SAVE NOTE <span>＋</span>'; $("cancelEdit").classList.add("hidden"); }
  $("saveNote").addEventListener("click", async () => {
    if (!client) return;
    const title = $("noteTitle").value.trim(), content = $("noteContent").value.trim();
    if (!title || !content) return alert("Add a title and note content first.");
    const payload = { title, content, updated_at: new Date().toISOString() };
    const result = editingId
      ? await client.from("vault_notes").update(payload).eq("id", editingId)
      : await client.from("vault_notes").insert(payload);
    if (result.error) return alert(result.error.message);
    resetEditor(); await loadNotes();
  });
  async function deleteNote(id) {
    if (!confirm("Delete this note permanently?")) return;
    const { error } = await client.from("vault_notes").delete().eq("id", id);
    if (error) return alert(error.message);
    await loadNotes();
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }

  if (client) {
    client.auth.getSession().then(({ data }) => { if (data.session) showVault(); });
    client.auth.onAuthStateChange((_event, session) => { if (session) showVault(); });
  } else {
    message("Preview mode: connect your Supabase project to enable accounts and private notes.");
  }
})();
