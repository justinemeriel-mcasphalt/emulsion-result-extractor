pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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

//--------------------------------------
// PSV Template
//--------------------------------------

const PSV_TEMPLATE = {

    salbolt: {

        x1: 549,
        y1: 592,

        x2: 892,
        y2: 626,

        whitelist:
            "0123456789.",

        regex:
            /^\d{2,3}\.\d{2}$/
    },

    sieve: {

        x1: 549,
        y1: 955,

        x2: 892,
        y2: 1000,

        whitelist:
            "0123456789.",

        regex:
            /^\d(\.\d{1,2})?$/
    },

    residue: {

        x1: 549,
        y1: 1735,

        x2: 892,
        y2: 1836,

        whitelist:
            "0123456789.",

        regex:
            /^\d{2}\.\d$/
    }

};

//--------------------------------------
// File Upload
//--------------------------------------

upload.addEventListener(
    "change",
    (e) => {

        files =
            Array.from(
                e.target.files
            );

        statusLabel.textContent =
            `${files.length} file(s) loaded`;
    }
);

//--------------------------------------
// OCR Helper
//--------------------------------------

async function extractField(
    pageCanvas,
    field
)
{
    const crop =
        document.createElement("canvas");

    const SCALE = 5;

    crop.width =
        (field.x2 - field.x1) * SCALE;

    crop.height =
        (field.y2 - field.y1) * SCALE;

    const cropCtx =
        crop.getContext("2d");

    cropCtx.drawImage(

        pageCanvas,

        field.x1,
        field.y1,

        field.x2 - field.x1,
        field.y2 - field.y1,

        0,
        0,

        crop.width,
        crop.height

    );

    const result =
        await Tesseract.recognize(
            crop,
            "eng",
            {
                tessedit_pageseg_mode: 7,

                tessedit_char_whitelist:
                    field.whitelist
            }
        );

    return result.data.text
        .replace(/[^\d.]/g, "")
        .trim();
}

//--------------------------------------
// Main Extraction
//--------------------------------------

extractBtn.addEventListener(
    "click",
    async () => {

        tableBody.innerHTML = "";

        for (const file of files) {

            statusLabel.textContent =
                `Reading ${file.name}`;

            const bytes =
                await file.arrayBuffer();

            const pdf =
                await pdfjsLib
                .getDocument({
                    data: bytes
                })
                .promise;

            const page =
                await pdf.getPage(1);

            const viewport =
                page.getViewport({
                    scale: 3
                });

            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                viewport.width;

            canvas.height =
                viewport.height;

            const ctx =
                canvas.getContext("2d");

            await page.render({

                canvasContext: ctx,

                viewport

            }).promise;

            const salbolt =
                await extractField(
                    canvas,
                    PSV_TEMPLATE.salbolt
                );

            const sieve =
                await extractField(
                    canvas,
                    PSV_TEMPLATE.sieve
                );

            const residue =
                await extractField(
                    canvas,
                    PSV_TEMPLATE.residue
                );

            const sample =
                file.name.replace(
                    /\.pdf$/i,
                    ""
                );

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${sample}</td>
                <td>${salbolt}</td>
                <td>${sieve}</td>
                <td>${residue}</td>
            `;

            tableBody
                .appendChild(row);
        }

        statusLabel.textContent =
            "Extraction Complete";
    }
);

//--------------------------------------
// Clipboard Export
//--------------------------------------

copyBtn.addEventListener(
    "click",
    async () => {

        let output =
            "Sample\tSalbolt\tSieve\tResidue\n";

        const rows =
            document.querySelectorAll(
                "#resultsTable tbody tr"
            );

        rows.forEach(
            row => {

                const cells =
                    row.querySelectorAll("td");

                const values =
                    Array.from(cells)
                        .map(
                            x => x.textContent
                        );

                output +=
                    values.join("\t")
                    + "\n";
            }
        );

        await navigator.clipboard
            .writeText(output);

        alert(
            "Copied to clipboard"
        );
    }
);
