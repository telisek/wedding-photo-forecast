(function(){
  "use strict";

  const D = window.WPF_DATA;
  if (!D) {
    console.error("Wedding Photo Forecast: WPF_DATA is missing.");
    return;
  }

  const ROOT = document.querySelector("[data-wpf-quiz]");
  if (!ROOT) return;

  const coupleStyles = [
    "Bright and bold",
    "Neutral and natural",
    "Classic and timeless",
    "Vintage and charming",
    "Chic and modern"
  ];

  const photoStyles = [
    ["Editorial","Polished, magazine-worthy photographs with artistic posing, thoughtful composition, and a high-fashion feel."],
    ["Documentary","Authentic storytelling that captures your wedding day naturally as it unfolds, without directing or staging moments."],
    ["Candid","Spontaneous, unposed photographs capturing genuine laughter, emotions, and the little moments in between."]
  ];

  const months = Object.keys(D.seasonResults);

  const priorityDisplay = {
    "Immediate family (Parents, Grandparents, Siblings)":"Immediate family (Parents, Grandparents, Siblings)",
    "College friends":"College friends",
    "Wedding party":"Wedding party",
    "Venue":"Venue",
    "Fashion/details":"Fashion/details",
    "Ceremony emotion":"Ceremony emotion",
    "Couple portraits":"Couple portraits",
    "Reception energy":"Reception energy",
    "Guests":"Guests",
    "Family traditions":"Family traditions",
    "Cultural/religious moments":"Cultural/religious moments"
  };

  const state = {
    step:0,
    venue:"",
    coupleStyle:"",
    month:"",
    photoStyle:"",
    priorities:[],
    other:"",
    result:null
  };

  let flodeskInitialized = false;

  function esc(s){
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    })[c]);
  }

  function optionRadio(name, value, label, description){
    return `
      <label class="wpf-option">
        <input type="radio" name="${esc(name)}" value="${esc(value)}">
        <div><strong>${esc(label)}</strong>${description ? `<span>${esc(description)}</span>` : ""}</div>
      </label>`;
  }

  function optionCheckbox(value, label, extra=""){
    return `
      <label class="wpf-option">
        <input type="checkbox" name="wpf-priority" value="${esc(value)}">
        <div><strong>${esc(label)}</strong>${extra ? `<span>${esc(extra)}</span>` : ""}</div>
      </label>`;
  }

  const venueOptions = D.venues
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name))
    .map(v=>`<option value="${esc(v.name)}">${esc(v.name)}</option>`)
    .join("");

  ROOT.innerHTML = `
    <div id="wpf-app">
      <div class="wpf-shell">
        <section id="wpf-quiz-panel">
          <header class="wpf-header">
            <p class="wpf-eyebrow">Interactive Wedding Quiz</p>
            <h1 class="wpf-title">Your Wedding Photo Forecast</h1>
            <p class="wpf-intro">Tell us a little about your venue, season, and the photographs you care about most. Your forecast combines all three into a personalized wedding photography profile.</p>
          </header>

          <div class="wpf-progress-wrap">
            <div class="wpf-progress-meta">
              <span id="wpf-progress-label">Question 1 of 5</span>
              <span id="wpf-progress-percent">20%</span>
            </div>
            <div class="wpf-progress" aria-hidden="true"><div class="wpf-progress-bar" id="wpf-progress-bar"></div></div>
          </div>

          <div class="wpf-body">
            <section class="wpf-step is-active" data-step="0">
              <p class="wpf-category">Venue Vibes</p>
              <h2 class="wpf-question">Where are you getting married?</h2>
              <p class="wpf-help">Choose your wedding venue from the list.</p>
              <select class="wpf-select" id="wpf-venue">
                <option value="">Select your venue</option>
                ${venueOptions}
              </select>
              <div class="wpf-error" aria-live="polite"></div>
            </section>

            <section class="wpf-step" data-step="1">
              <p class="wpf-category">Venue Vibes</p>
              <h2 class="wpf-question">Our wedding couple personality would be…</h2>
              <div class="wpf-options">
                ${coupleStyles.map(x=>optionRadio("wpf-couple-style",x,x)).join("")}
              </div>
              <div class="wpf-error" aria-live="polite"></div>
            </section>

            <section class="wpf-step" data-step="2">
              <p class="wpf-category">Seasonal Forecast</p>
              <h2 class="wpf-question">What month are you planning your wedding?</h2>
              <select class="wpf-select" id="wpf-month">
                <option value="">Select a month</option>
                ${months.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join("")}
              </select>
              <div class="wpf-error" aria-live="polite"></div>
            </section>

            <section class="wpf-step" data-step="3">
              <p class="wpf-category">Photo Personality</p>
              <h2 class="wpf-question">What type of wedding photography style do you most appreciate?</h2>
              <div class="wpf-options">
                ${photoStyles.map(x=>optionRadio("wpf-photo-style",x[0],x[0],x[1])).join("")}
              </div>
              <div class="wpf-error" aria-live="polite"></div>
            </section>

            <section class="wpf-step" data-step="4">
              <p class="wpf-category">Photo Personality</p>
              <h2 class="wpf-question">Twenty years from now, which photographs would devastate you if they didn’t exist?</h2>
              <p class="wpf-help">Choose exactly 3. These priorities determine your Photo Personality result.</p>
              <div class="wpf-priority-count" id="wpf-priority-count">0 of 3 selected</div>
              <div class="wpf-options" id="wpf-priority-options">
                ${D.photoPriorityOrder.map(p=>optionCheckbox(p,priorityDisplay[p])).join("")}
                ${optionCheckbox("__other__","Other","Optional — tell us what matters to you. This does not change the scored result.")}
              </div>
              <div class="wpf-other-wrap" id="wpf-other-wrap">
                <input class="wpf-field" id="wpf-other-text" type="text" placeholder="What else is important to you?">
              </div>
              <div class="wpf-error" aria-live="polite"></div>
            </section>

            <div class="wpf-actions">
              <button class="wpf-btn wpf-btn-secondary" type="button" id="wpf-back">Back</button>
              <button class="wpf-btn wpf-btn-primary" type="button" id="wpf-next">Next</button>
            </div>
          </div>
        </section>

        <section class="wpf-results" id="wpf-results" aria-live="polite">
          <div class="wpf-results-hero">
            <p class="wpf-eyebrow">Your Overall Wedding Photo Forecast</p>
            <h2 class="wpf-results-title" id="wpf-composite"></h2>
            <p class="wpf-results-sub">Your forecast combines the visual character of your venue, the seasonal conditions surrounding your date, and the moments you most want your photographs to preserve.</p>
            <div class="wpf-chips" id="wpf-composite-chips"></div>
          </div>

          <div class="wpf-result-grid">
            <article class="wpf-card">
              <p class="wpf-card-label">Venue Vibes</p>
              <h3 id="wpf-venue-title"></h3>
              <p id="wpf-venue-description"></p>
            </article>

            <article class="wpf-card">
              <p class="wpf-card-label">Seasonal Forecast</p>
              <h3 id="wpf-season-title"></h3>
              <div class="wpf-stats" id="wpf-season-stats"></div>
              <p id="wpf-season-description"></p>
            </article>

            <article class="wpf-card">
              <p class="wpf-card-label">Photo Personality</p>
              <h3 id="wpf-photo-title"></h3>
              <div class="wpf-chips" id="wpf-photo-priorities"></div>
              <p id="wpf-photo-description" style="margin-top:14px"></p>
            </article>
          </div>

          <section class="wpf-email">
            <h3>Want inspiration tailored to your forecast?</h3>
            <p>Enter your email below to receive personalized image inspiration that matches your venue vibe, season, and photo personality.</p>
            <div id="fd-form-6ac966f38b2745cb6a785c8e"></div>
            <div class="wpf-form-status" id="wpf-form-status"></div>
          </section>

          <div class="wpf-retake">
            <button class="wpf-btn wpf-btn-secondary" type="button" id="wpf-retake">Retake the quiz</button>
          </div>
        </section>
      </div>
    </div>`;

  const $ = sel => ROOT.querySelector(sel);
  const $$ = sel => [...ROOT.querySelectorAll(sel)];

  function getStepEl(){ return $(`.wpf-step[data-step="${state.step}"]`); }
  function setError(msg=""){
    const el = getStepEl()?.querySelector(".wpf-error");
    if (el) el.textContent = msg;
  }

  function syncStateFromUI(){
    state.venue = $("#wpf-venue").value;
    state.coupleStyle = $('input[name="wpf-couple-style"]:checked')?.value || "";
    state.month = $("#wpf-month").value;
    state.photoStyle = $('input[name="wpf-photo-style"]:checked')?.value || "";
    state.priorities = $$('input[name="wpf-priority"]:checked')
      .map(x=>x.value)
      .filter(x=>x !== "__other__");
    state.other = $("#wpf-other-text").value.trim();
  }

  function validateStep(){
    syncStateFromUI();
    setError("");
    if (state.step === 0 && !state.venue) return setError("Please select your venue."), false;
    if (state.step === 1 && !state.coupleStyle) return setError("Please select your couple personality."), false;
    if (state.step === 2 && !state.month) return setError("Please select your wedding month."), false;
    if (state.step === 3 && !state.photoStyle) return setError("Please select a photography style."), false;
    if (state.step === 4 && state.priorities.length !== 3) return setError("Please choose exactly 3 photography priorities."), false;
    return true;
  }

  function updateStep(){
    $$(".wpf-step").forEach((el,i)=>el.classList.toggle("is-active", i===state.step));
    const pct = Math.round(((state.step+1)/5)*100);
    $("#wpf-progress-label").textContent = `Question ${state.step+1} of 5`;
    $("#wpf-progress-percent").textContent = `${pct}%`;
    $("#wpf-progress-bar").style.width = `${pct}%`;
    $("#wpf-back").style.visibility = state.step===0 ? "hidden" : "visible";
    $("#wpf-next").textContent = state.step===4 ? "See My Forecast" : "Next";
    setError("");
    getStepEl()?.querySelector("select,input")?.focus({preventScroll:true});
  }

  function venueRecord(){
    return D.venues.find(v=>v.name===state.venue);
  }

  function canonicalPriorities(list){
    const selected = new Set(list);
    return D.photoPriorityOrder.filter(x=>selected.has(x));
  }

  function buildResult(){
    const vr = venueRecord();
    if (!vr) throw new Error("Venue mapping not found.");

    const venueDescription = D.venueResults[`${vr.vibe}||${state.coupleStyle}`];
    const season = D.seasonResults[state.month];
    const ordered = canonicalPriorities(state.priorities);
    const photoKey = `${state.photoStyle}||${ordered.join("||")}`;
    const photo = D.photoResults[photoKey];

    if (!venueDescription) throw new Error("Venue result not found.");
    if (!season) throw new Error("Season result not found.");
    if (!photo) throw new Error("Photo Personality result not found.");

    state.result = {
      venueName:state.venue,
      venueVibe:vr.vibe,
      coupleStyle:state.coupleStyle,
      venueDescription,
      month:state.month,
      season,
      photoStyle:state.photoStyle,
      priorities:ordered,
      other:state.other,
      photoTitle:photo.title,
      photoDescription:photo.description,
      compositeLabel:`${vr.vibe} × ${state.month} × ${photo.title}`
    };
    return state.result;
  }

  function saveResult(r){
    try{
      localStorage.setItem("weddingPhotoForecastResult", JSON.stringify({
        ...r,
        savedAt:new Date().toISOString()
      }));
    }catch(e){}
    ROOT.dataset.venueVibe = r.venueVibe;
    ROOT.dataset.weddingMonth = r.month;
    ROOT.dataset.photoPersonality = r.photoTitle;
    ROOT.dataset.photoStyle = r.photoStyle;
    ROOT.dataset.compositeForecast = r.compositeLabel;
  }

  function renderResult(r){
    $("#wpf-composite").textContent = r.compositeLabel;
    $("#wpf-composite-chips").innerHTML = [
      r.venueName, r.coupleStyle, r.photoStyle
    ].map(x=>`<span class="wpf-chip">${esc(x)}</span>`).join("");

    $("#wpf-venue-title").textContent = `${r.venueVibe} at ${r.venueName}`;
    $("#wpf-venue-description").textContent = r.venueDescription;

    $("#wpf-season-title").textContent = `${r.month} in Charlottesville`;
    $("#wpf-season-stats").innerHTML = `
      <div class="wpf-stat"><strong>${esc(r.season.daytimeHigh)}°F</strong><span>Avg. daytime high</span></div>
      <div class="wpf-stat"><strong>${esc(r.season.rainChance)}%</strong><span>Est. rain chance</span></div>
      <div class="wpf-stat"><strong>${esc(r.season.sunset)}</strong><span>Approx. sunset</span></div>`;
    $("#wpf-season-description").textContent = r.season.description;

    $("#wpf-photo-title").textContent = r.photoTitle;
    $("#wpf-photo-priorities").innerHTML = r.priorities.map(x=>`<span class="wpf-chip">${esc(x)}</span>`).join("");
    $("#wpf-photo-description").textContent = r.photoDescription;

    $("#wpf-quiz-panel").style.display = "none";
    $("#wpf-results").classList.add("is-visible");
    saveResult(r);
    initFlodesk();
    ROOT.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function initFlodesk(){
    if (flodeskInitialized) return;
    let attempts = 0;
    const status = $("#wpf-form-status");
    const tryInit = ()=>{
      attempts++;
      if (typeof window.fd === "function"){
        window.fd("form", {
          formId:"6ac966f38b2745cb6a785c8e",
          containerEl:"#fd-form-6ac966f38b2745cb6a785c8e"
        });
        flodeskInitialized = true;
        status.textContent = "";
        return;
      }
      if (attempts < 20){
        status.textContent = "Loading email form…";
        setTimeout(tryInit,250);
      }else{
        status.textContent = "The email form could not load. Confirm the Flodesk header script is installed on this page.";
      }
    };
    tryInit();
  }

  function resetQuiz(){
    state.step=0;
    state.venue="";
    state.coupleStyle="";
    state.month="";
    state.photoStyle="";
    state.priorities=[];
    state.other="";
    state.result=null;
    ROOT.querySelectorAll("input").forEach(i=>{
      if (i.type==="checkbox" || i.type==="radio") i.checked=false;
      else i.value="";
    });
    ROOT.querySelectorAll("select").forEach(s=>s.value="");
    $("#wpf-priority-count").textContent="0 of 3 selected";
    $("#wpf-other-wrap").classList.remove("is-visible");
    $("#wpf-results").classList.remove("is-visible");
    $("#wpf-quiz-panel").style.display="";
    updateStep();
    ROOT.scrollIntoView({behavior:"smooth",block:"start"});
  }

  $("#wpf-next").addEventListener("click",()=>{
    if (!validateStep()) return;
    if (state.step < 4){
      state.step++;
      updateStep();
    }else{
      try{
        renderResult(buildResult());
      }catch(err){
        console.error(err);
        setError("We couldn’t generate your result. Please review your answers and try again.");
      }
    }
  });

  $("#wpf-back").addEventListener("click",()=>{
    if (state.step>0){ state.step--; updateStep(); }
  });

  $("#wpf-retake").addEventListener("click", resetQuiz);

  $("#wpf-priority-options").addEventListener("change",(e)=>{
    if (!(e.target instanceof HTMLInputElement)) return;

    if (e.target.value === "__other__"){
      $("#wpf-other-wrap").classList.toggle("is-visible", e.target.checked);
      return;
    }

    const checked = $$('input[name="wpf-priority"]:checked').filter(x=>x.value!=="__other__");
    if (checked.length > 3){
      e.target.checked = false;
      setError("Choose exactly 3 priorities. Unselect one before adding another.");
    }else{
      setError("");
    }

    const count = $$('input[name="wpf-priority"]:checked').filter(x=>x.value!=="__other__").length;
    $("#wpf-priority-count").textContent = `${count} of 3 selected`;
  });

  ROOT.addEventListener("keydown",(e)=>{
    if (e.key==="Enter" && e.target.tagName!=="TEXTAREA" && state.step < 4){
      if (e.target.tagName==="SELECT" || e.target.tagName==="INPUT"){
        e.preventDefault();
        $("#wpf-next").click();
      }
    }
  });

  window.WeddingPhotoForecast = {
    getState:()=>JSON.parse(JSON.stringify(state)),
    getResult:()=>state.result ? JSON.parse(JSON.stringify(state.result)) : null
  };

  updateStep();
})();
