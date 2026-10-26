(() => {
    const pageSize = 10;
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const recordStatuses = {
        public: { label: "Public disclosure", className: "" },
        reference: { label: "Reference only", className: "is-reference" },
        "actor-claimed": { label: "Actor claim (unverified)", className: "is-claim" },
        reported: { label: "Register report (unverified)", className: "is-claim" },
    };
    const elements = {
        year: document.getElementById("year-select"),
        scope: document.getElementById("scope-select"),
        month: document.getElementById("month-select"),
        industry: document.getElementById("industry-select"),
        search: document.getElementById("record-search"),
        status: document.getElementById("ci-status"),
        asOf: document.getElementById("data-as-of"),
        coverage: document.getElementById("coverage-range"),
        monthChart: document.getElementById("month-chart"),
        industryChart: document.getElementById("industry-chart"),
        monthCaption: document.getElementById("month-chart-caption"),
        rows: document.getElementById("incident-rows"),
        empty: document.getElementById("table-empty"),
        tableTotal: document.getElementById("table-total"),
        pageSummary: document.getElementById("page-summary"),
        pageNumber: document.getElementById("page-number"),
        previous: document.getElementById("page-prev"),
        next: document.getElementById("page-next"),
        stats: {
            total: document.getElementById("stat-total"),
            actorClaims: document.getElementById("stat-actor-claims"),
            reference: document.getElementById("stat-reference"),
            industries: document.getElementById("stat-industries"),
            peak: document.getElementById("stat-peak"),
            peakNote: document.getElementById("stat-peak-note"),
            totalNote: document.getElementById("stat-total-note"),
        },
    };
    let records = [];
    let currentPage = 1;

    function recordMonth(record) {
        const month = Number(record.date.slice(5, 7));
        return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
    }

    function sourceScopeMatches(record) {
        return elements.scope.value === "all" || record.recordType === elements.scope.value;
    }

    function selectedYearRecords() {
        return records.filter((record) =>
            record.date.slice(0, 4) === elements.year.value && sourceScopeMatches(record)
        );
    }

    function setText(element, value) {
        element.textContent = String(value);
    }

    function drawBars(container, values, options = {}) {
        container.replaceChildren();
        const hasRecords = values.some((item) => item.count > 0);
        const rows = hasRecords
            ? options.showZeros ? values : values.filter((item) => item.count > 0)
            : [];
        if (rows.length === 0) {
            const empty = document.createElement("p");
            empty.className = "ci-chart-empty";
            empty.textContent = "No records in this year and source selection.";
            container.append(empty);
            return;
        }

        const max = Math.max(...rows.map((item) => item.count));
        for (const item of rows) {
            const row = document.createElement("div");
            row.className = "ci-bar-row";
            row.setAttribute("role", "img");
            row.setAttribute("aria-label", `${item.label}: ${item.count} record${item.count === 1 ? "" : "s"}`);

            const label = document.createElement("span");
            label.className = "ci-bar-label";
            label.textContent = item.label;
            label.title = item.label;

            const track = document.createElement("span");
            track.className = "ci-bar-track";
            track.setAttribute("aria-hidden", "true");
            const fill = document.createElement("span");
            fill.className = `ci-bar-fill${options.referenceOnly ? " is-reference" : ""}`;
            fill.style.setProperty("--bar-width", `${(item.count / max) * 100}%`);
            track.append(fill);

            const count = document.createElement("span");
            count.className = "ci-bar-count";
            count.textContent = String(item.count);
            row.append(label, track, count);
            container.append(row);
        }
    }

    function updateIndustryOptions(yearRecords) {
        const previous = elements.industry.value;
        const industries = [...new Set(yearRecords.map((record) => record.industry))]
            .sort((left, right) => left.localeCompare(right));
        elements.industry.replaceChildren(new Option("All industries", ""));
        for (const industry of industries) {
            elements.industry.add(new Option(industry, industry));
        }
        if (industries.includes(previous)) elements.industry.value = previous;
    }

    function updateChartsAndStats() {
        const yearRecords = selectedYearRecords();
        const referenceOnly = elements.scope.value === "reference";
        const countsByMonth = new Map(monthNames.map((name, index) => [index + 1, { label: name, count: 0 }]));
        const countsByIndustry = new Map();

        for (const record of yearRecords) {
            const month = recordMonth(record);
            if (month !== null) countsByMonth.get(month).count += 1;
            countsByIndustry.set(record.industry, (countsByIndustry.get(record.industry) || 0) + 1);
        }

        drawBars(elements.monthChart, [...countsByMonth.values()], { referenceOnly, showZeros: true });
        drawBars(
            elements.industryChart,
            [...countsByIndustry.entries()]
                .map(([label, count]) => ({ label, count }))
                .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
            { referenceOnly },
        );
        updateIndustryOptions(yearRecords);

        const byMonth = [...countsByMonth.values()].filter((item) => item.count > 0);
        const peak = byMonth.sort((left, right) => right.count - left.count || monthNames.indexOf(left.label) - monthNames.indexOf(right.label))[0];
        const industries = new Set(yearRecords.map((record) => record.industry));
        const references = yearRecords.filter((record) => record.recordType === "reference").length;
        const actorClaims = yearRecords.filter((record) => record.recordType === "actor-claimed").length;
        setText(elements.stats.total, yearRecords.length);
        setText(elements.stats.actorClaims, actorClaims);
        setText(elements.stats.reference, references);
        setText(elements.stats.industries, industries.size);
        setText(elements.stats.peak, peak?.label || "—");
        setText(elements.stats.peakNote, peak ? `${peak.count} record${peak.count === 1 ? "" : "s"} in this collection` : "No month-level records");
        setText(elements.stats.totalNote, `${elements.year.value}${elements.year.value === "2026" ? " year-to-date" : ""} · current source filter`);
        setText(elements.monthCaption, `Monthly records for ${elements.year.value}${elements.year.value === "2026" ? " year-to-date" : ""}; charts follow the source filter.`);
    }

    function filteredRecords() {
        const query = elements.search.value.trim().toLocaleLowerCase();
        return selectedYearRecords()
            .filter((record) => {
                const month = recordMonth(record);
                return (!elements.month.value || month === Number(elements.month.value))
                    && (!elements.industry.value || record.industry === elements.industry.value)
                    && (!query || [
                        record.organisation,
                        record.location,
                        record.industry,
                        record.summary,
                        record.sourceLabel,
                    ].join(" ").toLocaleLowerCase().includes(query));
            })
            .sort((left, right) => left.date.localeCompare(right.date) || left.organisation.localeCompare(right.organisation));
    }

    function createCell(value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        return cell;
    }

    function renderRows() {
        const matching = filteredRecords();
        const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
        currentPage = Math.min(currentPage, pageCount);
        const start = (currentPage - 1) * pageSize;
        const visible = matching.slice(start, start + pageSize);
        elements.rows.replaceChildren();

        for (const record of visible) {
            const row = document.createElement("tr");
            row.append(
                createCell(record.dateLabel),
                createCell(record.location),
                createCell(record.organisation),
                createCell(record.industry),
                createCell(record.summary),
            );

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            const status = recordStatuses[record.recordType];
            badge.className = `ci-status-badge ${status.className}`.trim();
            badge.textContent = status.label;
            statusCell.append(badge);
            row.append(statusCell);

            const sourceCell = document.createElement("td");
            if (record.sourceUrl) {
                const link = document.createElement("a");
                link.href = record.sourceUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = `${record.sourceLabel} ↗`;
                sourceCell.append(link);
            } else {
                sourceCell.textContent = record.sourceLabel;
            }
            row.append(sourceCell);
            elements.rows.append(row);
        }

        elements.empty.hidden = matching.length > 0;
        const first = matching.length ? start + 1 : 0;
        const last = Math.min(start + pageSize, matching.length);
        setText(elements.tableTotal, `${matching.length} record${matching.length === 1 ? "" : "s"}`);
        setText(elements.pageSummary, matching.length ? `Showing ${first}–${last} of ${matching.length}` : "Showing 0 records");
        setText(elements.pageNumber, `Page ${currentPage} of ${pageCount}`);
        elements.previous.disabled = currentPage <= 1;
        elements.next.disabled = currentPage >= pageCount;
    }

    function refresh() {
        currentPage = 1;
        updateChartsAndStats();
        renderRows();
    }

    async function initialize() {
        const response = await fetch("ci/incidents.json", { cache: "no-cache" });
        if (!response.ok) throw new Error(`Incident data request failed (${response.status})`);
        const dataset = await response.json();
        if (!dataset || !Array.isArray(dataset.records) || typeof dataset.asOf !== "string") {
            throw new Error("Incident data file has an invalid structure");
        }
        records = dataset.records;
        for (const record of records) {
            if (!record.id || !/^\d{4}-\d{2}(?:-\d{2})?$/.test(record.date)
                || !record.organisation || !record.location || !record.industry
                || !record.summary || !Object.hasOwn(recordStatuses, record.recordType)) {
                throw new Error(`Incident data contains an invalid record (${record.id || "unknown id"})`);
            }
        }
        const recordYears = records.map((record) => Number(record.date.slice(0, 4)));
        const firstYear = Math.min(dataset.coverageStart, ...recordYears);
        const lastYear = Math.max(dataset.coverageEnd, ...recordYears);
        const datasetYear = dataset.asOf.slice(0, 4);
        elements.year.replaceChildren();
        for (let year = lastYear; year >= firstYear; year -= 1) {
            elements.year.add(new Option(`${year}${String(year) === datasetYear ? " · YTD" : ""}`, String(year)));
        }
        elements.year.value = String(lastYear);
        setText(elements.coverage, `Historical view: ${firstYear}–${lastYear}`);
        elements.month.replaceChildren(new Option("All months", ""));
        monthNames.forEach((name, index) => elements.month.add(new Option(name, String(index + 1))));
        setText(elements.asOf, `Dataset date: ${dataset.asOf}`);
        elements.status.removeAttribute("data-state");
        elements.status.dataset.state = "ready";
        const actorClaims = records.filter((record) => record.recordType === "actor-claimed").length;
        const registerReports = records.filter((record) => record.recordType === "reported").length;
        setText(elements.status, `${records.length} records loaded · ${actorClaims} actor-claim records · ${registerReports} unverified register reports.`);
        refresh();
    }

    elements.year.addEventListener("change", refresh);
    elements.scope.addEventListener("change", refresh);
    elements.month.addEventListener("change", refresh);
    elements.industry.addEventListener("change", refresh);
    elements.search.addEventListener("input", () => {
        currentPage = 1;
        renderRows();
    });
    elements.previous.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage -= 1;
            renderRows();
        }
    });
    elements.next.addEventListener("click", () => {
        currentPage += 1;
        renderRows();
    });

    initialize().catch((error) => {
        elements.status.dataset.state = "error";
        setText(elements.status, `Incident records could not be loaded: ${error.message}`);
    });
})();
