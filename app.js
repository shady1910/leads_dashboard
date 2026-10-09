(() => {
  const leads = window.LEADS || [];
  const els = {
    rows: document.querySelector("#lead-rows"), search: document.querySelector("#search"),
    industry: document.querySelector("#industry-filter"), region: document.querySelector("#region-filter"),
    priority: document.querySelector("#priority-filter"), score: document.querySelector("#score-filter"),
    status: document.querySelector("#status-filter"), visible: document.querySelector("#visible-count"),
    total: document.querySelector("#total-count"), latest: document.querySelector("#latest-date"),
    resultStatus: document.querySelector("#result-status"), empty: document.querySelector("#empty-state"),
    reset: document.querySelector("#reset")
  };
  let sortKey = "company";
  let sortDirection = 1;
  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  const validUrl = value => { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; } };
  const firstSource = value => String(value || "").split(/[;|]/).map(v => v.trim()).find(validUrl) || "";
  const fillSelect = (select, values) => [...new Set(values.filter(Boolean))].sort((a,b) => a.localeCompare(b, "de")).forEach(value => { const option = document.createElement("option"); option.value = option.textContent = value; select.append(option); });
  fillSelect(els.industry, leads.map(l => l.industry));
  fillSelect(els.region, leads.map(l => l.region));
  fillSelect(els.priority, leads.map(l => l.priority));
  fillSelect(els.status, leads.map(l => l.status));
  els.total.textContent = leads.length;
  els.latest.textContent = leads.map(l => l.date).filter(Boolean).sort().at(-1) || "–";
  const scoreMatches = lead => {
    const floor = Number(els.score.value || 0);
    if (!floor) return true;
    if (floor === 80) return Number(lead.score) >= 80;
    if (floor === 65) return Number(lead.score) >= 65 && Number(lead.score) < 80;
    return Number(lead.score) >= 50 && Number(lead.score) < 65;
  };
  const render = () => {
    const query = els.search.value.trim().toLocaleLowerCase("de");
    const filtered = leads.filter(lead => {
      const haystack = Object.values(lead).join(" ").toLocaleLowerCase("de");
      return (!query || haystack.includes(query)) && (!els.industry.value || lead.industry === els.industry.value) && (!els.region.value || lead.region === els.region.value) && (!els.priority.value || lead.priority === els.priority.value) && (!els.status.value || lead.status === els.status.value) && scoreMatches(lead);
    }).sort((a,b) => (sortKey === "score" ? Number(a[sortKey] || 0) - Number(b[sortKey] || 0) : String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""), "de", {numeric:true})) * sortDirection);
    els.rows.innerHTML = filtered.map((lead, index) => {
      const website = validUrl(lead.website), source = firstSource(lead.sources), priority = String(lead.priority || "C").toLowerCase().replace(/[^a-c]/g, "c");
      return `<tr style="animation-delay:${Math.min(index * 18, 180)}ms"><td data-label="Unternehmen">${website ? `<a class="company-link" href="${escapeHtml(website)}" target="_blank" rel="noopener">${escapeHtml(lead.company)} ↗</a>` : `<strong>${escapeHtml(lead.company)}</strong>`}<span class="meta">${escapeHtml(lead.region)}</span></td><td data-label="Standort">${escapeHtml(lead.location)}</td><td data-label="Branche">${escapeHtml(lead.industry)}</td><td data-label="Priorität"><span class="badge priority-${priority}">${escapeHtml(lead.priority)}</span></td><td data-label="Bewertung"><span class="score">${escapeHtml(lead.score)}</span></td><td data-label="Status"><span class="lead-status">${escapeHtml(lead.status)}</span>${lead.contactDate ? `<span class="meta">Kontakt: ${escapeHtml(lead.contactDate)}</span>` : ""}</td><td data-label="Bedarf"><span class="signal">${escapeHtml(lead.need)}</span>${source ? `<div class="sources"><a href="${escapeHtml(source)}" target="_blank" rel="noopener">Quelle öffnen ↗</a></div>` : ""}</td><td data-label="Nächster Schritt"><span class="next">${escapeHtml(lead.next)}</span></td><td data-label="Recherche">${escapeHtml(lead.date)}</td></tr>`;
    }).join("");
    els.visible.textContent = filtered.length;
    els.resultStatus.textContent = `${filtered.length} von ${leads.length} Unternehmen angezeigt`;
    els.empty.hidden = filtered.length !== 0;
  };
  [els.search, els.industry, els.region, els.priority, els.score, els.status].forEach(el => el.addEventListener("input", render));
  els.reset.addEventListener("click", () => { [els.search, els.industry, els.region, els.priority, els.score, els.status].forEach(el => { el.value = ""; }); render(); els.search.focus(); });
  document.querySelectorAll("[data-sort]").forEach(button => button.addEventListener("click", () => { const key = button.dataset.sort; sortDirection = sortKey === key ? sortDirection * -1 : 1; sortKey = key; render(); }));
  render();
})();
