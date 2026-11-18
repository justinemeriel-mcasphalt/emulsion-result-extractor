const upload =
    document.getElementById("pdfUpload");

const extractBtn =
    document.getElementById("extractBtn");

const copyBtn =
    document.getElementById("copyBtn");

const statusLabel =
    document.getElementById("status");

const tableBody =
    document.querySelector(
        "#resultsTable tbody"
    );

let files = [];

upload.addEventListener(
    "change",
    (e) => {

        files =
            Array.from(e.target.files);

        statusLabel.textContent =
            `${files.length} PDF(s) loaded`;
    }
);

extractBtn.addEventListener(
    "click",
    async () => {

        tableBody.innerHTML = "";

        for (const file of files) {

            const sample =
                file.name.replace(
                    /\.pdf$/i,
                    ""
                );

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${sample}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            `;

            tableBody.appendChild(row);
        }

        statusLabel.textContent =
            `${files.length} file(s) processed`;
    }
);

copyBtn.addEventListener(
    "click",
    async () => {

        let output =
            "Sample\tSalbolt\tSieve\tResidue\tWater\tPenetration\n";

        const rows =
            document.querySelectorAll(
                "#resultsTable tbody tr"
            );

        rows.forEach(row => {

            const cells =
                row.querySelectorAll("td");

            const values =
                Array.from(cells)
                     .map(
                        x => x.textContent
                     );

            output +=
                values.join("\t") + "\n";
        });

        await navigator.clipboard
            .writeText(output);

        alert(
            "Copied to clipboard"
        );
    }
);
