(() => {
  const leads = window.LEADS || [];
  const els = {
    rows: document.querySelector("#lead-rows"),
    search: document.querySelector("#search"),
    industry: document.querySelector("#industry-filter"),
    region: document.querySelector("#region-filter"),
    priority: document.querySelector("#priority-filter"),
    relevance: document.querySelector("#relevance-filter"),
    visible: document.querySelector("#visible-count"),
    total: document.querySelector("#total-count"),
    aCount: document.querySelector("#a-count"),
    latest: document.querySelector("#latest-date"),
    status: document.querySelector("#result-status"),
    empty: document.querySelector("#empty-state"),
    reset: document.querySelector("#reset")
  };

  let sortKey = "score";
  let sortDirection = -1;

  const scoreOf = lead => Number((lead.relevance.match(/\d+/) || [0])[0]);
  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
  const validUrl = value => {
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; }
    catch { return ""; }
  };
  const firstSource = value => String(value || "").split(/[;|]/).map(v => v.trim()).find(validUrl) || "";

  const fillSelect = (select, values) => {
    [...new Set(values.filter(Boolean))].sort((a,b) => a.localeCompare(b, "de")).forEach(value => {
      const option = document.createElement("option");
      option.value = option.textContent = value;
      select.append(option);
    });
  };

  fillSelect(els.industry, leads.map(l => l.industry));
  fillSelect(els.region, leads.map(l => l.region));
  fillSelect(els.priority, leads.map(l => l.priority));
  els.total.textContent = leads.length;
  els.aCount.textContent = leads.filter(l => l.priority === "A").length;
  els.latest.textContent = leads.map(l => l.date).sort().at(-1) || "–";

  const matchesRelevance = lead => {
    const filter = els.relevance.value;
    const score = scoreOf(lead);
    if (!filter) return true;
    if (filter === "90") return score >= 90;
    if (filter === "80") return score >= 80 && score < 90;
    return score >= 70 && score < 80;
  };

  const render = () => {
    const query = els.search.value.trim().toLocaleLowerCase("de");
    const filtered = leads.filter(lead => {
      const haystack = Object.values(lead).join(" ").toLocaleLowerCase("de");
      return (!query || haystack.includes(query))
        && (!els.industry.value || lead.industry === els.industry.value)
        && (!els.region.value || lead.region === els.region.value)
        && (!els.priority.value || lead.priority === els.priority.value)
        && matchesRelevance(lead);
    }).sort((a,b) => {
      const av = sortKey === "score" ? scoreOf(a) : (a[sortKey] || "");
      const bv = sortKey === "score" ? scoreOf(b) : (b[sortKey] || "");
      return (typeof av === "number" ? av - bv : String(av).localeCompare(String(bv), "de", {numeric:true})) * sortDirection;
    });

    els.rows.innerHTML = filtered.map((lead, index) => {
      const website = validUrl(lead.website);
      const source = firstSource(lead.sources);
      return `<tr style="animation-delay:${Math.min(index * 18, 180)}ms">
        <td data-label="Unternehmen">
          ${website ? `<a class="company-link" href="${escapeHtml(website)}" target="_blank" rel="noopener">${escapeHtml(lead.company)} ↗</a>` : `<strong>${escapeHtml(lead.company)}</strong>`}
          <span class="meta">${escapeHtml(lead.region)}</span>
        </td>
        <td data-label="Standort">${escapeHtml(lead.location)}</td>
        <td data-label="Branche">${escapeHtml(lead.industry)}</td>
        <td data-label="Relevanz"><span class="score">${scoreOf(lead)}/100</span><span class="meta">${escapeHtml(lead.relevance.replace(/^\d+\/100\s*-?\s*/, "").split(":")[0])}</span></td>
        <td data-label="Priorität"><span class="badge priority-${escapeHtml(lead.priority.toLowerCase())}">${escapeHtml(lead.priority)}</span></td>
        <td data-label="Bedarf"><span class="signal">${escapeHtml(lead.need)}</span>${source ? `<div class="sources"><a href="${escapeHtml(source)}" target="_blank" rel="noopener">Quelle öffnen ↗</a></div>` : ""}</td>
        <td data-label="Nächster Schritt"><span class="next">${escapeHtml(lead.next)}</span></td>
        <td data-label="Datum">${escapeHtml(lead.date)}</td>
      </tr>`;
    }).join("");

    els.visible.textContent = filtered.length;
    els.status.textContent = `${filtered.length} von ${leads.length} Leads angezeigt`;
    els.empty.hidden = filtered.length !== 0;
  };

  [els.search, els.industry, els.region, els.priority, els.relevance].forEach(el => el.addEventListener("input", render));
  els.reset.addEventListener("click", () => {
    els.search.value = "";
    [els.industry, els.region, els.priority, els.relevance].forEach(el => el.value = "");
    render();
    els.search.focus();
  });
  document.querySelectorAll("[data-sort]").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.sort;
    sortDirection = sortKey === key ? sortDirection * -1 : 1;
    sortKey = key;
    render();
  }));

  render();
})();

