"use strict";

const search = document.getElementById("harness-search");
const tier = document.getElementById("harness-tier");
const count = document.getElementById("harness-count");
const rows = Array.from(document.querySelectorAll("#harness-rows tr"));

function filterInventory() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const row of rows) {
        const matches = (!tier.value || row.dataset.tier === tier.value) &&
            row.textContent.toLocaleLowerCase().includes(query);
        row.hidden = !matches;
        if (matches) visible++;
    }
    count.textContent = `Showing ${visible} of ${rows.length} records.`;
}

search.addEventListener("input", filterInventory);
tier.addEventListener("change", filterInventory);
