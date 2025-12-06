const table = document.querySelector("#ecrTable tbody");

function saveData() {
    const rows = [...table.children].map(tr => {
        const tds = tr.querySelectorAll("td");
        return {
            id: tds[0].innerText,
            title: tds[1].innerText,
            desc: tds[2].innerText,
            owner: tds[3].innerText,
            priority: tds[4].querySelector("select").value,
            status: tds[5].querySelector("select").value
        };
    });
    localStorage.setItem("ecrData", JSON.stringify(rows));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem("ecrData") || "[]");
    data.forEach(addRowFromData);
}

function addRow() {
    addRowFromData({
        id: Date.now(),
        title: "",
        desc: "",
        owner: "",
        priority: "Medium",
        status: "Open"
    });
    saveData();
}

function addRowFromData(d) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td contenteditable="true">${d.id}</td>
        <td contenteditable="true">${d.title}</td>
        <td contenteditable="true">${d.desc}</td>
        <td contenteditable="true">${d.owner}</td>
        <td><select>
            <option>Low</option><option>Medium</option><option>High</option>
        </select></td>
        <td><select>
            <option>Open</option><option>In Progress</option><option>Closed</option>
        </select></td>
        <td><button onclick="this.parentNode.parentNode.remove(); saveData()">X</button></td>
    `;
    tr.querySelectorAll("td[contenteditable], select").forEach(el =>
        el.addEventListener("input", saveData)
    );
    tr.querySelectorAll("select")[0].value = d.priority;
    tr.querySelectorAll("select")[1].value = d.status;
    table.appendChild(tr);
}

function exportCSV() {
    const rows = [...table.children];
    let csv = "ID,Title,Description,Owner,Priority,Status\n";
    rows.forEach(tr => {
        const tds = tr.querySelectorAll("td");
        csv += [
            tds[0].innerText,
            tds[1].innerText,
            tds[2].innerText,
            tds[3].innerText,
            tds[4].querySelector("select").value,
            tds[5].querySelector("select").value
        ].join(",") + "\n";
    });
    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ecr_tracker.csv"; a.click();
}

function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const lines = e.target.result.split("\n").slice(1);
        table.innerHTML = "";
        lines.forEach(line => {
            const parts = line.split(",");
            if (parts.length < 6) return;
            addRowFromData({
                id: parts[0],
                title: parts[1],
                desc: parts[2],
                owner: parts[3],
                priority: parts[4],
                status: parts[5]
            });
        });
        saveData();
    };
    reader.readAsText(file);
}

loadData();
