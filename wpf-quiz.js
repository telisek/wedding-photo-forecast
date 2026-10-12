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
  const IMAGES = Array.isArray(window.WPF_IMAGES) ? window.WPF_IMAGES : [];

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
    started:false,
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

  function matches(image, field, value){
    return Array.isArray(image[field]) && image[field].some(x=>String(x).toLowerCase()===String(value).toLowerCase());
  }
  function imageScore(image, criteria){
    let score=0;
    if(criteria.venue && matches(image,"venues",criteria.venue)) score+=16;
    if(criteria.vibe && matches(image,"vibes",criteria.vibe)) score+=6;
    if(criteria.month && matches(image,"months",criteria.month)) score+=5;
    if(criteria.personality && matches(image,"personalities",criteria.personality)) score+=4;
    if(criteria.style && matches(image,"styles",criteria.style)) score+=4;
    if(criteria.priority && matches(image,"priorities",criteria.priority)) score+=8;
    if(criteria.role && matches(image,"roles",criteria.role)) score+=3;
    return score;
  }
  function findImage(criteria,used=new Set()){
    const ranked=IMAGES.filter(im=>im && typeof im.src==="string" && /^https:\/\//.test(im.src) && !used.has(im.src))
      .map(im=>({im,score:imageScore(im,criteria)}))
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    return ranked.length ? ranked[0].im : null;
  }
  function imageMarkup(image,caption,kind=""){
    if(!image) return `<div class="wpf-photo-placeholder ${kind}" role="img" aria-label="Photograph awaiting curation"><span>AWP / ${esc(caption)}</span><small>Photograph to be added</small></div>`;
    return `<figure class="wpf-photo ${kind}"><img src="${esc(image.src)}" alt="${esc(image.alt || caption)}" loading="lazy"><figcaption>${esc(caption)}</figcaption></figure>`;
  }
  function inspirationCard(criteria,label){
    const image=findImage(criteria);
    return `<div class="wpf-inspiration">${imageMarkup(image,label,"wpf-option-photo")}</div>`;
  }
  function optionRadio(name, value, label, description){
    return `
      <label class="wpf-option">
        <input type="radio" name="${esc(name)}" value="${esc(value)}">
        ${name === "wpf-couple-style" ? inspirationCard({personality:value,role:"personality"},value) : ""}
        ${name === "wpf-photo-style" ? inspirationCard({style:value,role:"style"},value) : ""}
        <div class="wpf-option-copy"><strong>${esc(label)}</strong>${description ? `<span>${esc(description)}</span>` : ""}</div>
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
        <section id="wpf-intro" class="wpf-intro-cover">
          <div class="wpf-cover-copy">
            <p class="wpf-eyebrow">Aaron Watson Photography Presents</p>
            <h1 class="wpf-title">Your Wedding Photo Forecast</h1>
            <p class="wpf-cover-subtitle">Your wedding day is one of a kind. Your photographs should be, too.</p>
            <p class="wpf-intro">Discover how your venue, wedding season, and personal style come together to shape the photographs you'll treasure for a lifetime.</p>
            <button class="wpf-btn wpf-btn-primary" type="button" id="wpf-start">Discover My Forecast <span aria-hidden="true">→</span></button>
            <p class="wpf-cover-foot">Five questions · Personalized results · No email required to see your forecast</p>
          </div>
          <div id="wpf-cover-art" class="wpf-cover-art"></div>
        </section>
        <section id="wpf-quiz-panel" hidden>
          <header class="wpf-header">
            <p class="wpf-eyebrow">A Personal Wedding Photography Guide</p>
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
              <div class="wpf-options wpf-illustrated-options">
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
              <div class="wpf-options wpf-illustrated-options">
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
            <div id="wpf-results-art" class="wpf-results-art"></div>
            <h2 class="wpf-results-title" id="wpf-composite"></h2>
            <p class="wpf-results-sub">Your forecast combines the visual character of your venue, the seasonal conditions surrounding your date, and the moments you most want your photographs to preserve.</p>
            <div class="wpf-chips" id="wpf-composite-chips"></div>
          </div>

          <div class="wpf-result-grid">
            <article class="wpf-card">
              <p class="wpf-card-label">01 / Your Venue Vibes</p>
              <h3 id="wpf-venue-title"></h3>
              <p id="wpf-venue-description"></p>
              <div class="wpf-photo-grid" id="wpf-venue-gallery"></div>
            </article>

            <article class="wpf-card">
              <p class="wpf-card-label">02 / Your Seasonal Forecast</p>
              <h3 id="wpf-season-title"></h3>
              <div class="wpf-stats" id="wpf-season-stats"></div>
              <p id="wpf-season-description"></p>
              <div class="wpf-photo-grid" id="wpf-season-gallery"></div>
            </article>

            <article class="wpf-card">
              <p class="wpf-card-label">03 / Your Photo Personality</p>
              <h3 id="wpf-photo-title"></h3>
              <div class="wpf-chips" id="wpf-photo-priorities"></div>
              <p id="wpf-photo-description" style="margin-top:14px"></p>
              <div class="wpf-photo-grid wpf-three-images" id="wpf-priority-gallery"></div>
            </article>
          </div>

          <section class="wpf-expert" aria-label="Photography planning insight">
            <p class="wpf-card-label">An Insight From Aaron Watson Photography</p>
            <h3>The details behind beautiful photographs</h3>
            <p id="wpf-insight"></p>
          </section>
          <section class="wpf-email">
            <p class="wpf-eyebrow">Your Personalized Inspiration</p>
            <h3>Now, See Your Forecast Come to Life.</h3>
            <p>Explore more wedding inspiration from Aaron Watson Photography. Leave your email to stay in touch about photography inspiration and planning resources. Personalized image delivery is being prepared and is not yet automated.</p>
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
  function fillStaticImages(){
    $("#wpf-cover-art").innerHTML = imageMarkup(findImage({role:"cover"}) || findImage({role:"hero"}),"Wedding Photo Forecast","wpf-photo-tall");
  }
  fillStaticImages();
  $("#wpf-start").addEventListener("click",()=>{
    state.started=true;
    $("#wpf-intro").hidden=true;
    $("#wpf-quiz-panel").hidden=false;
    $("#wpf-venue").focus({preventScroll:true});
  });

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

  function curatedGallery(criteriaList){
    const used=new Set();
    return criteriaList.map((criteria,i)=>{
      const photo=findImage(criteria,used);
      if(photo) used.add(photo.src);
      return imageMarkup(photo,criteria.priority || criteria.role || `Wedding inspiration ${i+1}`);
    }).join("");
  }
  function planningInsight(r){
    const sunset=r.season.sunset;
    const rainy=r.season.rainChance;
    const p=r.priorities.map(x=>x.toLowerCase());
    const timing=`With an approximate ${r.month} sunset of ${sunset}, build your portrait timeline around available natural light rather than the reception start time.`;
    const weather=`A seasonal daily rain estimate of ${rainy}% makes a comfortable indoor portrait backup worth discussing with your venue.`;
    const moments=p.includes("immediate family (parents, grandparents, siblings)") ? "Allow a dedicated window for immediate-family photographs so those groupings never feel rushed." : p.includes("ceremony emotion") ? "Allow space around the ceremony so meaningful reactions can be documented as they happen." : "Build a photography timeline that protects the moments you've identified as most meaningful.";
    return `${timing} ${weather} ${moments} These are planning considerations, not a prediction for your specific wedding date.`;
  }
  function renderResult(r){
    $("#wpf-composite").textContent = `${r.venueVibe} / ${r.month} / ${r.photoTitle}`;
    $("#wpf-results-art").innerHTML = curatedGallery([{venue:r.venueName,vibe:r.venueVibe,personality:r.coupleStyle,month:r.month,role:"hero"}]);
    $("#wpf-composite-chips").innerHTML = [
      r.venueName, r.coupleStyle, r.photoStyle
    ].map(x=>`<span class="wpf-chip">${esc(x)}</span>`).join("");

    $("#wpf-venue-title").textContent = `${r.venueVibe} at ${r.venueName}`;
    $("#wpf-venue-description").textContent = r.venueDescription;
    $("#wpf-venue-gallery").innerHTML = curatedGallery([
      {venue:r.venueName,vibe:r.venueVibe,role:"venue"},
      {vibe:r.venueVibe,personality:r.coupleStyle,role:"personality"}
    ]);

    $("#wpf-season-title").textContent = `${r.month} in Charlottesville`;
    $("#wpf-season-stats").innerHTML = `
      <div class="wpf-stat"><strong>${esc(r.season.daytimeHigh)}°F</strong><span>Avg. daytime high</span></div>
      <div class="wpf-stat"><strong>${esc(r.season.rainChance)}%</strong><span>Est. rain chance</span></div>
      <div class="wpf-stat"><strong>${esc(r.season.sunset)}</strong><span>Approx. sunset</span></div>`;
    $("#wpf-season-description").textContent = r.season.description;
    $("#wpf-season-gallery").innerHTML = curatedGallery([{month:r.month,role:"season"}]);

    $("#wpf-photo-title").textContent = r.photoTitle;
    $("#wpf-photo-priorities").innerHTML = r.priorities.map(x=>`<span class="wpf-chip">${esc(x)}</span>`).join("");
    $("#wpf-photo-description").textContent = r.photoDescription;
    $("#wpf-priority-gallery").innerHTML = curatedGallery(r.priorities.map(priority=>({priority,style:r.photoStyle,role:"priority"})));
    $("#wpf-insight").textContent = planningInsight(r);

    $("#wpf-quiz-panel").hidden = true;
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
    state.started=false;
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
    $("#wpf-quiz-panel").hidden=true;
    $("#wpf-intro").hidden=false;
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
