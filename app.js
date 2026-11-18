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

const previewCanvas =
    document.getElementById(
        "previewCanvas"
    );

const previewCtx =
    previewCanvas.getContext("2d");

let files = [];

//--------------------------------------
// PSV Template
//--------------------------------------

const PSV_TEMPLATE = {
    
    salbolt: {
    
        x1: 0.2155,
        y1: 0.1795,
    
        x2: 0.3502,
        y2: 0.1898,    

        whitelist:
            "0123456789.",

        regex:
            /^\d{2,3}\.\d{2}$/
    },

    sieve: {
    
        x1: 0.2155,
        y1: 0.2896,
    
        x2: 0.3502,
        y2: 0.3032,

        whitelist:
            "0123456789.",

        regex:
            /^\d(\.\d{1,2})?$/
    },

    residue: {
    
        x1: 0.2155,
        y1: 0.5261,
    
        x2: 0.3502,
        y2: 0.5567,

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
async function renderPreview(page)
{
    const viewport =
        page.getViewport({
            scale: 3
        });

    previewCanvas.width =
        viewport.width;

    previewCanvas.height =
        viewport.height;

    await page.render({
        canvasContext: previewCtx,
        viewport
    }).promise;

    drawTemplateBoxes();
}

async function extractField(
    pageCanvas,
    field
)
{
    const crop =
        document.createElement("canvas");

    const SCALE = 5;

    const x1 =
        field.x1 * pageCanvas.width;
    
    const y1 =
        field.y1 * pageCanvas.height;
    
    const x2 =
        field.x2 * pageCanvas.width;
    
    const y2 =
        field.y2 * pageCanvas.height;
    
    const width =
        x2 - x1;
    
    const height =
        y2 - y1;
    
    crop.width =
        width * SCALE;
    
    crop.height =
        height * SCALE;
    
    const cropCtx =
        crop.getContext("2d");
    
    cropCtx.drawImage(
    
        pageCanvas,
    
        x1,
        y1,
    
        width,
        height,
    
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

function drawTemplateBoxes()
{
    const colours = {

        salbolt: "red",

        sieve: "blue",

        residue: "green"
    };

    Object.entries(
        PSV_TEMPLATE
    ).forEach(
        ([name, field]) =>
    {

        const x =
            field.x1 *
            previewCanvas.width;

        const y =
            field.y1 *
            previewCanvas.height;

        const width =
            (field.x2 - field.x1)
            * previewCanvas.width;

        const height =
            (field.y2 - field.y1)
            * previewCanvas.height;

        previewCtx.strokeStyle =
            colours[name];

        previewCtx.lineWidth = 4;

        previewCtx.strokeRect(
            x,
            y,
            width,
            height
        );

        previewCtx.fillStyle =
            colours[name];

        previewCtx.font =
            "24px Arial";

        previewCtx.fillText(
            name,
            x,
            y - 10
        );
    });
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

            if (tableBody.children.length === 0)
            {
                await renderPreview(page);
            }

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

            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            
            Object.values(PSV_TEMPLATE)
            .forEach(field => {
            
                const x =
                    field.x1 * canvas.width;
            
                const y =
                    field.y1 * canvas.height;
            
                const width =
                    (field.x2 - field.x1)
                    * canvas.width;
            
                const height =
                    (field.y2 - field.y1)
                    * canvas.height;
            
                ctx.strokeRect(
                    x,
                    y,
                    width,
                    height
                );
            });

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
