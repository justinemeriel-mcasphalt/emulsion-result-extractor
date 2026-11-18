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

let uploadedFiles = [];

/*
    Cache uploaded files
*/

upload.addEventListener(
    "change",
    (e) => {

        uploadedFiles =
            Array.from(e.target.files);

        statusLabel.textContent =
            `${uploadedFiles.length} PDF(s) selected`;

    }
);

/*
    Build table
*/

extractBtn.addEventListener(
    "click",
    () => {

        tableBody.innerHTML = "";

        uploadedFiles.forEach(
            (file) => {

                const row =
                    document.createElement("tr");

                row.innerHTML = `
                    <td>${file.name}</td>
                    <td>Ready</td>
                `;

                tableBody.appendChild(row);
            }
        );

        statusLabel.textContent =
            `${uploadedFiles.length} file(s) loaded`;
    }
);

/*
    Copy table to clipboard
*/

copyBtn.addEventListener(
    "click",
    async () => {

        let output =
            "Filename\tStatus\n";

        const rows =
            document.querySelectorAll(
                "#resultsTable tbody tr"
            );

        rows.forEach(
            (row) => {

                const cells =
                    row.querySelectorAll("td");

                output +=
                    cells[0].textContent +
                    "\t" +
                    cells[1].textContent +
                    "\n";
            }
        );

        await navigator.clipboard.writeText(
            output
        );

        alert(
            "Table copied to clipboard."
        );
    }
);
