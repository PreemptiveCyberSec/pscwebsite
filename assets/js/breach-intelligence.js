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

    function renderOverview() {
        const firstYear = 2000;
        const lastYear = 2026;
        const overviewRecords = records.filter((record) => {
            const year = Number(record.date.slice(0, 4));
            return year >= firstYear && year <= lastYear;
        });
        const series = [
            { key: "all", label: "All records", color: "#58f5a0" },
            { key: "public", label: "Public disclosures", color: "#00e5c4" },
            { key: "actor-claimed", label: "Actor claims (unverified)", color: "#e9c46a" },
            { key: "reported", label: "Register reports (unverified)", color: "#9bff54" },
            { key: "reference", label: "Reference only", color: "#b3c4d6" },
        ];
        const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => ({
            year: firstYear + index, all: 0, public: 0, "actor-claimed": 0, reported: 0, reference: 0,
        }));
        const industryCounts = new Map();
        for (const record of overviewRecords) {
            const bucket = years[Number(record.date.slice(0, 4)) - firstYear];
            bucket.all += 1;
            bucket[record.recordType] += 1;
            industryCounts.set(record.industry, (industryCounts.get(record.industry) || 0) + 1);
        }
        const legend = document.getElementById("trend-legend");
        const table = document.getElementById("trend-data-rows");
        legend.replaceChildren();
        table.replaceChildren();
        for (const item of series) {
            const entry = document.createElement("li");
            const swatch = document.createElement("span");
            swatch.style.backgroundColor = item.color;
            swatch.setAttribute("aria-hidden", "true");
            entry.append(swatch, document.createTextNode(item.label));
            legend.append(entry);
        }
        for (const bucket of years) {
            const row = document.createElement("tr");
            const year = document.createElement("th");
            year.scope = "row";
            year.textContent = `${bucket.year}${bucket.year === lastYear ? " YTD" : ""}`;
            row.append(year, ...series.map((item) => createCell(bucket[item.key])));
            table.append(row);
        }

        const svgNamespace = "http://www.w3.org/2000/svg";
        function svgElement(tag, attributes, text) {
            const element = document.createElementNS(svgNamespace, tag);
            for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
            if (text !== undefined) element.textContent = text;
            return element;
        }
        const width = 1200;
        const height = 300;
        const left = 54;
        const top = 24;
        const plotWidth = width - left - 26;
        const plotHeight = height - top - 42;
        const maximum = Math.max(1, ...years.map((bucket) => bucket.all));
        const tickStep = Math.max(1, Math.ceil(maximum / 4 / 10) * 10);
        const ceiling = tickStep * 4;
        const xPosition = (index) => left + index / (years.length - 1) * plotWidth;
        const yPosition = (count) => top + plotHeight - count / ceiling * plotHeight;
        const svg = svgElement("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-labelledby": "ci-trend-title ci-trend-description" });
        svg.append(
            svgElement("title", { id: "ci-trend-title" }, "Incident record trends, 2000 to 2026"),
            svgElement("desc", { id: "ci-trend-description" }, "Annual retained record counts by type on a shared zero-based scale. 2026 is year-to-date. Exact counts are in the Yearly counts table."),
        );
        for (let tick = 0; tick <= 4; tick += 1) {
            const count = tick * tickStep;
            const position = yPosition(count);
            svg.append(
                svgElement("line", { x1: left, x2: width - 26, y1: position, y2: position, class: "ci-trend-gridline" }),
                svgElement("text", { x: left - 10, y: position + 4, "text-anchor": "end" }, count.toLocaleString("en-AU")),
            );
        }
        years.forEach((bucket, index) => {
            if (index % 2 === 0) svg.append(svgElement("text", { x: xPosition(index), y: height - 14, "text-anchor": "middle" }, bucket.year));
        });
        for (const item of series) {
            const group = svgElement("g", { "data-series": item.key });
            group.append(svgElement("polyline", {
                points: years.map((bucket, index) => `${xPosition(index)},${yPosition(bucket[item.key])}`).join(" "),
                fill: "none", stroke: item.color, "stroke-width": 2, "stroke-linejoin": "round",
            }));
            years.forEach((bucket, index) => {
                const point = svgElement("circle", { cx: xPosition(index), cy: yPosition(bucket[item.key]), r: 3, fill: item.color });
                point.append(svgElement("title", {}, `${bucket.year}${bucket.year === lastYear ? " YTD" : ""} / ${item.label}: ${bucket[item.key]}`));
                group.append(point);
            });
            svg.append(group);
        }
        document.getElementById("year-trend").replaceChildren(svg);

        const totals = series.map((item) => ({ ...item, count: years.reduce((sum, bucket) => sum + bucket[item.key], 0) }));
        const pulse = document.getElementById("collection-pulse");
        pulse.replaceChildren();
        const metrics = [
            ...totals.map((item) => [item.label, item.count]),
            ["Industries", industryCounts.size],
            ["Years with records", years.filter((bucket) => bucket.all > 0).length],
            ["2026 YTD records", years.at(-1).all],
        ];
        for (const [label, count] of metrics) {
            const card = document.createElement("div");
            card.className = "ci-pulse-metric";
            const name = document.createElement("span");
            name.textContent = label;
            const value = document.createElement("strong");
            value.textContent = count.toLocaleString("en-AU");
            card.append(name, value);
            pulse.append(card);
        }
        drawBars(document.getElementById("year-ranking"), years.map((bucket) => ({ label: `${bucket.year}${bucket.year === lastYear ? " YTD" : ""}`, count: bucket.all })), { showZeros: true });
        drawBars(document.getElementById("industry-ranking"), [...industryCounts].map(([label, count]) => ({ label, count }))
            .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)).slice(0, 10));
        drawBars(document.getElementById("source-ranking"), totals.slice(1), { showZeros: true });
        const peak = [...years].sort((left, right) => right.all - left.all || left.year - right.year)[0];
        setText(document.getElementById("collection-insights"), `${overviewRecords.length.toLocaleString("en-AU")} retained records across 27 calendar years. ${peak.all ? `${peak.year} has the most retained records (${peak.all.toLocaleString("en-AU")}).` : "No records available."} Bars use a zero baseline and scale to the largest count in each breakdown. Coverage and reporting vary by year; 2026 is partial.`);
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

            const labels = ["Date", "Location", "Organisation / reference", "Industry", "Incident summary", "Record status"];
            [...row.cells].forEach((cell, index) => {
                cell.dataset.label = labels[index];
            });
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
        renderOverview();
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
